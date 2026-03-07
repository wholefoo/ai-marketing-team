import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold mb-2" data-testid="text-privacy-title">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>When you use AI Market Audit, we collect the following information:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Contact information:</strong> Your name and email address, provided when you start an audit.</li>
              <li><strong>Website data:</strong> Publicly accessible content from the URL you submit for auditing, including page text, headings, meta tags, and linked pages.</li>
              <li><strong>Payment information:</strong> Payment details are processed securely by Stripe and are never stored on our servers. We receive only confirmation of payment status.</li>
              <li><strong>Usage data:</strong> Anonymous analytics data collected via Google Analytics, including pages visited, time on site, and referral sources.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To generate and deliver your marketing audit report.</li>
              <li>To process payments for full report access.</li>
              <li>To communicate with you about your audit results if needed.</li>
              <li>To improve our service and AI agent accuracy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Data Sharing</h2>
            <p>We do not sell, rent, or share your personal information with third parties for marketing purposes. We share data only with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Stripe:</strong> For secure payment processing.</li>
              <li><strong>AI providers:</strong> Website content is sent to AI models for analysis. This data is used solely for generating your report and is not retained by AI providers for training.</li>
              <li><strong>Google Analytics:</strong> Anonymous usage data for site improvement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Website Data</h2>
            <p>We only analyze publicly accessible content on your website -- the same information any visitor would see. We do not access password-protected areas, private databases, or internal systems. Scraped website data is used solely for generating your audit report.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Retention</h2>
            <p>Audit reports and associated data are retained to allow you to access your results. You may request deletion of your data at any time by contacting us at support@aimarketaudit.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Security</h2>
            <p>We implement industry-standard security measures to protect your data. All connections are encrypted via SSL/TLS. Payment processing is handled entirely by Stripe, a PCI-compliant payment processor.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction or deletion of your personal data.</li>
              <li>Opt out of analytics tracking by using browser privacy settings or extensions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:support@aimarketaudit.com" className="text-primary hover:underline">support@aimarketaudit.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
