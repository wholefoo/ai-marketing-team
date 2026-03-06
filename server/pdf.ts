import PDFDocument from "pdfkit";
import type { Audit, Finding, ActionItem, AgentAnalysis } from "@shared/schema";

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#DC2626";
    case "high": return "#EA580C";
    case "medium": return "#CA8A04";
    case "low": return "#2563EB";
    default: return "#6B7280";
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#16A34A";
  if (score >= 60) return "#CA8A04";
  if (score >= 40) return "#EA580C";
  return "#DC2626";
}

export function generatePDF(audit: Audit): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100;

    doc.rect(0, 0, doc.page.width, 160).fill("#0F172A");
    doc.fontSize(28).fillColor("#FFFFFF").text("Marketing Audit Report", 50, 50, { width: pageWidth });
    doc.fontSize(12).fillColor("#94A3B8").text(audit.url, 50, 90, { width: pageWidth });
    doc.fontSize(10).fillColor("#64748B").text(
      `Generated: ${new Date(audit.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      50,
      110,
      { width: pageWidth }
    );
    if (audit.businessName) {
      doc.fontSize(10).fillColor("#64748B").text(`Business: ${audit.businessName} (${audit.businessType || "General"})`, 50, 125, { width: pageWidth });
    }

    doc.moveDown(4);
    doc.y = 180;

    doc.fontSize(20).fillColor("#0F172A").text("Overall Marketing Score", 50, doc.y);
    doc.moveDown(0.5);

    const score = audit.overallScore || 0;
    const scoreColor = getScoreColor(score);
    doc.fontSize(48).fillColor(scoreColor).text(`${score}`, 50, doc.y, { continued: true });
    doc.fontSize(20).fillColor("#94A3B8").text(" / 100");
    doc.moveDown(1);

    const scores = [
      { name: "Content & Messaging", score: audit.contentScore || 0 },
      { name: "Conversion Optimization", score: audit.conversionScore || 0 },
      { name: "SEO & Discoverability", score: audit.seoScore || 0 },
      { name: "Competitive Intelligence", score: audit.competitiveScore || 0 },
      { name: "Strategy & Planning", score: audit.strategyScore || 0 },
    ];

    const barY = doc.y;
    scores.forEach((item, i) => {
      const y = barY + i * 35;
      doc.fontSize(9).fillColor("#475569").text(item.name, 50, y, { width: 160 });
      doc.rect(220, y + 2, 250, 12).fill("#E2E8F0");
      doc.rect(220, y + 2, (item.score / 100) * 250, 12).fill(getScoreColor(item.score));
      doc.fontSize(9).fillColor("#0F172A").text(`${item.score}`, 480, y, { width: 30 });
    });

    doc.y = barY + scores.length * 35 + 20;

    if (audit.executiveSummary) {
      doc.addPage();
      doc.fontSize(18).fillColor("#0F172A").text("Executive Summary", 50, 50);
      doc.moveDown(0.5);
      doc.rect(50, doc.y, 60, 3).fill("#3B82F6");
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#334155").text(audit.executiveSummary, 50, doc.y, {
        width: pageWidth,
        lineGap: 4,
      });
    }

    const agentSections: { title: string; data: any }[] = [
      { title: "Content & Messaging Analysis", data: audit.contentAnalysis },
      { title: "Conversion Optimization Analysis", data: audit.conversionAnalysis },
      { title: "SEO & Discoverability Analysis", data: audit.seoAnalysis },
      { title: "Competitive Intelligence Analysis", data: audit.competitiveAnalysis },
      { title: "Strategy & Action Plan Analysis", data: audit.strategyAnalysis },
    ];

    agentSections.forEach((section) => {
      if (!section.data) return;
      const analysis = section.data as AgentAnalysis;

      doc.addPage();
      doc.fontSize(18).fillColor("#0F172A").text(section.title, 50, 50);
      doc.moveDown(0.3);
      doc.rect(50, doc.y, 60, 3).fill("#3B82F6");
      doc.moveDown(0.5);

      doc.fontSize(11).fillColor(getScoreColor(analysis.score)).text(`Score: ${analysis.score}/100`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#334155").text(analysis.summary, { width: pageWidth, lineGap: 3 });
      doc.moveDown(0.8);

      if (analysis.strengths?.length) {
        doc.fontSize(12).fillColor("#16A34A").text("Strengths");
        doc.moveDown(0.3);
        analysis.strengths.forEach((s: string) => {
          if (doc.y > 700) doc.addPage();
          doc.fontSize(9).fillColor("#334155").text(`  +  ${s}`, { width: pageWidth - 20, lineGap: 2 });
        });
        doc.moveDown(0.5);
      }

      if (analysis.weaknesses?.length) {
        doc.fontSize(12).fillColor("#DC2626").text("Weaknesses");
        doc.moveDown(0.3);
        analysis.weaknesses.forEach((w: string) => {
          if (doc.y > 700) doc.addPage();
          doc.fontSize(9).fillColor("#334155").text(`  -  ${w}`, { width: pageWidth - 20, lineGap: 2 });
        });
        doc.moveDown(0.5);
      }

      if (analysis.findings?.length) {
        doc.fontSize(12).fillColor("#0F172A").text("Key Findings");
        doc.moveDown(0.3);
        analysis.findings.forEach((finding: Finding) => {
          if (doc.y > 660) doc.addPage();
          const color = getSeverityColor(finding.severity);
          doc.fontSize(9).fillColor(color).text(`[${finding.severity.toUpperCase()}] ${finding.title}`);
          doc.fontSize(8).fillColor("#64748B").text(finding.description, { width: pageWidth - 20, lineGap: 2 });
          doc.fontSize(8).fillColor("#3B82F6").text(`Recommendation: ${finding.recommendation}`, { width: pageWidth - 20, lineGap: 2 });
          doc.moveDown(0.4);
        });
      }
    });

    const actionPlan = audit.actionPlan as ActionItem[] | null;
    if (actionPlan?.length) {
      doc.addPage();
      doc.fontSize(18).fillColor("#0F172A").text("6-Month Action Plan", 50, 50);
      doc.moveDown(0.3);
      doc.rect(50, doc.y, 60, 3).fill("#3B82F6");
      doc.moveDown(0.8);

      actionPlan.forEach((item: ActionItem, index: number) => {
        if (doc.y > 660) doc.addPage();
        doc.fontSize(11).fillColor("#0F172A").text(`${index + 1}. ${item.title}`);
        doc.fontSize(9).fillColor("#334155").text(item.description, { width: pageWidth - 20, lineGap: 2 });
        doc.fontSize(8).fillColor("#64748B").text(
          `Timeline: ${item.timeline}  |  Impact: ${item.impact}  |  Effort: ${item.effort}`,
          { width: pageWidth }
        );
        doc.moveDown(0.6);
      });
    }

    const allFindings = (audit.findings as Finding[]) || [];
    if (allFindings.length) {
      doc.addPage();
      doc.fontSize(18).fillColor("#0F172A").text("All Findings Summary", 50, 50);
      doc.moveDown(0.3);
      doc.rect(50, doc.y, 60, 3).fill("#3B82F6");
      doc.moveDown(0.8);

      const grouped = {
        critical: allFindings.filter((f) => f.severity === "critical"),
        high: allFindings.filter((f) => f.severity === "high"),
        medium: allFindings.filter((f) => f.severity === "medium"),
        low: allFindings.filter((f) => f.severity === "low"),
      };

      Object.entries(grouped).forEach(([severity, findings]) => {
        if (!findings.length) return;
        doc.fontSize(12).fillColor(getSeverityColor(severity)).text(
          `${severity.toUpperCase()} (${findings.length})`
        );
        doc.moveDown(0.3);
        findings.forEach((f) => {
          if (doc.y > 680) doc.addPage();
          doc.fontSize(9).fillColor("#0F172A").text(`${f.title} - ${f.category}`);
          doc.fontSize(8).fillColor("#64748B").text(f.description, { width: pageWidth - 20, lineGap: 2 });
          doc.moveDown(0.3);
        });
        doc.moveDown(0.5);
      });
    }

    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor("#94A3B8").text(
        `AI Marketing Audit Report  |  ${audit.url}  |  Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 40,
        { width: pageWidth, align: "center" }
      );
    }

    doc.end();
  });
}
