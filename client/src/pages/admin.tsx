import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  X as XIcon,
} from "lucide-react";
import type { BlogPost } from "@shared/schema";

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

function BlogManagement({ token }: { token: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editForm, setEditForm] = useState({ title: "", slug: "", excerpt: "", metaDescription: "", content: "", category: "", tags: "" });

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/blog", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPosts(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to generate post");
        return;
      }
      setTopic("");
      fetchPosts();
    } catch {
      alert("Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/blog/${post.id}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchPosts();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this post permanently?")) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchPosts();
    } catch {}
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      metaDescription: post.metaDescription || "",
      content: post.content,
      category: post.category || "",
      tags: (post.tags || []).join(", "),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      const res = await fetch(`/api/admin/blog/${editingPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editForm.title,
          slug: editForm.slug,
          excerpt: editForm.excerpt || null,
          metaDescription: editForm.metaDescription || null,
          content: editForm.content,
          category: editForm.category || null,
          tags: editForm.tags ? editForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
        }),
      });
      if (res.ok) {
        setEditingPost(null);
        fetchPosts();
      }
    } catch {}
  };

  return (
    <div>
      <Card className="mb-6">
        <CardContent className="pt-5 pb-5 px-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Generate New Post</h3>
          </div>
          <form onSubmit={handleGenerate} className="flex gap-2">
            <Input
              placeholder="Enter a business pain point or topic to research..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={generating}
              className="flex-1"
              data-testid="input-blog-topic"
            />
            <Button type="submit" disabled={generating || !topic.trim()} data-testid="button-generate-post">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Generate
                </>
              )}
            </Button>
          </form>
          {generating && (
            <p className="text-xs text-muted-foreground mt-2">
              AI is researching the topic and writing the article. This typically takes 30-60 seconds...
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No blog posts yet. Generate your first post above.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b last:border-b-0 hover:bg-muted/30" data-testid={`row-blog-${post.id}`}>
                    <td className="py-3 px-4">
                      <span className="font-medium truncate max-w-[300px] block" data-testid={`text-blog-title-${post.id}`}>
                        {post.title}
                      </span>
                      <span className="text-xs text-muted-foreground">/blog/{post.slug}</span>
                    </td>
                    <td className="py-3 px-4">
                      {post.category && <Badge variant="secondary" className="text-xs">{post.category}</Badge>}
                    </td>
                    <td className="py-3 px-4">
                      {post.status === "published" ? (
                        <Badge className="bg-emerald-600 text-white text-xs">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(post)}
                          data-testid={`button-edit-blog-${post.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleTogglePublish(post)}
                          data-testid={`button-publish-blog-${post.id}`}
                        >
                          {post.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(post.id)}
                          data-testid={`button-delete-blog-${post.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingPost(null)}>
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-background">
              <h3 className="font-semibold">Edit Post</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingPost(null)}>
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Title</label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} data-testid="input-edit-title" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Slug</label>
                <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} data-testid="input-edit-slug" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Meta Description</label>
                <Input value={editForm.metaDescription} onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })} data-testid="input-edit-meta" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Excerpt</label>
                <Input value={editForm.excerpt} onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })} data-testid="input-edit-excerpt" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                <Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} data-testid="input-edit-category" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tags (comma-separated)</label>
                <Input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} data-testid="input-edit-tags" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Content (HTML)</label>
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="min-h-[300px] font-mono text-xs"
                  data-testid="textarea-edit-content"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t sticky bottom-0 bg-background">
              <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} data-testid="button-save-edit">Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({ token }: { token: string }) {
  const [, navigate] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"audits" | "blog">("audits");

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

        <div className="flex gap-1 mb-6 border-b">
          <button
            onClick={() => setActiveTab("audits")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "audits"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-audits"
          >
            <BarChart3 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Audits
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "blog"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-blog"
          >
            <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Blog
          </button>
        </div>

        {activeTab === "blog" ? (
          <BlogManagement token={token} />
        ) : (
          <>
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
          </>
        )}
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
