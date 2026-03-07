import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default function RefundPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">AI Market Audit</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-refund-title">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Satisfaction Guarantee</h2>
            <p>We stand behind the quality of our AI-powered marketing audits. If you are not satisfied with the quality of your audit report, contact us within 7 days of purchase and we will work with you to resolve the issue.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">How Refunds Work</h2>
            <p>To request a refund or report an issue with your audit:</p>
            <ol className="list-decimal pl-6 space-y-1 mt-2">
              <li>Email us at <a href="mailto:support@aimarketaudit.com" className="text-primary hover:underline">support@aimarketaudit.com</a> within 7 days of your purchase.</li>
              <li>Include your audit URL and a description of the issue.</li>
              <li>We will review your request and respond within 2 business days.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Eligible Refund Scenarios</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>The audit failed to complete due to a technical error on our end.</li>
              <li>The report contains substantially inaccurate or irrelevant findings due to a system error.</li>
              <li>The website was inaccessible during the audit, resulting in incomplete analysis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Non-Refundable Scenarios</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Disagreement with subjective AI-generated recommendations (AI analysis represents automated best-practice evaluation and may differ from personal preferences).</li>
              <li>Changes to your website after the audit was completed.</li>
              <li>Requests made more than 7 days after purchase.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Free Preview</h2>
            <p>We offer a free preview of every audit -- including your overall marketing score, category breakdown, executive summary, and critical findings -- so you can evaluate the quality and relevance of the analysis before purchasing the full report. We encourage all users to review the free preview before making a purchase decision.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
            <p>For refund requests or questions, email <a href="mailto:support@aimarketaudit.com" className="text-primary hover:underline">support@aimarketaudit.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
