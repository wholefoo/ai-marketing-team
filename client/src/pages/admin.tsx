import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Lock,
  Loader2,
  DollarSign,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Mail,
  User,
  TrendingUp,
  Search,
} from "lucide-react";

interface AuditSummary {
  id: number;
  url: string;
  businessName: string | null;
  businessType: string | null;
  status: string;
  overallScore: number | null;
  paid: boolean;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
}

interface DashboardData {
  stats: {
    totalAudits: number;
    completedAudits: number;
    paidAudits: number;
    totalRevenue: number;
    errorAudits: number;
    pendingAudits: number;
  };
  audits: AuditSummary[];
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge variant="default" className="bg-emerald-600 text-white text-xs">Complete</Badge>;
    case "analyzing":
      return <Badge variant="secondary" className="text-xs">Analyzing</Badge>;
    case "scraping":
      return <Badge variant="secondary" className="text-xs">Scraping</Badge>;
    case "error":
      return <Badge variant="destructive" className="text-xs">Error</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">Pending</Badge>;
  }
}

function LoginView({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Invalid password");
        return;
      }

      const data = await res.json();
      onLogin(data.token);
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-admin-password"
            />
            {error && (
              <p className="text-sm text-red-500" data-testid="text-login-error">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !password} data-testid="button-admin-login">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardView({ token }: { token: string }) {
  const [, navigate] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("admin_token");
        window.location.reload();
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      console.error("Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    window.location.reload();
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredAudits = data.audits.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.customerName?.toLowerCase().includes(term)) ||
      (a.customerEmail?.toLowerCase().includes(term)) ||
      a.url.toLowerCase().includes(term) ||
      (a.businessName?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h1 className="text-sm font-semibold">Admin Dashboard</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
            Log Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold" data-testid="stat-total-audits">{data.stats.totalAudits}</div>
              <div className="text-xs text-muted-foreground">Total Audits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-emerald-500" data-testid="stat-completed">{data.stats.completedAudits}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-500" data-testid="stat-paid">{data.stats.paidAudits}</div>
              <div className="text-xs text-muted-foreground">Paid</div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="py-4 px-4 text-center">
              <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600" data-testid="stat-revenue">${data.stats.totalRevenue}</div>
              <div className="text-xs text-muted-foreground">Revenue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-amber-500" data-testid="stat-pending">{data.stats.pendingAudits}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-4 text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-500" data-testid="stat-errors">{data.stats.errorAudits}</div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h2 className="text-lg font-semibold" data-testid="text-all-audits-title">All Audits</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-audits"
            />
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Website</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      {searchTerm ? "No audits match your search" : "No audits yet"}
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((audit) => (
                    <tr
                      key={audit.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/audit/${audit.id}`)}
                      data-testid={`row-audit-${audit.id}`}
                    >
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate max-w-[150px]" data-testid={`text-customer-name-${audit.id}`}>
                              {audit.customerName || "--"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]" data-testid={`text-customer-email-${audit.id}`}>
                              {audit.customerEmail || "--"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{audit.businessName || audit.url}</span>
                          </div>
                          {audit.businessType && (
                            <span className="text-xs text-muted-foreground">{audit.businessType}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(audit.status)}
                      </td>
                      <td className="py-3 px-4">
                        {audit.overallScore !== null && audit.overallScore !== undefined ? (
                          <span className={`font-bold ${getScoreColor(audit.overallScore)}`}>
                            {audit.overallScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {audit.paid ? (
                          <Badge className="bg-green-600 text-white text-xs">$99 Paid</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Unpaid</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(audit.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          Showing {filteredAudits.length} of {data.audits.length} audits
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem("admin_token");
  });

  const handleLogin = (newToken: string) => {
    sessionStorage.setItem("admin_token", newToken);
    setToken(newToken);
  };

  if (!token) {
    return <LoginView onLogin={handleLogin} />;
  }

  return <DashboardView token={token} />;
}
