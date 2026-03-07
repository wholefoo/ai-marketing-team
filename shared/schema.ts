import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  businessName: text("business_name"),
  businessType: text("business_type"),
  status: text("status").notNull().default("pending"),
  overallScore: integer("overall_score"),
  contentScore: integer("content_score"),
  conversionScore: integer("conversion_score"),
  seoScore: integer("seo_score"),
  competitiveScore: integer("competitive_score"),
  strategyScore: integer("strategy_score"),
  contentAnalysis: jsonb("content_analysis"),
  conversionAnalysis: jsonb("conversion_analysis"),
  seoAnalysis: jsonb("seo_analysis"),
  competitiveAnalysis: jsonb("competitive_analysis"),
  strategyAnalysis: jsonb("strategy_analysis"),
  findings: jsonb("findings"),
  executiveSummary: text("executive_summary"),
  actionPlan: jsonb("action_plan"),
  scrapedData: jsonb("scraped_data"),
  paid: boolean("paid").default(false).notNull(),
  stripeSessionId: text("stripe_session_id"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  createdAt: true,
});

export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaDescription: text("meta_description"),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: text("category"),
  tags: text("tags").array(),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  metaDescription: z.string().nullable().optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;

export const auditRequestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Please enter a valid email"),
});

export type AuditRequest = z.infer<typeof auditRequestSchema>;

export interface Finding {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface ActionItem {
  priority: number;
  title: string;
  description: string;
  timeline: string;
  impact: string;
  effort: string;
}

export interface AgentAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  findings: Finding[];
  recommendations: string[];
}

export interface AuditProgress {
  auditId: number;
  status: string;
  phase: string;
  agents: {
    content: "pending" | "running" | "complete" | "error";
    conversion: "pending" | "running" | "complete" | "error";
    seo: "pending" | "running" | "complete" | "error";
    competitive: "pending" | "running" | "complete" | "error";
    strategy: "pending" | "running" | "complete" | "error";
  };
  message?: string;
}
