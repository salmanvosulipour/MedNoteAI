import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { generateMedicalSummary, generateDiagnosticInterpretation } from "./services/openai";
import { transcribeAudio } from "./services/gemini";
import { sendCaseSummaryEmail } from "./services/resend";
import { insertCaseSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { getPaddleClient, verifyPaddleWebhook } from "./paddleClient";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Apple's public keys for verifying Sign in with Apple tokens
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth (kept for backward compatibility)
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- Email/Password Auth Endpoints ---

  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
      if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) return res.status(409).json({ message: "An account with this email already exists" });

      const hashed = await bcrypt.hash(password, 12);
      const token = crypto.randomBytes(32).toString("hex");
      const user = await storage.createUser({ email: email.toLowerCase(), password: hashed, firstName, lastName });
      await storage.updateUser(user.id, { currentAuthToken: token });

      const { password: _, ...safeUser } = user as any;
      return res.json({ user: { ...safeUser, currentAuthToken: undefined }, token });
    } catch (error: any) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login with email/password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user || !user.password) return res.status(401).json({ message: "Invalid email or password" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password" });

      const token = crypto.randomBytes(32).toString("hex");
      await storage.updateUser(user.id, { currentAuthToken: token });

      const { password: _, currentAuthToken: __, ...safeUser } = user as any;
      return res.json({ user: safeUser, token });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  // Sign in with Apple — verifies identity token, creates session
  app.post('/api/auth/apple', async (req: any, res) => {
    try {
      const { identityToken, firstName, lastName, email } = req.body;
      if (!identityToken) return res.status(400).json({ message: "identityToken required" });

      // Verify the token with Apple's public keys
      const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
        issuer: "https://appleid.apple.com",
      });

      const appleUserId = payload.sub as string;
      if (!appleUserId) return res.status(400).json({ message: "Invalid Apple token" });

      // Find or create user — Apple only sends email/name on first sign-in
      let user = await storage.getUser(appleUserId);
      if (!user) {
        user = await storage.upsertUser({
          id: appleUserId,
          email: (payload.email as string) || email || null,
          firstName: firstName || null,
          lastName: lastName || null,
        });
      }

      // Store userId in session so future requests are authenticated
      req.session.userId = appleUserId;
      await new Promise<void>((resolve, reject) =>
        req.session.save((err: any) => (err ? reject(err) : resolve()))
      );

      // Also generate a Bearer token — Capacitor/WKWebView loses session cookies
      // so native iOS uses this token for all subsequent API calls
      const token = crypto.randomBytes(32).toString("hex");
      await storage.updateUser(user.id, { currentAuthToken: token });

      const { password: _, currentAuthToken: __, ...safeUser } = user as any;
      return res.json({ user: safeUser, token });
    } catch (error: any) {
      console.error("Apple auth error:", error);
      return res.status(401).json({ message: "Apple Sign In failed. Please try again." });
    }
  });

  // Logout - clear all sessions
  app.post('/api/auth/logout', async (req: any, res) => {
    try {
      req.session?.destroy(() => {});
      return res.json({ success: true });
    } catch {
      return res.json({ success: true });
    }
  });

  // Auth middleware — supports Apple session, Replit session, or Bearer token
  const sessionAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    // 1. Apple Sign In session (set by /api/auth/apple)
    if (req.session?.userId) {
      req.authUserId = req.session.userId;
      return next();
    }

    // 2. Replit OIDC session (legacy / web testing)
    const replitUserId = req.user?.claims?.sub;
    if (replitUserId) {
      req.authUserId = replitUserId;
      return next();
    }

    // 3. Bearer token (email/password + Apple Sign In on Capacitor)
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const user = await storage.getUserByToken(token);
        if (user) {
          req.authUserId = user.id;
          return next();
        }
      } catch (e) {
        console.error(`[auth] Bearer token lookup error:`, e);
      }
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

  // Create new case (with free token gating)
  app.post("/api/cases", sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Email verification temporarily disabled
      // if (!user.isEmailVerified) {
      //   return res.status(403).json({ 
      //     error: "EMAIL_NOT_VERIFIED",
      //     message: "Please verify your email before creating cases" 
      //   });
      // }

      // Check subscription or free tokens
      let hasActiveSubscription = false;
      const subscription = await storage.getSubscriptionByUserId(userId);
      if (subscription) {
        hasActiveSubscription = ['active', 'on_trial'].includes(subscription.status);
      }

      const hasFreeTokens = (user.freeTokensRemaining || 0) > 0;

      if (!hasActiveSubscription && !hasFreeTokens) {
        return res.status(403).json({ 
          error: "SUBSCRIPTION_REQUIRED",
          message: "You've used your free case. Subscribe to continue creating cases." 
        });
      }

      const parsed = insertCaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid case data", details: parsed.error.format() });
      }
      
      // Enforce server-side ownership - always use authenticated user's ID
      const caseData = { ...parsed.data, userId };
      const newCase = await storage.createCase(caseData);

      // Decrement free token if not subscribed
      if (!hasActiveSubscription && hasFreeTokens) {
        await storage.decrementFreeTokens(userId);
      }

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
        plan: Array.isArray(summary.plan) ? JSON.stringify(summary.plan) : summary.plan,
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
        plan: Array.isArray(summary.plan) ? JSON.stringify(summary.plan) : summary.plan,
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
        plan: Array.isArray(summary.plan) ? JSON.stringify(summary.plan) : summary.plan,
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

  // Billing Routes - Paddle

  app.get('/api/billing/status', sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const subscription = await storage.getSubscriptionByUserId(userId);
      const isSubscribed = subscription && ['active', 'trialing'].includes(subscription.status);

      res.json({
        isEmailVerified: user.isEmailVerified,
        freeTokensRemaining: user.freeTokensRemaining || 0,
        isSubscribed,
        subscription: subscription ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd ? Math.floor(subscription.currentPeriodEnd.getTime() / 1000) : null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        } : null,
      });
    } catch (error) {
      console.error("Error getting billing status:", error);
      res.status(500).json({ error: "Failed to get billing status" });
    }
  });

  app.post('/api/billing/checkout', sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const schema = z.object({
        priceId: z.string(),
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request - priceId required" });
      }

      res.json({ 
        priceId: parsed.data.priceId,
        email: user.email,
        userId: userId,
      });
    } catch (error) {
      console.error("Error preparing checkout:", error);
      res.status(500).json({ error: "Failed to prepare checkout" });
    }
  });

  app.post('/api/billing/portal', sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const subscription = await storage.getSubscriptionByUserId(userId);
      
      if (!subscription || !subscription.paddleCustomerId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      try {
        const paddle = getPaddleClient();
        const portalSession = await paddle.customers.generateAuthToken(subscription.paddleCustomerId);
        
        const baseUrl = process.env.PADDLE_VENDOR_ID 
          ? `https://customer-portal.paddle.com/cpl_${process.env.PADDLE_VENDOR_ID}`
          : 'https://customer-portal.paddle.com';
        
        res.json({ 
          url: baseUrl,
          authToken: portalSession,
        });
      } catch (paddleError) {
        console.error("Paddle portal error:", paddleError);
        res.status(500).json({ error: "Failed to get billing portal" });
      }
    } catch (error) {
      console.error("Error getting portal URL:", error);
      res.status(500).json({ error: "Failed to get billing portal" });
    }
  });

  // Paddle Webhook Handler
  app.post('/api/webhooks/paddle', async (req, res) => {
    try {
      const signature = req.headers['paddle-signature'] as string;
      const rawBody = JSON.stringify(req.body);
      
      let event;
      try {
        event = await verifyPaddleWebhook(rawBody, signature);
      } catch (verifyError) {
        console.error('Invalid Paddle webhook signature:', verifyError);
        return res.status(401).send('Invalid signature');
      }

      const eventType = event.eventType;
      const data = event.data as any;

      console.log('Paddle webhook received:', eventType);

      switch (eventType) {
        case 'subscription.created': {
          const customData = data.customData || {};
          const userId = customData.userId;
          
          if (!userId) {
            console.error('No userId in webhook customData');
            return res.status(400).send('Missing userId');
          }

          await storage.createSubscription({
            userId,
            paddleSubscriptionId: data.id,
            paddleCustomerId: data.customerId,
            priceId: data.items?.[0]?.price?.id,
            status: data.status,
            currentPeriodEnd: data.currentBillingPeriod?.endsAt ? new Date(data.currentBillingPeriod.endsAt) : null,
            cancelAtPeriodEnd: data.scheduledChange?.action === 'cancel',
          });

          await storage.updateUser(userId, {
            paddleCustomerId: data.customerId,
          });
          break;
        }

        case 'subscription.updated': {
          await storage.updateSubscription(data.id, {
            status: data.status,
            currentPeriodEnd: data.currentBillingPeriod?.endsAt ? new Date(data.currentBillingPeriod.endsAt) : null,
            cancelAtPeriodEnd: data.scheduledChange?.action === 'cancel',
          });
          break;
        }

        case 'subscription.canceled': {
          await storage.updateSubscription(data.id, {
            status: 'canceled',
            cancelAtPeriodEnd: true,
          });
          break;
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Webhook processing failed');
    }
  });

  return httpServer;
}
