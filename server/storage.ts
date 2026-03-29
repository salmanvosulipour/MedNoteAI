import { users, cases, passwordResetTokens, emailVerificationTokens, subscriptions, deviceSessions, type User, type UpsertUser, type Case, type InsertCase, type PasswordResetToken, type EmailVerificationToken, type Subscription, type InsertSubscription, type DeviceSession } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt, sql, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByToken(token: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  createUser(userData: { email: string; password: string; firstName?: string; lastName?: string }): Promise<User>;
  
  // Password reset methods
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getValidPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  
  // Email verification methods
  createEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<EmailVerificationToken>;
  getValidEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenUsed(token: string): Promise<void>;
  
  // Paddle subscription methods
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByPaddleId(paddleSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(data: InsertSubscription): Promise<Subscription>;
  updateSubscription(paddleSubscriptionId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Free token methods
  decrementFreeTokens(userId: string): Promise<User | undefined>;
  
  // Device session methods
  createDeviceSession(data: { userId: string; token: string; deviceId: string; deviceName?: string; platform?: string }): Promise<DeviceSession>;
  getDeviceSessionByToken(token: string): Promise<DeviceSession | null>;
  touchDeviceSession(token: string): Promise<void>;
  deleteDeviceSession(token: string): Promise<void>;
  deleteAllDeviceSessions(userId: string): Promise<void>;

  // Case methods
  getCase(id: string): Promise<Case | undefined>;
  getCasesByUserId(userId: string, limit?: number): Promise<Case[]>;
  getCasesByMrn(mrn: string): Promise<Case[]>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.currentAuthToken, token));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const cleanedData = Object.fromEntries(
      Object.entries(userData).filter(([_, v]) => v !== undefined)
    );
    const [updated] = await db
      .update(users)
      .set({ ...cleanedData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async createUser(userData: { email: string; password: string; firstName?: string; lastName?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      })
      .returning();
    return user;
  }

  // Password reset methods
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({ userId, token, expiresAt })
      .returning();
    return resetToken;
  }

  async getValidPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );
    if (resetToken && resetToken.usedAt) return undefined;
    return resetToken || undefined;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  }

  // Email verification methods
  async createEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<EmailVerificationToken> {
    const [verificationToken] = await db
      .insert(emailVerificationTokens)
      .values({ userId, token, expiresAt })
      .returning();
    return verificationToken;
  }

  async getValidEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      );
    if (verificationToken && verificationToken.usedAt) return undefined;
    return verificationToken || undefined;
  }

  async markEmailVerificationTokenUsed(token: string): Promise<void> {
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.token, token));
  }

  // Paddle subscription methods
  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          or(
            eq(subscriptions.status, 'active'),
            eq(subscriptions.status, 'trialing')
          )
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription || undefined;
  }

  async getSubscriptionByPaddleId(paddleSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.paddleSubscriptionId, paddleSubscriptionId));
    return subscription || undefined;
  }

  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(data)
      .returning();
    return subscription;
  }

  async updateSubscription(paddleSubscriptionId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.paddleSubscriptionId, paddleSubscriptionId))
      .returning();
    return updated || undefined;
  }

  // Free token methods
  async decrementFreeTokens(userId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ 
        freeTokensRemaining: sql`GREATEST(${users.freeTokensRemaining} - 1, 0)`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  // Device session methods
  async createDeviceSession(data: { userId: string; token: string; deviceId: string; deviceName?: string; platform?: string }): Promise<DeviceSession> {
    const [session] = await db
      .insert(deviceSessions)
      .values(data)
      .returning();
    return session;
  }

  async getDeviceSessionByToken(token: string): Promise<DeviceSession | null> {
    const [session] = await db
      .select()
      .from(deviceSessions)
      .where(eq(deviceSessions.token, token));
    return session || null;
  }

  async touchDeviceSession(token: string): Promise<void> {
    await db
      .update(deviceSessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(deviceSessions.token, token));
  }

  async deleteDeviceSession(token: string): Promise<void> {
    await db
      .delete(deviceSessions)
      .where(eq(deviceSessions.token, token));
  }

  async deleteAllDeviceSessions(userId: string): Promise<void> {
    await db
      .delete(deviceSessions)
      .where(eq(deviceSessions.userId, userId));
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

  async getCasesByMrn(mrn: string): Promise<Case[]> {
    return await db
      .select()
      .from(cases)
      .where(eq(cases.mrn, mrn))
      .orderBy(desc(cases.recordedAt));
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
