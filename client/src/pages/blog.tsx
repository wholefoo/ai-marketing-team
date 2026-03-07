import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Calendar, ArrowRight, BookOpen } from "lucide-react";
import type { BlogPost } from "@shared/schema";

export default function BlogPage() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">AI Market Audit</span>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Blog</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" data-testid="text-blog-title">Marketing Insights & Strategy</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            AI-driven research on business growth challenges, marketing best practices, and strategies to improve your website's performance.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (!posts || posts.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No articles published yet. Check back soon.</p>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} data-testid={`link-post-${post.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {post.category && (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${post.id}`}>
                          {post.category}
                        </Badge>
                      )}
                      {post.publishedAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold mb-2" data-testid={`text-post-title-${post.id}`}>{post.title}</h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                    )}
                    <span className="text-sm text-primary font-medium flex items-center gap-1">
                      Read more <ArrowRight className="w-3 h-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want to see how your website measures up?
          </p>
          <Link href="/">
            <Button data-testid="button-blog-cta">Get Your Free Marketing Audit</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
