import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  // Email verification
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  // Free token system - 1 free use for new users
  freeTokensRemaining: integer("free_tokens_remaining").default(1),
  // Paddle integration
  paddleCustomerId: varchar("paddle_customer_id"),
  // Auth token for mobile/API authentication
  currentAuthToken: varchar("current_auth_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const deviceSessions = pgTable("device_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  deviceId: varchar("device_id").notNull(),
  deviceName: varchar("device_name"),
  platform: varchar("platform"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DeviceSession = typeof deviceSessions.$inferSelect;

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Paddle subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  paddleSubscriptionId: varchar("paddle_subscription_id").unique(),
  paddleCustomerId: varchar("paddle_customer_id"),
  paddleTransactionId: varchar("paddle_transaction_id"),
  priceId: varchar("price_id"),
  status: varchar("status").notNull(), // active, past_due, trialing, paused, canceled
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Medical cases table
export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Patient demographics
  patientName: text("patient_name").notNull(),
  mrn: text("mrn"), // Medical Record Number to link patient visits
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // M, F, Other
  
  // Case metadata
  chiefComplaint: text("chief_complaint").notNull(),
  status: text("status").notNull().default("draft"), // draft, processing, completed
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  
  // Audio transcription
  audioUrl: text("audio_url"), // URL to audio file storage
  transcription: text("transcription"), // Raw Whisper transcription
  
  // AI-generated medical note sections
  hpi: text("hpi"), // History of Present Illness
  ros: jsonb("ros"), // Review of Systems (structured JSON)
  physicalExam: text("physical_exam"), // Physical examination findings
  assessment: text("assessment"), // Assessment/diagnosis narrative
  differentialDiagnosis: jsonb("differential_diagnosis"), // Array of {diagnosis, icdCode}
  plan: text("plan"), // Treatment plan
  
  // Attachments
  attachmentUrls: text("attachment_urls").array(), // Array of image URLs
  
  // Diagnostic Studies Analysis (X-ray, ECG, Lab results)
  diagnosticStudies: jsonb("diagnostic_studies"), // Array of {type, imageUrl, interpretation, aiAssisted}
  
  // Physician-provided content
  patientEducation: text("patient_education"), // Patient education content
  treatmentRedFlags: text("treatment_red_flags"), // Warning signs to watch for
  
  // Discharge medications
  dischargeMedications: jsonb("discharge_medications"), // Array of {name, dose, frequency, duration, instructions}
  
  // Patient contact info for email
  patientEmail: text("patient_email"),
  
  // Email delivery status
  emailStatus: jsonb("email_status"), // {sentAt, recipient, status, messageId}
  
  // Final disposition
  disposition: text("disposition"), // discharged, admitted, transferred, ama, observation
  dischargeSummary: text("discharge_summary"), // Generated discharge summary text
  finalNotes: text("final_notes"), // User's final dictated notes (separate from AI assessment)
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  recordedAt: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
