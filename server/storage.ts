import { db } from "./db";
import { audits, blogPosts, type Audit, type InsertAudit, type BlogPost, type InsertBlogPost } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAudit(audit: InsertAudit): Promise<Audit>;
  getAudit(id: number): Promise<Audit | undefined>;
  getAllAudits(): Promise<Audit[]>;
  updateAudit(id: number, data: Partial<InsertAudit>): Promise<Audit | undefined>;
  deleteAudit(id: number): Promise<boolean>;

  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(status?: string): Promise<BlogPost[]>;
  updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [created] = await db.insert(audits).values(audit).returning();
    return created;
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    return audit;
  }

  async getAllAudits(): Promise<Audit[]> {
    return db.select().from(audits).orderBy(desc(audits.createdAt));
  }

  async updateAudit(id: number, data: Partial<InsertAudit>): Promise<Audit | undefined> {
    const [updated] = await db.update(audits).set(data).where(eq(audits.id, id)).returning();
    return updated;
  }

  async deleteAudit(id: number): Promise<boolean> {
    const [deleted] = await db.delete(audits).where(eq(audits.id, id)).returning();
    return !!deleted;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db.insert(blogPosts).values(post).returning();
    return created;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async getAllBlogPosts(status?: string): Promise<BlogPost[]> {
    if (status) {
      return db.select().from(blogPosts).where(eq(blogPosts.status, status)).orderBy(desc(blogPosts.publishedAt));
    }
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts).set(data).where(eq(blogPosts.id, id)).returning();
    return updated;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
