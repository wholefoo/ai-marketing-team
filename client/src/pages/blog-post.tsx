import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Calendar, BookOpen, ArrowRight } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { useEffect } from "react";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    enabled: !!slug,
  });

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | AI Market Audit Blog`;

      const setMeta = (name: string, content: string, attr = "name") => {
        let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute(attr, name);
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };

      const desc = post.metaDescription || post.excerpt || post.title;
      setMeta("description", desc);
      setMeta("og:description", desc, "property");
      setMeta("og:title", `${post.title} | AI Market Audit Blog`, "property");
      setMeta("og:type", "article", "property");
      setMeta("og:url", `https://aimarketaudit.com/blog/${post.slug}`, "property");
    }
    return () => {
      document.title = "AI Market Audit - AI-Powered Marketing Audit & Strategy";
    };
  }, [post]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/blog">
            <Button variant="ghost" size="icon" data-testid="button-back-blog">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">AI Market Audit</span>
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <Link href="/blog" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <BookOpen className="w-3 h-3" />
            Blog
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {isLoading && (
          <div>
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-4 w-48 mb-8" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">This article could not be found.</p>
            <Link href="/blog">
              <Button variant="outline" data-testid="button-back-to-blog">Back to Blog</Button>
            </Link>
          </div>
        )}

        {post && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "BlogPosting",
                  headline: post.title,
                  description: post.metaDescription || post.excerpt || post.title,
                  datePublished: post.publishedAt,
                  author: {
                    "@type": "Organization",
                    name: "AI Market Audit",
                  },
                  publisher: {
                    "@type": "Organization",
                    name: "AI Market Audit",
                    url: "https://aimarketaudit.com",
                  },
                  mainEntityOfPage: {
                    "@type": "WebPage",
                    "@id": `https://aimarketaudit.com/blog/${post.slug}`,
                  },
                }),
              }}
            />

            <article>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  {post.category && (
                    <Badge variant="secondary" data-testid="badge-post-category">{post.category}</Badge>
                  )}
                  {post.publishedAt && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-3" data-testid="text-post-title">{post.title}</h1>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="prose prose-sm max-w-none dark:prose-invert
                  prose-headings:font-semibold prose-headings:text-foreground
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: post.content }}
                data-testid="blog-post-content"
              />
            </article>

            <div className="mt-12 pt-8 border-t">
              <div className="bg-primary/5 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Ready to audit your website?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get a comprehensive marketing audit from 5 AI agents in under 3 minutes.
                </p>
                <Link href="/">
                  <Button data-testid="button-post-cta">
                    Start Your Free Audit <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">
                Back to all articles
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
