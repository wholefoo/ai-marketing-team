import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Lightbulb,
  Target,
  FileText,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
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

interface ConfigOption {
  id: string;
  label: string;
  description?: string;
  keywords?: string;
}

interface TrendingTopic {
  topic: string;
  angle: string;
  searchPotential: string;
}

interface BlogConfig {
  niches: ConfigOption[];
  contentTypes: ConfigOption[];
  targetAudiences: ConfigOption[];
  tones: ConfigOption[];
}

function BlogManagement({ token }: { token: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editForm, setEditForm] = useState({ title: "", slug: "", excerpt: "", metaDescription: "", content: "", category: "", tags: "" });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [niche, setNiche] = useState("");
  const [contentType, setContentType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("");
  const [wordCount, setWordCount] = useState("");

  const [config, setConfig] = useState<BlogConfig | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [showTrending, setShowTrending] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchConfig();
  }, [token]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/blog/config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConfig(await res.json());
    } catch {}
  };

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

  const fetchTrendingTopics = async () => {
    setLoadingTrending(true);
    setShowTrending(true);
    try {
      const res = await fetch("/api/admin/blog/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ niche: niche && niche !== "any" ? niche : undefined, count: 8 }),
      });
      if (res.ok) {
        setTrendingTopics(await res.json());
      }
    } catch {} finally {
      setLoadingTrending(false);
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
        body: JSON.stringify({
          topic: topic.trim(),
          niche: niche && niche !== "any" ? niche : undefined,
          contentType: contentType && contentType !== "any" ? contentType : undefined,
          targetAudience: targetAudience && targetAudience !== "any" ? targetAudience : undefined,
          tone: tone && tone !== "any" ? tone : undefined,
          wordCount: wordCount && wordCount !== "standard" ? wordCount : undefined,
        }),
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

  const selectTrendingTopic = (t: TrendingTopic) => {
    setTopic(t.topic);
    setShowTrending(false);
  };

  const getSearchBadgeColor = (potential: string) => {
    if (potential === "high") return "bg-emerald-600 text-white";
    if (potential === "medium") return "bg-amber-500 text-white";
    return "bg-muted text-muted-foreground";
  };

  const activeFilters = [
    niche && niche !== "any" ? niche : "",
    contentType && contentType !== "any" ? contentType : "",
    targetAudience && targetAudience !== "any" ? targetAudience : "",
    tone && tone !== "any" ? tone : "",
    wordCount && wordCount !== "standard" ? wordCount : "",
  ].filter(Boolean).length;

  return (
    <div>
      <Card className="mb-4">
        <CardContent className="pt-5 pb-5 px-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Generate New Post</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={fetchTrendingTopics}
              disabled={loadingTrending}
              data-testid="button-trending-topics"
            >
              {loadingTrending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Lightbulb className="w-3 h-3 mr-1" />
              )}
              {loadingTrending ? "Finding trends..." : "Suggest Topics"}
            </Button>
          </div>

          {showTrending && (
            <div className="mb-4 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    Trending Topics{niche && config ? ` - ${config.niches.find(n => n.id === niche)?.label}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={fetchTrendingTopics}
                    disabled={loadingTrending}
                    data-testid="button-refresh-trending"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingTrending ? "animate-spin" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowTrending(false)}
                  >
                    <XIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {loadingTrending ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                  <span className="text-xs text-muted-foreground">AI is researching trending topics...</span>
                </div>
              ) : trendingTopics.length > 0 ? (
                <div className="grid gap-1.5">
                  {trendingTopics.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => selectTrendingTopic(t)}
                      className="text-left p-2.5 rounded-md border bg-background hover:bg-primary/5 hover:border-primary/30 transition-colors group"
                      data-testid={`button-trending-${i}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium group-hover:text-primary transition-colors block">{t.topic}</span>
                          <span className="text-[11px] text-muted-foreground mt-0.5 block">{t.angle}</span>
                        </div>
                        <Badge className={`text-[10px] shrink-0 ${getSearchBadgeColor(t.searchPotential)}`}>
                          {t.searchPotential}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No trending topics found. Try again.</p>
              )}
            </div>
          )}

          <form onSubmit={handleGenerate}>
            <div className="flex gap-2 mb-2">
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
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              data-testid="button-toggle-advanced"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Advanced Options
              {activeFilters > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{activeFilters} active</Badge>
              )}
            </button>

            {showAdvanced && config && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 pb-1">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    <Target className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Niche
                  </label>
                  <Select value={niche} onValueChange={setNiche}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-niche">
                      <SelectValue placeholder="Any niche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any niche</SelectItem>
                      {config.niches.map(n => (
                        <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    <FileText className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Content Type
                  </label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-content-type">
                      <SelectValue placeholder="Any format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any format</SelectItem>
                      {config.contentTypes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    <Users className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Audience
                  </label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-audience">
                      <SelectValue placeholder="Any audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any audience</SelectItem>
                      {config.targetAudiences.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    <Zap className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Tone
                  </label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-tone">
                      <SelectValue placeholder="Any tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any tone</SelectItem>
                      {config.tones.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    <BarChart3 className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Length
                  </label>
                  <Select value={wordCount} onValueChange={setWordCount}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-word-count">
                      <SelectValue placeholder="Standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (1200-2000)</SelectItem>
                      <SelectItem value="short">Short (800-1200)</SelectItem>
                      <SelectItem value="long">Long-form (2000-3000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {showAdvanced && activeFilters > 0 && (
              <button
                type="button"
                onClick={() => {
                  setNiche("");
                  setContentType("");
                  setTargetAudience("");
                  setTone("");
                  setWordCount("");
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-1"
                data-testid="button-clear-filters"
              >
                Clear all filters
              </button>
            )}
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDeleteAudit = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this audit permanently? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/audit/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchDashboard();
    } catch {} finally {
      setDeletingId(null);
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
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
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
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleDeleteAudit(audit.id, e)}
                                disabled={deletingId === audit.id}
                                data-testid={`button-delete-audit-${audit.id}`}
                              >
                                {deletingId === audit.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
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
