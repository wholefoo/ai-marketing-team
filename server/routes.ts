import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeWebsite } from "./scraper";
import { runAgent, generateExecutiveSummary, detectBusinessType } from "./agents";
import { generatePDF } from "./pdf";
import { auditRequestSchema } from "@shared/schema";
import type { Finding, AgentAnalysis, AuditProgress } from "@shared/schema";

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

  return httpServer;
}

async function runAuditPipeline(auditId: number, url: string) {
  const progress = auditProgress.get(auditId)!;

  try {
    progress.status = "scraping";
    progress.phase = "Scraping website...";
    await storage.updateAudit(auditId, { status: "scraping" });

    const scrapedData = await scrapeWebsite(url);
    const businessType = detectBusinessType(scrapedData);
    const businessName = scrapedData.title.split("|")[0].split("-")[0].trim() || url;

    await storage.updateAudit(auditId, {
      scrapedData: scrapedData as any,
      businessName,
      businessType,
      status: "analyzing",
    });

    progress.status = "analyzing";
    progress.phase = "Running AI agents in parallel...";

    const agentTypes = ["content", "conversion", "seo", "competitive", "strategy"] as const;

    const agentPromises = agentTypes.map(async (type) => {
      progress.agents[type] = "running";
      try {
        const result = await runAgent(type, scrapedData);
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

    progress.phase = "Generating executive summary...";

    const { summary, actionPlan } = await generateExecutiveSummary(url, analyses, overallScore);

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
