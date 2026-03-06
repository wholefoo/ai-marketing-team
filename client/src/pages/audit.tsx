import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Globe,
  Brain,
  Target,
  Search,
  Users,
  Map,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  TrendingUp,
  Zap,
  Lock,
  CreditCard,
} from "lucide-react";
import type { Audit, AuditProgress, Finding, ActionItem, AgentAnalysis } from "@shared/schema";

const AGENT_CONFIG = {
  content: { label: "Content & Messaging", icon: Brain, color: "text-violet-500", bg: "bg-violet-500/10" },
  conversion: { label: "Conversion Optimization", icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  seo: { label: "SEO & Discoverability", icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" },
  competitive: { label: "Competitive Intelligence", icon: Users, color: "text-orange-500", bg: "bg-orange-500/10" },
  strategy: { label: "Strategy & Action Plan", icon: Map, color: "text-pink-500", bg: "bg-pink-500/10" },
} as const;

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreGradient(score: number) {
  if (score >= 80) return "from-emerald-500 to-emerald-600";
  if (score >= 60) return "from-amber-500 to-amber-600";
  if (score >= 40) return "from-orange-500 to-orange-600";
  return "from-red-500 to-red-600";
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical": return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "high": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case "medium": return <Info className="w-4 h-4 text-amber-500" />;
    case "low": return <Info className="w-4 h-4 text-blue-500" />;
    default: return <Info className="w-4 h-4 text-muted-foreground" />;
  }
}

function getSeverityBadge(severity: string) {
  const variants: Record<string, string> = {
    critical: "bg-red-500/10 text-red-600 dark:text-red-400",
    high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
  return (
    <Badge variant="outline" className={`${variants[severity] || ""} border-0 text-xs font-medium`}>
      {severity.toUpperCase()}
    </Badge>
  );
}

function AgentStatusDot({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
  if (status === "error") return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

function ProgressView({ progress }: { progress: AuditProgress }) {
  const agentEntries = Object.entries(progress.agents) as [keyof typeof AGENT_CONFIG, string][];
  const completedCount = agentEntries.filter(([, s]) => s === "complete").length;
  const totalAgents = agentEntries.length;
  const percentComplete =
    progress.status === "scraping" ? 10 :
    progress.status === "analyzing" ? 15 + (completedCount / totalAgents) * 70 :
    progress.status === "complete" ? 100 : 5;

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-2" data-testid="text-progress-title">
          Analyzing Website
        </h2>
        <p className="text-muted-foreground" data-testid="text-progress-phase">
          {progress.phase}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(percentComplete)}%</span>
        </div>
        <Progress value={percentComplete} className="h-2" data-testid="progress-bar" />
      </div>

      <div className="space-y-3">
        {agentEntries.map(([key, status]) => {
          const config = AGENT_CONFIG[key];
          const Icon = config.icon;
          return (
            <Card key={key} data-testid={`card-agent-status-${key}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <AgentStatusDot status={status} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const colorClass = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/30"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className={colorClass}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${colorClass}`} data-testid="text-overall-score">
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function PaywallCard({ auditId, onUnlock }: { auditId: number; onUnlock: () => void }) {
  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkout", { auditId });
      return res.json();
    },
    onSuccess: (data: { url?: string; alreadyPaid?: boolean }) => {
      if (data.alreadyPaid) {
        onUnlock();
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="py-10 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2" data-testid="text-paywall-title">Unlock Full Report</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Get access to detailed findings from all 5 AI agents, complete agent reports with strengths and weaknesses,
          a prioritized 6-month action plan, and a downloadable professional PDF report.
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">$29</span>
            <span className="text-sm text-muted-foreground">one-time</span>
          </div>
          <Button
            size="lg"
            onClick={() => checkout.mutate()}
            disabled={checkout.isPending}
            className="min-w-[200px]"
            data-testid="button-unlock-report"
          >
            {checkout.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            {checkout.isPending ? "Redirecting..." : "Unlock Full Report"}
          </Button>
          <p className="text-xs text-muted-foreground">Secure payment via Stripe</p>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
          {[
            "Detailed AI agent reports",
            "All severity findings",
            "6-month action plan",
            "Professional PDF report",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AgentSection({ analysis, config }: { analysis: AgentAnalysis; config: typeof AGENT_CONFIG[keyof typeof AGENT_CONFIG] }) {
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-md ${config.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <h3 className="font-semibold">{config.label}</h3>
          <span className={`text-sm font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score}/100
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>

      {analysis.strengths?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Strengths</h4>
          <ul className="space-y-1">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.weaknesses?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Weaknesses</h4>
          <ul className="space-y-1">
            {analysis.weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.findings?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Findings</h4>
          <div className="space-y-2">
            {analysis.findings.map((finding: Finding, i: number) => (
              <Card key={i}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(finding.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium">{finding.title}</span>
                        {getSeverityBadge(finding.severity)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{finding.description}</p>
                      <p className="text-xs text-primary">{finding.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const auditId = parseInt(params.id || "0");

  const searchParams = new URLSearchParams(searchString);
  const paymentStatus = searchParams.get("payment");
  const sessionId = searchParams.get("session_id");

  const { data: audit, refetch } = useQuery<Audit>({
    queryKey: ["/api/audits", auditId],
    enabled: auditId > 0,
    refetchInterval: (query) => {
      const data = query.state.data as Audit | undefined;
      if (data?.status === "complete" || data?.status === "error") return false;
      return 3000;
    },
  });

  useEffect(() => {
    if (paymentStatus === "success" && sessionId && auditId && !paymentVerified) {
      fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, auditId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.paid) {
            setPaymentVerified(true);
            queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId] });
            refetch();
            window.history.replaceState({}, "", `/audit/${auditId}`);
          }
        })
        .catch(console.error);
    }
  }, [paymentStatus, sessionId, auditId, paymentVerified, refetch]);

  useEffect(() => {
    if (!auditId || audit?.status === "complete" || audit?.status === "error") return;

    const es = new EventSource(`/api/audits/${auditId}/progress`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AuditProgress;
        setProgress(data);
        if (data.status === "complete") {
          refetch();
          es.close();
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [auditId, audit?.status]);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/pdf`);
      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketing_audit_${audit?.businessName || audit?.url || "report"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleUnlock = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId] });
    refetch();
  };

  if (!audit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isInProgress = audit.status !== "complete" && audit.status !== "error";
  const isPaid = audit.paid;

  if (isInProgress) {
    const displayProgress = progress || {
      auditId: audit.id,
      status: audit.status,
      phase: audit.status === "scraping" ? "Scraping website..." : audit.status === "analyzing" ? "Running AI agents..." : "Starting audit...",
      agents: {
        content: "pending" as const,
        conversion: "pending" as const,
        seo: "pending" as const,
        competitive: "pending" as const,
        strategy: "pending" as const,
      },
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">{audit.url}</span>
            </div>
          </div>
        </div>
        <ProgressView progress={displayProgress} />
      </div>
    );
  }

  if (audit.status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground truncate">{audit.url}</span>
          </div>
        </div>
        <div className="max-w-md mx-auto py-20 text-center px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Audit Failed</h2>
          <p className="text-muted-foreground mb-6">
            Something went wrong while analyzing this website. The site may be unreachable or blocking automated requests.
          </p>
          <Button onClick={() => navigate("/")} data-testid="button-try-again">Try Another URL</Button>
        </div>
      </div>
    );
  }

  const allFindings = (audit.findings as Finding[]) || [];
  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  const mediumCount = isPaid ? allFindings.filter((f) => f.severity === "medium").length : 0;
  const lowCount = isPaid ? allFindings.filter((f) => f.severity === "low").length : 0;
  const actionPlan = (audit.actionPlan as ActionItem[]) || [];

  const scoreItems = [
    { key: "content" as const, score: audit.contentScore || 0, ...AGENT_CONFIG.content },
    { key: "conversion" as const, score: audit.conversionScore || 0, ...AGENT_CONFIG.conversion },
    { key: "seo" as const, score: audit.seoScore || 0, ...AGENT_CONFIG.seo },
    { key: "competitive" as const, score: audit.competitiveScore || 0, ...AGENT_CONFIG.competitive },
    { key: "strategy" as const, score: audit.strategyScore || 0, ...AGENT_CONFIG.strategy },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate" data-testid="text-audit-title">
                {audit.businessName || audit.url}
              </h1>
              <p className="text-xs text-muted-foreground truncate">{audit.url}</p>
            </div>
          </div>
          {isPaid ? (
            <Button onClick={handleDownloadPDF} disabled={downloading} data-testid="button-download-pdf">
              {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {downloading ? "Generating..." : "Download PDF"}
            </Button>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" />
              Free Preview
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6 flex flex-col items-center">
              <ScoreRing score={audit.overallScore || 0} />
              <h3 className="text-sm font-semibold mt-3">Overall Marketing Score</h3>
              {audit.businessType && (
                <Badge variant="secondary" className="mt-2">{audit.businessType}</Badge>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scoreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-md ${item.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                      <span className="text-sm flex-shrink-0 w-44">{item.label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(item.score)}`}
                          style={{ width: `${item.score}%`, transition: "width 1s ease-out" }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-8 text-right ${getScoreColor(item.score)}`}>
                        {item.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{highCount}</div>
              <div className="text-xs text-muted-foreground">High</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              {isPaid ? (
                <div className="text-2xl font-bold text-amber-500">{mediumCount}</div>
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground mx-auto" />
              )}
              <div className="text-xs text-muted-foreground">Medium</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              {isPaid ? (
                <div className="text-2xl font-bold text-blue-500">{lowCount}</div>
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground mx-auto" />
              )}
              <div className="text-xs text-muted-foreground">Low</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList data-testid="tabs-audit-sections">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="findings" data-testid="tab-findings" className="gap-1">
              Findings
              {!isPaid && <Lock className="w-3 h-3" />}
            </TabsTrigger>
            <TabsTrigger value="agents" data-testid="tab-agents" className="gap-1">
              Agent Reports
              {!isPaid && <Lock className="w-3 h-3" />}
            </TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions" className="gap-1">
              Action Plan
              {!isPaid && <Lock className="w-3 h-3" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {audit.executiveSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="text-executive-summary">
                    {audit.executiveSummary}
                  </p>
                </CardContent>
              </Card>
            )}

            {allFindings.filter((f) => f.severity === "critical" || f.severity === "high").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Priority Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allFindings
                      .filter((f) => f.severity === "critical" || f.severity === "high")
                      .map((finding, i) => (
                        <div key={i} className="flex items-start gap-3">
                          {getSeverityIcon(finding.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-sm font-medium">{finding.title}</span>
                              {getSeverityBadge(finding.severity)}
                              <Badge variant="outline" className="text-xs">{finding.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{finding.description}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!isPaid && (
              <PaywallCard auditId={auditId} onUnlock={handleUnlock} />
            )}
          </TabsContent>

          <TabsContent value="findings" className="space-y-4">
            {isPaid ? (
              <>
                {["critical", "high", "medium", "low"].map((severity) => {
                  const items = allFindings.filter((f) => f.severity === severity);
                  if (!items.length) return null;
                  return (
                    <Card key={severity}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(severity)}
                          <CardTitle className="text-base capitalize">{severity} ({items.length})</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {items.map((finding, i) => (
                            <div key={i}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-medium">{finding.title}</span>
                                <Badge variant="outline" className="text-xs">{finding.category}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{finding.description}</p>
                              <p className="text-xs text-primary">
                                {finding.recommendation}
                              </p>
                              {i < items.length - 1 && <Separator className="mt-3" />}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              <PaywallCard auditId={auditId} onUnlock={handleUnlock} />
            )}
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            {isPaid ? (
              <>
                {Object.entries(AGENT_CONFIG).map(([key, config]) => {
                  const analysisKey = `${key}Analysis` as keyof Audit;
                  const analysis = audit[analysisKey] as AgentAnalysis | null;
                  if (!analysis) return null;
                  return (
                    <Card key={key}>
                      <CardContent className="pt-6">
                        <AgentSection analysis={analysis} config={config} />
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              <PaywallCard auditId={auditId} onUnlock={handleUnlock} />
            )}
          </TabsContent>

          <TabsContent value="actions">
            {isPaid ? (
              actionPlan.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">6-Month Prioritized Action Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {actionPlan.map((item, i) => (
                        <div key={i} data-testid={`card-action-${i}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-primary">{item.priority || i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
                              <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.timeline}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Impact: {item.impact}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Effort: {item.effort}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {i < actionPlan.length - 1 && <Separator className="mt-4" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Map className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No action plan available</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <PaywallCard auditId={auditId} onUnlock={handleUnlock} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
