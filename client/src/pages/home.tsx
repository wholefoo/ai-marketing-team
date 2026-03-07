import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Globe,
  Zap,
  BarChart3,
  FileText,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Shield,
  Target,
  Brain,
  User,
  Mail,
  ChevronDown,
  X as XIcon,
  Check,
  Minus,
  HelpCircle,
  Star,
  DollarSign,
  Quote,
  ShieldCheck,
  Lock,
  Briefcase,
  ShoppingCart,
  Palette,
  Building2,
  Rocket,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Audit } from "@shared/schema";

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge variant="default" className="bg-emerald-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" /> Complete</Badge>;
    case "analyzing":
      return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing</Badge>;
    case "scraping":
      return <Badge variant="secondary"><Search className="w-3 h-3 mr-1 animate-spin" /> Scraping</Badge>;
    case "error":
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
    default:
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  }
}

const faqItems = [
  {
    question: "How does AI Market Audit work?",
    answer: "Enter your website URL, name, and email. Our system scrapes your website and key pages (pricing, about, services, etc.), then deploys 5 specialized AI agents simultaneously. Each agent analyzes a different aspect of your marketing -- content quality, conversion optimization, SEO, competitive positioning, and strategic planning. You receive a comprehensive report with scored results in under 3 minutes.",
  },
  {
    question: "What do the 5 AI agents analyze?",
    answer: "Content & Messaging evaluates your copy, value proposition, and brand voice. Conversion Optimization examines CTAs, forms, layout, and user journey friction. SEO & Discoverability reviews technical SEO, keywords, metadata, and site structure. Competitive Intelligence benchmarks you against industry standards and competitors. Strategy & Action Plan synthesizes all findings into a prioritized roadmap.",
  },
  {
    question: "What is included in the free preview?",
    answer: "The free preview includes your overall marketing score (0-100), a score breakdown across all 5 categories, an executive summary, and all critical and high-severity findings. This gives you a clear picture of your biggest marketing issues without any commitment.",
  },
  {
    question: "What additional content is in the full $99 report?",
    answer: "The full report unlocks detailed analysis from each AI agent including strengths, weaknesses, and specific findings across all severity levels (critical, high, medium, and low). You also get a complete 6-month action plan with prioritized tasks, timeline, and expected impact, plus a professional downloadable PDF report suitable for sharing with your team or clients.",
  },
  {
    question: "How accurate are the AI-generated insights?",
    answer: "Our agents are powered by advanced AI models trained on marketing best practices, conversion rate optimization data, SEO standards, and competitive analysis frameworks. While AI cannot replace a seasoned marketing consultant's contextual judgment, it provides a thorough, data-driven foundation that covers far more ground in minutes than a manual audit typically would in days.",
  },
  {
    question: "Can I audit competitor websites?",
    answer: "Yes. You can enter any publicly accessible website URL. Many users audit their own site first, then run audits on 2-3 competitors to compare scores and identify competitive advantages or gaps. Each audit is a separate $99 purchase for the full report.",
  },
  {
    question: "How long does an audit take?",
    answer: "Most audits complete in 1 to 3 minutes. The system scrapes your website, discovers linked pages, and runs all 5 AI agents in parallel. You can watch real-time progress as each agent completes its analysis. Complex sites with many pages may take slightly longer.",
  },
  {
    question: "Is my website data kept private?",
    answer: "We only analyze publicly accessible content on your website -- the same information any visitor would see. Scraped data is used solely for generating your audit report and is not shared with third parties. Your contact information is used only for delivering your report and is never sold.",
  },
  {
    question: "What types of websites can be audited?",
    answer: "AI Market Audit works with any publicly accessible website -- SaaS products, e-commerce stores, service businesses, agencies, personal brands, nonprofits, portfolios, and more. The AI agents automatically detect your business type and tailor their analysis accordingly.",
  },
  {
    question: "Can I get a refund if I am not satisfied?",
    answer: "Since the report is generated instantly using significant AI compute resources, we are unable to offer refunds once the full report has been unlocked. However, we encourage you to review the free preview first to ensure the audit provides value before purchasing the full report.",
  },
  {
    question: "Do you offer bulk pricing or agency plans?",
    answer: "Not currently, but we are exploring options for agencies and consultants who run multiple audits. If you are interested, reach out and let us know your volume needs.",
  },
  {
    question: "How is this different from free SEO tools?",
    answer: "Free SEO tools typically check only technical SEO factors like page speed, broken links, and meta tags. AI Market Audit goes far beyond SEO -- it evaluates your messaging clarity, conversion funnel, competitive positioning, content strategy, and provides a complete action plan. It is a full marketing audit, not just an SEO check.",
  },
];

const comparisonFeatures = [
  { feature: "AI-powered analysis", aiMarketAudit: true, traditionalAgency: true, freeSeoTools: false, diyAudit: false },
  { feature: "5 specialized audit categories", aiMarketAudit: true, traditionalAgency: true, freeSeoTools: false, diyAudit: false },
  { feature: "Results in under 3 minutes", aiMarketAudit: true, traditionalAgency: false, freeSeoTools: true, diyAudit: false },
  { feature: "Content & messaging analysis", aiMarketAudit: true, traditionalAgency: true, freeSeoTools: false, diyAudit: "partial" },
  { feature: "Conversion optimization review", aiMarketAudit: true, traditionalAgency: true, freeSeoTools: false, diyAudit: "partial" },
  { feature: "SEO & technical audit", aiMarketAudit: true, traditionalAgency: true, freeSeoTools: true, diyAudit: "partial" },
  { feature: "Competitive intelligence", aiMarketAudit: true, traditionalAgency: true, freeSeoTools: false, diyAudit: false },
  { feature: "Prioritized action plan", aiMarketAudit: true, traditionalAgency: true, freeSeoTools: false, diyAudit: false },
  { feature: "Professional PDF report", aiMarketAudit: true, traditionalAgency: true, freeSeoTools: false, diyAudit: false },
  { feature: "Severity-coded findings", aiMarketAudit: true, traditionalAgency: "partial", freeSeoTools: "partial", diyAudit: false },
  { feature: "Overall marketing score", aiMarketAudit: true, traditionalAgency: false, freeSeoTools: "partial", diyAudit: false },
  { feature: "No recurring subscription", aiMarketAudit: true, traditionalAgency: false, freeSeoTools: true, diyAudit: true },
  { feature: "Under $100", aiMarketAudit: true, traditionalAgency: false, freeSeoTools: true, diyAudit: true },
  { feature: "Free preview before purchase", aiMarketAudit: true, traditionalAgency: false, freeSeoTools: true, diyAudit: true },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-500 mx-auto" />;
  if (value === "partial") return <Minus className="w-4 h-4 text-amber-500 mx-auto" />;
  return <XIcon className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
}

function ComparisonChart() {
  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold" data-testid="text-comparison-title">How We Compare</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          See how AI Market Audit stacks up against traditional agencies, free SEO tools, and doing it yourself.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-comparison">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground min-w-[200px]">Feature</th>
                  <th className="text-center py-3 px-3 min-w-[110px]">
                    <div className="font-semibold text-primary">AI Market Audit</div>
                    <div className="text-xs text-muted-foreground font-normal">$99 one-time</div>
                  </th>
                  <th className="text-center py-3 px-3 min-w-[110px]">
                    <div className="font-semibold">Traditional Agency</div>
                    <div className="text-xs text-muted-foreground font-normal">$2,000-$10,000+</div>
                  </th>
                  <th className="text-center py-3 px-3 min-w-[110px]">
                    <div className="font-semibold">Free SEO Tools</div>
                    <div className="text-xs text-muted-foreground font-normal">$0</div>
                  </th>
                  <th className="text-center py-3 px-3 min-w-[110px]">
                    <div className="font-semibold">DIY Audit</div>
                    <div className="text-xs text-muted-foreground font-normal">Your time</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr key={i} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors" data-testid={`row-comparison-${i}`}>
                    <td className="py-3 px-4 text-sm">{row.feature}</td>
                    <td className="py-3 px-3 bg-primary/5"><FeatureCell value={row.aiMarketAudit} /></td>
                    <td className="py-3 px-3"><FeatureCell value={row.traditionalAgency} /></td>
                    <td className="py-3 px-3"><FeatureCell value={row.freeSeoTools} /></td>
                    <td className="py-3 px-3"><FeatureCell value={row.diyAudit} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Included</div>
        <div className="flex items-center gap-1.5"><Minus className="w-3.5 h-3.5 text-amber-500" /> Partial</div>
        <div className="flex items-center gap-1.5"><XIcon className="w-3.5 h-3.5 text-muted-foreground/40" /> Not included</div>
      </div>
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold" data-testid="text-faq-title">Frequently Asked Questions</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Everything you need to know about AI Market Audit and how it works.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-2" data-testid="faq-list">
        {faqItems.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <Card key={i} className="overflow-hidden" data-testid={`faq-item-${i}`}>
              <button
                className="w-full text-left py-4 px-5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                data-testid={`button-faq-${i}`}
              >
                <span className="text-sm font-medium pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 border-t">
                  <p className="text-sm text-muted-foreground leading-relaxed pt-3" data-testid={`text-faq-answer-${i}`}>
                    {item.answer}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const testimonials = [
  {
    quote: "Found 12 critical SEO issues I had missed for 6 months. The competitive analysis alone was worth the price.",
    name: "Sarah K.",
    role: "SaaS Founder",
  },
  {
    quote: "Replaced a $3,000 agency audit with a $99 AI report that was more thorough and actionable.",
    name: "Marcus T.",
    role: "E-commerce Director",
  },
  {
    quote: "The conversion optimization findings increased our landing page conversion rate by 34% in 2 weeks.",
    name: "Priya R.",
    role: "Growth Lead",
  },
  {
    quote: "As a freelance consultant, I use this to kick off every new client engagement. Saves me hours of manual analysis.",
    name: "David L.",
    role: "Marketing Consultant",
  },
];

function PricingSection() {
  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold" data-testid="text-pricing-title">Simple, Transparent Pricing</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          One audit, one price. No subscriptions, no recurring fees, no hidden costs.
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 pb-6 px-6">
            <h3 className="font-semibold text-lg mb-1" data-testid="text-free-tier">Free Preview</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">$0</span>
            </div>
            <Separator className="mb-4" />
            <ul className="space-y-2.5 text-sm">
              {[
                "Overall marketing score (0-100)",
                "Score breakdown across all 5 categories",
                "Executive summary",
                "Critical and high-severity findings",
                "Business type detection",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <CardContent className="pt-6 pb-6 px-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg" data-testid="text-paid-tier">Full Report</h3>
              <Badge className="bg-primary text-primary-foreground text-xs">Best Value</Badge>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">$99</span>
              <span className="text-sm text-muted-foreground">one-time</span>
            </div>
            <Separator className="mb-4" />
            <ul className="space-y-2.5 text-sm">
              {[
                "Everything in Free Preview",
                "Detailed analysis from all 5 AI agents",
                "All severity findings (critical to low)",
                "Strengths & weaknesses per category",
                "6-month prioritized action plan",
                "Professional PDF report download",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Less than one hour of a consultant's time. Secure payment via Stripe.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2" data-testid="trust-guarantee">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>7-day satisfaction guarantee</span>
        </div>
        <div className="flex items-center gap-2" data-testid="trust-stripe">
          <Lock className="w-4 h-4 text-primary" />
          <span>Secured by Stripe</span>
        </div>
        <div className="flex items-center gap-2" data-testid="trust-ssl">
          <Shield className="w-4 h-4 text-primary" />
          <span>SSL encrypted</span>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold" data-testid="text-testimonials-title">What Customers Say</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Trusted by founders, marketers, and agencies to uncover actionable marketing insights.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {testimonials.map((t, i) => (
          <Card key={i} data-testid={`card-testimonial-${i}`}>
            <CardContent className="pt-5 pb-5 px-5">
              <Quote className="w-5 h-5 text-primary/30 mb-2" />
              <p className="text-sm leading-relaxed text-muted-foreground mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{t.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium" data-testid={`text-testimonial-name-${i}`}>{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const personas = [
  {
    icon: <Rocket className="w-5 h-5" />,
    title: "SaaS Founders",
    description: "Identify what's preventing your product page from converting trial signups. Benchmark against competitors and get a clear growth roadmap.",
  },
  {
    icon: <ShoppingCart className="w-5 h-5" />,
    title: "E-commerce Managers",
    description: "Find conversion killers in your product pages, checkout flow, and category structure. Improve SEO to drive organic traffic.",
  },
  {
    icon: <Briefcase className="w-5 h-5" />,
    title: "Marketing Consultants",
    description: "Kick off client engagements with a data-driven baseline. Use the professional PDF report to demonstrate value from day one.",
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    title: "Agency Owners",
    description: "Quickly audit prospect websites during the sales process. Show potential clients exactly what needs fixing before they sign.",
  },
  {
    icon: <Palette className="w-5 h-5" />,
    title: "Freelancers & Creators",
    description: "Get expert-level marketing feedback on your portfolio or personal brand site without hiring an expensive consultant.",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Growth Teams",
    description: "Prioritize your marketing backlog with severity-coded findings. Focus your team on the changes that will move the needle most.",
  },
];

function WhoThisIsFor() {
  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold" data-testid="text-personas-title">Who This Is For</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Whether you are a solo founder or running a marketing team, AI Market Audit gives you the data you need to make better decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {personas.map((p, i) => (
          <Card key={i} data-testid={`card-persona-${i}`}>
            <CardContent className="pt-5 pb-5 px-5">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
                {p.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SocialProofBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-4 mb-8 text-sm text-muted-foreground" data-testid="social-proof-bar">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground">150+</span>
        <span>audits completed</span>
      </div>
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-500" />
        <span className="font-semibold text-foreground">4.8/5</span>
        <span>average rating</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground">&lt;3 min</span>
        <span>average delivery</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: audits } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
    refetchInterval: 5000,
  });

  const startAudit = useMutation({
    mutationFn: async (data: { url: string; customerName: string; customerEmail: string }) => {
      const res = await apiRequest("POST", "/api/audits", data);
      return res.json();
    },
    onSuccess: (data: Audit) => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      navigate(`/audit/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start audit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !name.trim() || !email.trim()) {
      toast({
        title: "All fields required",
        description: "Please enter your name, email, and the website URL.",
        variant: "destructive",
      });
      return;
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    startAudit.mutate({ url: normalizedUrl, customerName: name.trim(), customerEmail: email.trim() });
  };

  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "5 AI Agents",
      description: "Specialized experts analyze content, SEO, conversions, competitors, and strategy simultaneously",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Under 3 Minutes",
      description: "Parallel processing delivers comprehensive results faster than any human audit",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Scored Results",
      description: "Overall marketing score with severity-coded findings from critical to low priority",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "PDF Reports",
      description: "Professional, client-ready reports with executive summary and 6-month action plan",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">AI Market Audit</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight"
              data-testid="text-hero-title"
            >
              Know What's Holding
              <br />
              <span className="text-primary">Your Website Back</span>
            </h1>

            <p
              className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
              data-testid="text-hero-description"
            >
              5 specialized AI agents audit your content, SEO, conversions, competitive positioning, and strategy in parallel.
              Get a scored report and professional PDF in under 3 minutes -- for just $99.
            </p>

            <form
              onSubmit={handleSubmit}
              className="max-w-xl mx-auto mt-8 space-y-3"
              data-testid="form-audit"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    data-testid="input-name"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter website URL (e.g., example.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    data-testid="input-url"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={startAudit.isPending || !url.trim() || !name.trim() || !email.trim()}
                  data-testid="button-start-audit"
                >
                  {startAudit.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Audit
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        <SocialProofBar />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {features.map((feature, i) => (
            <Card key={i} className="hover-elevate">
              <CardContent className="pt-6 pb-5 px-5">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1" data-testid={`text-feature-title-${i}`}>
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <WhoThisIsFor />

        <PricingSection />

        <TestimonialsSection />

        <ComparisonChart />

        <FAQSection />

        <footer className="border-t mt-16 pt-8 pb-8 text-center text-sm text-muted-foreground" data-testid="footer">
          <p className="mb-3">AI Market Audit -- AI-Powered Marketing Audit & Strategy</p>
          <p className="mb-4">
            Questions? Contact us at{" "}
            <a href="mailto:support@aimarketaudit.com" className="text-primary hover:underline" data-testid="link-support-email">
              support@aimarketaudit.com
            </a>
          </p>
          <div className="flex items-center justify-center gap-4 mb-4 text-xs">
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-privacy">Privacy Policy</Link>
            <span className="text-muted-foreground/40">|</span>
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-terms">Terms of Service</Link>
            <span className="text-muted-foreground/40">|</span>
            <Link href="/refund" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-refund">Refund Policy</Link>
          </div>
          <p className="text-xs text-muted-foreground/70">Secure payments processed by Stripe. Your data is never sold or shared.</p>
        </footer>

        {audits && audits.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold" data-testid="text-recent-audits">
                Recent Audits
              </h2>
            </div>

            <div className="space-y-2">
              {audits.map((audit) => (
                <Card
                  key={audit.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => navigate(`/audit/${audit.id}`)}
                  data-testid={`card-audit-${audit.id}`}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate" data-testid={`text-audit-name-${audit.id}`}>
                            {audit.businessName || audit.url}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {audit.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                        {audit.overallScore !== null && audit.overallScore !== undefined && (
                          <span
                            className={`text-lg font-bold ${getScoreColor(audit.overallScore)}`}
                            data-testid={`text-audit-score-${audit.id}`}
                          >
                            {audit.overallScore}
                          </span>
                        )}
                        {getStatusBadge(audit.status)}
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
