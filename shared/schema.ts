import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Medical cases table
export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Patient demographics
  patientName: text("patient_name").notNull(),
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
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  recordedAt: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
