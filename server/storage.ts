import { db } from "./db";
import { audits, type Audit, type InsertAudit } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAudit(audit: InsertAudit): Promise<Audit>;
  getAudit(id: number): Promise<Audit | undefined>;
  getAllAudits(): Promise<Audit[]>;
  updateAudit(id: number, data: Partial<InsertAudit>): Promise<Audit | undefined>;
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
}

export const storage = new DatabaseStorage();
