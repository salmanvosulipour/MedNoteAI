import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateMedicalSummary, generateDiagnosticInterpretation } from "./services/openai";
import { transcribeAudio } from "./services/gemini";
import { sendCaseSummaryEmail, sendPasswordResetEmail } from "./services/resend";
import { insertCaseSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth
  await setupAuth(app);

  // Email/Password Signup
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid signup data" });
      }

      const { name, email, password } = parsed.data;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || undefined;

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      (req.session as any).userId = user.id;
      res.json({ user, needsTerms: true });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Email/Password Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid login data" });
      }

      const { email, password } = parsed.data;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;
      const needsTerms = !user.termsAcceptedAt;
      res.json({ user, needsTerms });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email" });
      }

      const { email } = parsed.data;
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        
        await storage.createPasswordResetToken(user.id, token, expiresAt);
        
        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : process.env.REPLIT_DOMAINS?.split(',')[0] 
            ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
            : 'http://localhost:5000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        
        try {
          await sendPasswordResetEmail({ email, resetLink });
        } catch (emailError) {
          console.error("Failed to send reset email:", emailError);
        }
      }
      
      res.json({ message: "If an account exists with that email, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const schema = z.object({
        token: z.string(),
        password: z.string().min(6),
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const { token, password } = parsed.data;
      
      const resetToken = await storage.getValidPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      await storage.markPasswordResetTokenUsed(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Custom session auth middleware
  const sessionAuth = (req: any, res: any, next: any) => {
    const sessionUserId = req.session?.userId;
    const replitUserId = req.user?.claims?.sub;
    
    if (sessionUserId) {
      req.authUserId = sessionUserId;
      return next();
    }
    if (replitUserId) {
      req.authUserId = replitUserId;
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Get authenticated user
  app.get('/api/auth/user', sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Accept terms of use
  app.post('/api/auth/accept-terms', sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const updated = await storage.updateUser(userId, {
        termsAcceptedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      console.error("Error accepting terms:", error);
      res.status(500).json({ message: "Failed to accept terms" });
    }
  });

  // Get all cases for a user
  app.get("/api/cases", async (req, res) => {
    try {
      const userId = req.query.userId as string || "demo-user";
      const cases = await storage.getCasesByUserId(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  });

  // Get all cases for a patient by MRN
  app.get("/api/patients/:mrn/cases", async (req, res) => {
    try {
      const cases = await storage.getCasesByMrn(req.params.mrn);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching patient cases:", error);
      res.status(500).json({ error: "Failed to fetch patient cases" });
    }
  });

  // Get single case by ID
  app.get("/api/cases/:id", async (req, res) => {
    try {
      const caseRecord = await storage.getCase(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(caseRecord);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ error: "Failed to fetch case" });
    }
  });

  // Create new case
  app.post("/api/cases", async (req, res) => {
    try {
      const parsed = insertCaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid case data", details: parsed.error.format() });
      }
      const newCase = await storage.createCase(parsed.data);
      res.status(201).json(newCase);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).json({ error: "Failed to create case" });
    }
  });

  // Update case
  app.patch("/api/cases/:id", async (req, res) => {
    try {
      const updated = await storage.updateCase(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(500).json({ error: "Failed to update case" });
    }
  });

  // Delete case
  app.delete("/api/cases/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCase(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ error: "Failed to delete case" });
    }
  });

  // Generate AI medical summary from transcription
  app.post("/api/cases/:id/generate-summary", async (req, res) => {
    try {
      const caseRecord = await storage.getCase(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (!caseRecord.transcription) {
        return res.status(400).json({ error: "No transcription available for this case" });
      }

      // Update status to processing
      await storage.updateCase(req.params.id, { status: "processing" });

      const summary = await generateMedicalSummary({
        patientName: caseRecord.patientName,
        age: caseRecord.age,
        gender: caseRecord.gender,
        transcription: caseRecord.transcription,
      });

      // Update case with AI-generated content
      const updated = await storage.updateCase(req.params.id, {
        chiefComplaint: summary.chiefComplaint,
        hpi: summary.hpi,
        ros: summary.ros,
        physicalExam: summary.physicalExam,
        assessment: summary.assessment,
        differentialDiagnosis: summary.differentialDiagnosis,
        plan: summary.plan,
        patientEducation: summary.patientEducation,
        treatmentRedFlags: summary.treatmentRedFlags,
        status: "completed",
      });

      res.json(updated);
    } catch (error) {
      console.error("Error generating summary:", error);
      await storage.updateCase(req.params.id, { status: "draft" });
      res.status(500).json({ error: "Failed to generate medical summary" });
    }
  });

  // Generate AI interpretation for diagnostic study
  app.post("/api/interpret-diagnostic", async (req, res) => {
    try {
      const schema = z.object({
        studyType: z.string(),
        findings: z.string(),
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const interpretation = await generateDiagnosticInterpretation(
        parsed.data.studyType,
        parsed.data.findings
      );

      res.json({ interpretation });
    } catch (error) {
      console.error("Error interpreting diagnostic:", error);
      res.status(500).json({ error: "Failed to generate interpretation" });
    }
  });

  // Audio upload and transcription
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit for Gemini inline data
  });

  app.post("/api/cases/:id/upload-audio", upload.single("audio"), async (req, res) => {
    try {
      const caseRecord = await storage.getCase(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const audioBase64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype || "audio/webm";

      // Transcribe with Gemini
      const transcription = await transcribeAudio(audioBase64, mimeType);

      // Update case with transcription
      const updated = await storage.updateCase(req.params.id, {
        transcription,
        status: "draft",
      });

      res.json({ transcription, case: updated });
    } catch (error) {
      console.error("Error processing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Transcribe audio and generate summary in one step
  app.post("/api/cases/:id/process-audio", upload.single("audio"), async (req, res) => {
    try {
      const caseRecord = await storage.getCase(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      // Update status to processing
      await storage.updateCase(req.params.id, { status: "processing" });

      const audioBase64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype || "audio/webm";

      // Step 1: Transcribe with Gemini
      const transcription = await transcribeAudio(audioBase64, mimeType);

      // Step 2: Generate medical summary with OpenAI
      const summary = await generateMedicalSummary({
        patientName: caseRecord.patientName,
        age: caseRecord.age,
        gender: caseRecord.gender,
        transcription,
      });

      // Update case with all data
      const updated = await storage.updateCase(req.params.id, {
        transcription,
        chiefComplaint: summary.chiefComplaint,
        hpi: summary.hpi,
        ros: summary.ros,
        physicalExam: summary.physicalExam,
        assessment: summary.assessment,
        differentialDiagnosis: summary.differentialDiagnosis,
        plan: summary.plan,
        patientEducation: summary.patientEducation,
        treatmentRedFlags: summary.treatmentRedFlags,
        status: "completed",
      });

      res.json(updated);
    } catch (error) {
      console.error("Error processing audio:", error);
      await storage.updateCase(req.params.id, { status: "draft" });
      res.status(500).json({ error: "Failed to process audio" });
    }
  });

  // Process text dictation and generate summary
  app.post("/api/cases/:id/process-text", async (req, res) => {
    try {
      const caseRecord = await storage.getCase(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const schema = z.object({
        dictation: z.string().min(1),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dictation text is required" });
      }

      // Update status to processing
      await storage.updateCase(req.params.id, { status: "processing" });

      const transcription = parsed.data.dictation;

      // Generate medical summary with OpenAI
      const summary = await generateMedicalSummary({
        patientName: caseRecord.patientName,
        age: caseRecord.age,
        gender: caseRecord.gender,
        transcription,
      });

      // Update case with all data
      const updated = await storage.updateCase(req.params.id, {
        transcription,
        chiefComplaint: summary.chiefComplaint,
        hpi: summary.hpi,
        ros: summary.ros,
        physicalExam: summary.physicalExam,
        assessment: summary.assessment,
        differentialDiagnosis: summary.differentialDiagnosis,
        plan: summary.plan,
        patientEducation: summary.patientEducation,
        treatmentRedFlags: summary.treatmentRedFlags,
        status: "completed",
      });

      res.json(updated);
    } catch (error) {
      console.error("Error processing text:", error);
      await storage.updateCase(req.params.id, { status: "draft" });
      res.status(500).json({ error: "Failed to generate medical note" });
    }
  });

  // Send case summary email to patient
  app.post("/api/cases/:id/email-summary", async (req, res) => {
    try {
      const caseRecord = await storage.getCase(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const schema = z.object({
        patientEmail: z.string().email(),
        physicianName: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const medications = caseRecord.dischargeMedications as Array<{
        name: string;
        dose: string;
        frequency: string;
        duration: string;
        instructions: string;
      }> | null;

      try {
        const result = await sendCaseSummaryEmail({
          patientName: caseRecord.patientName,
          patientEmail: parsed.data.patientEmail,
          chiefComplaint: caseRecord.chiefComplaint,
          assessment: caseRecord.assessment || undefined,
          plan: caseRecord.plan || undefined,
          patientEducation: caseRecord.patientEducation || undefined,
          treatmentRedFlags: caseRecord.treatmentRedFlags || undefined,
          medications: medications || undefined,
          physicianName: parsed.data.physicianName,
        });

        // Update case with successful email status
        const updated = await storage.updateCase(req.params.id, {
          patientEmail: parsed.data.patientEmail,
          emailStatus: {
            sentAt: new Date().toISOString(),
            recipient: parsed.data.patientEmail,
            status: 'sent',
            messageId: result.id,
          },
        });

        res.json({ success: true, messageId: result.id, case: updated });
      } catch (emailError: any) {
        // Update case with failed email status
        await storage.updateCase(req.params.id, {
          patientEmail: parsed.data.patientEmail,
          emailStatus: {
            sentAt: new Date().toISOString(),
            recipient: parsed.data.patientEmail,
            status: 'failed',
            error: emailError.message,
          },
        });
        throw emailError;
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(502).json({ error: error.message || "Failed to send email" });
    }
  });

  return httpServer;
}
