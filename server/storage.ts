import { users, cases, type User, type InsertUser, type Case, type InsertCase } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Case methods
  getCase(id: string): Promise<Case | undefined>;
  getCasesByUserId(userId: string, limit?: number): Promise<Case[]>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, caseData: Partial<InsertCase>): Promise<Case | undefined>;
  deleteCase(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Case methods
  async getCase(id: string): Promise<Case | undefined> {
    const [caseRecord] = await db.select().from(cases).where(eq(cases.id, id));
    return caseRecord || undefined;
  }

  async getCasesByUserId(userId: string, limit: number = 50): Promise<Case[]> {
    return await db
      .select()
      .from(cases)
      .where(eq(cases.userId, userId))
      .orderBy(desc(cases.recordedAt))
      .limit(limit);
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const [caseRecord] = await db
      .insert(cases)
      .values(caseData)
      .returning();
    return caseRecord;
  }

  async updateCase(id: string, caseData: Partial<InsertCase>): Promise<Case | undefined> {
    const [updated] = await db
      .update(cases)
      .set(caseData)
      .where(eq(cases.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCase(id: string): Promise<boolean> {
    const result = await db.delete(cases).where(eq(cases.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
