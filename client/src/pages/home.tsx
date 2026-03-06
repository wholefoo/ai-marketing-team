import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
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

export default function Home() {
  const [url, setUrl] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: audits } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
    refetchInterval: 5000,
  });

  const startAudit = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/audits", { url });
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
    if (!url.trim()) return;

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    startAudit.mutate(normalizedUrl);
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
              AI-Powered Marketing
              <br />
              <span className="text-primary">Audit & Strategy</span>
            </h1>

            <p
              className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
              data-testid="text-hero-description"
            >
              Enter any website URL and get a comprehensive marketing audit powered by 5 specialized AI agents
              working in parallel. Receive actionable insights and a professional PDF report in minutes.
            </p>

            <form
              onSubmit={handleSubmit}
              className="max-w-xl mx-auto mt-8"
              data-testid="form-audit"
            >
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
                  disabled={startAudit.isPending || !url.trim()}
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
