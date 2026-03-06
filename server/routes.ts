import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeWebsite } from "./scraper";
import { runAgent, generateExecutiveSummary, detectBusinessType } from "./agents";
import { generatePDF } from "./pdf";
import { auditRequestSchema } from "@shared/schema";
import type { Finding, AgentAnalysis, AuditProgress } from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";

const auditProgress = new Map<number, AuditProgress>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/audits", async (req, res) => {
    try {
      const parsed = auditRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const audit = await storage.createAudit({
        url: parsed.data.url,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        status: "pending",
      });

      auditProgress.set(audit.id, {
        auditId: audit.id,
        status: "pending",
        phase: "Starting audit...",
        agents: {
          content: "pending",
          conversion: "pending",
          seo: "pending",
          competitive: "pending",
          strategy: "pending",
        },
      });

      runAuditPipeline(audit.id, parsed.data.url).catch((err) => {
        console.error("Audit pipeline error:", err);
      });

      return res.status(201).json(audit);
    } catch (error: any) {
      console.error("Error creating audit:", error);
      return res.status(500).json({ error: "Failed to create audit" });
    }
  });

  app.get("/api/audits", async (req, res) => {
    try {
      const audits = await storage.getAllAudits();
      return res.json(audits);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch audits" });
    }
  });

  app.get("/api/audits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const audit = await storage.getAudit(id);
      if (!audit) return res.status(404).json({ error: "Audit not found" });

      if (audit.status === "complete" && !audit.paid) {
        const gatedAudit = {
          ...audit,
          contentAnalysis: null,
          conversionAnalysis: null,
          seoAnalysis: null,
          competitiveAnalysis: null,
          strategyAnalysis: null,
          findings: audit.findings
            ? (audit.findings as Finding[]).filter(f => f.severity === "critical" || f.severity === "high")
            : null,
          actionPlan: null,
        };
        return res.json(gatedAudit);
      }

      return res.json(audit);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch audit" });
    }
  });

  app.get("/api/audits/:id/progress", (req, res) => {
    const id = parseInt(req.params.id);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const sendProgress = () => {
      const progress = auditProgress.get(id);
      if (progress) {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      }
    };

    sendProgress();

    const interval = setInterval(sendProgress, 1000);

    req.on("close", () => {
      clearInterval(interval);
    });
  });

  app.get("/api/audits/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const audit = await storage.getAudit(id);
      if (!audit) return res.status(404).json({ error: "Audit not found" });
      if (audit.status !== "complete") return res.status(400).json({ error: "Audit not complete" });
      if (!audit.paid) return res.status(403).json({ error: "Payment required to download PDF" });

      const pdfBuffer = await generatePDF(audit);

      const safeName = (audit.businessName || audit.url).replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="marketing_audit_${safeName}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      return res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      return res.json({ publishableKey: key });
    } catch (error) {
      return res.status(500).json({ error: "Failed to get Stripe key" });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const { auditId } = req.body;
      if (!auditId) return res.status(400).json({ error: "auditId is required" });

      const audit = await storage.getAudit(auditId);
      if (!audit) return res.status(404).json({ error: "Audit not found" });
      if (audit.paid) return res.json({ alreadyPaid: true });

      const stripe = await getUncachableStripeClient();

      const priceResult = await db.execute(
        sql`SELECT pr.id as price_id FROM stripe.products p JOIN stripe.prices pr ON pr.product = p.id WHERE p.active = true AND pr.active = true AND p.metadata->>'type' = 'one_time_audit' LIMIT 1`
      );

      let priceId: string;

      if (priceResult.rows.length > 0) {
        priceId = priceResult.rows[0].price_id as string;
      } else {
        const products = await stripe.products.search({ query: "name:'Full Marketing Audit Report'" });
        if (products.data.length > 0) {
          const prices = await stripe.prices.list({ product: products.data[0].id, active: true, limit: 1 });
          if (prices.data.length > 0) {
            priceId = prices.data[0].id;
          } else {
            return res.status(500).json({ error: "No price configured" });
          }
        } else {
          return res.status(500).json({ error: "No product configured" });
        }
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${baseUrl}/audit/${auditId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/audit/${auditId}?payment=cancelled`,
        metadata: {
          auditId: String(auditId),
        },
      });

      await storage.updateAudit(auditId, { stripeSessionId: session.id });

      return res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { sessionId, auditId } = req.body;
      if (!sessionId || !auditId) {
        return res.status(400).json({ error: "sessionId and auditId are required" });
      }

      const audit = await storage.getAudit(auditId);
      if (!audit) return res.status(404).json({ error: "Audit not found" });
      if (audit.paid) return res.json({ paid: true });

      if (audit.stripeSessionId !== sessionId) {
        return res.status(403).json({ error: "Session does not match this audit" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (
        session.payment_status === "paid" &&
        session.metadata?.auditId === String(auditId) &&
        session.id === audit.stripeSessionId
      ) {
        await storage.updateAudit(auditId, { paid: true });
        return res.json({ paid: true });
      }

      return res.json({ paid: false });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      return res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: "Password is required" });

      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const token = Buffer.from(`admin:${Date.now()}`).toString("base64");
      return res.json({ token });
    } catch (error) {
      return res.status(500).json({ error: "Login failed" });
    }
  });

  function verifyAdmin(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.slice(7);
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      if (!decoded.startsWith("admin:")) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const timestamp = parseInt(decoded.split(":")[1]);
      const hoursSinceLogin = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (hoursSinceLogin > 24) {
        return res.status(401).json({ error: "Token expired" });
      }
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  }

  app.get("/api/admin/dashboard", verifyAdmin, async (req, res) => {
    try {
      const allAudits = await storage.getAllAudits();

      const totalAudits = allAudits.length;
      const completedAudits = allAudits.filter(a => a.status === "complete").length;
      const paidAudits = allAudits.filter(a => a.paid).length;
      const totalRevenue = paidAudits * 99;
      const errorAudits = allAudits.filter(a => a.status === "error").length;
      const pendingAudits = allAudits.filter(a => a.status !== "complete" && a.status !== "error").length;

      const auditSummaries = allAudits.map(a => ({
        id: a.id,
        url: a.url,
        businessName: a.businessName,
        businessType: a.businessType,
        status: a.status,
        overallScore: a.overallScore,
        paid: a.paid,
        customerName: a.customerName,
        customerEmail: a.customerEmail,
        createdAt: a.createdAt,
      }));

      return res.json({
        stats: {
          totalAudits,
          completedAudits,
          paidAudits,
          totalRevenue,
          errorAudits,
          pendingAudits,
        },
        audits: auditSummaries,
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  return httpServer;
}

async function runAuditPipeline(auditId: number, url: string) {
  const progress = auditProgress.get(auditId)!;

  try {
    progress.status = "scraping";
    progress.phase = "Phase 1: Discovery - Scraping website & key pages...";
    await storage.updateAudit(auditId, { status: "scraping" });

    const scrapedData = await scrapeWebsite(url);
    const businessType = detectBusinessType(scrapedData);
    const businessName = scrapedData.title.split("|")[0].split("-")[0].trim() || url;

    progress.phase = `Phase 1: Complete - Detected ${businessType} business, found ${scrapedData.keyPages.length} key pages`;

    await storage.updateAudit(auditId, {
      scrapedData: scrapedData as any,
      businessName,
      businessType,
      status: "analyzing",
    });

    progress.status = "analyzing";
    progress.phase = "Phase 2: Running 5 specialized AI agents in parallel...";

    const agentTypes = ["content", "conversion", "seo", "competitive", "strategy"] as const;

    const agentPromises = agentTypes.map(async (type) => {
      progress.agents[type] = "running";
      try {
        const result = await runAgent(type, scrapedData, businessType);
        progress.agents[type] = "complete";
        return { type, result };
      } catch (error) {
        console.error(`Agent ${type} failed:`, error);
        progress.agents[type] = "error";
        return {
          type,
          result: {
            score: 0,
            summary: "Analysis failed",
            strengths: [],
            weaknesses: [],
            findings: [],
            recommendations: [],
          } as AgentAnalysis,
        };
      }
    });

    const agentResults = await Promise.all(agentPromises);

    const analyses: Record<string, AgentAnalysis> = {};
    agentResults.forEach(({ type, result }) => {
      analyses[type] = result;
    });

    const scores = agentResults.map((r) => r.result.score);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const allFindings: Finding[] = agentResults.flatMap((r) => r.result.findings || []);

    await storage.updateAudit(auditId, {
      contentScore: analyses.content.score,
      conversionScore: analyses.conversion.score,
      seoScore: analyses.seo.score,
      competitiveScore: analyses.competitive.score,
      strategyScore: analyses.strategy.score,
      overallScore,
      contentAnalysis: analyses.content as any,
      conversionAnalysis: analyses.conversion as any,
      seoAnalysis: analyses.seo as any,
      competitiveAnalysis: analyses.competitive as any,
      strategyAnalysis: analyses.strategy as any,
      findings: allFindings as any,
    });

    progress.phase = "Phase 3: Synthesizing results & building action plan...";

    const { summary, actionPlan } = await generateExecutiveSummary(url, businessType, analyses, overallScore);

    await storage.updateAudit(auditId, {
      executiveSummary: summary,
      actionPlan: actionPlan as any,
      status: "complete",
    });

    progress.status = "complete";
    progress.phase = "Audit complete!";
  } catch (error: any) {
    console.error("Audit pipeline failed:", error);
    progress.status = "error";
    progress.phase = `Error: ${error.message || "Unknown error"}`;
    progress.message = error.message;
    await storage.updateAudit(auditId, { status: "error" });
  }
}
