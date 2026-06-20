import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { generateMedicalSummary, generateDiagnosticInterpretation, paraphraseDispositionNote } from "./services/openai";
import { transcribeAudio, cleanMedicalTranscription } from "./services/gemini";
import { sendCaseSummaryEmail } from "./services/resend";
import { insertCaseSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Apple's public keys for verifying Sign in with Apple tokens
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

// Check RevenueCat entitlement live — used as fallback when local DB has no subscription
async function checkRevenueCatEntitlement(userId: string): Promise<boolean> {
  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!secretKey) return false;
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return false;
    const data = await res.json() as any;
    const entitlement = data?.subscriber?.entitlements?.pro;
    if (!entitlement) return false;
    const expiresDate = entitlement.expires_date;
    // null expires_date means lifetime; otherwise check it hasn't expired
    if (expiresDate === null) return true;
    return new Date(expiresDate) > new Date();
  } catch {
    return false;
  }
}

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

      const { deviceId, deviceName, platform } = req.body;
      const boundDeviceId = deviceId || `web-${crypto.randomBytes(8).toString("hex")}`;
      const safePlatform = platform === "ios" ? "ios" : "web";
      await storage.createDeviceSession({ userId: user.id, token, deviceId: boundDeviceId, deviceName, platform: safePlatform });

      const { password: _, ...safeUser } = user as any;
      return res.json({ user: { ...safeUser, currentAuthToken: undefined }, token, boundDeviceId });
    } catch (error: any) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login with email/password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, deviceId, deviceName, platform } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      // Account exists but was created via Sign in with Apple (no password stored)
      if (!user.password) return res.status(401).json({ error: "APPLE_ACCOUNT", message: "This account was created with Sign in with Apple. Please use Sign in with Apple to log in." });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password" });

      const token = crypto.randomBytes(32).toString("hex");
      const boundDeviceId = deviceId || `web-${crypto.randomBytes(8).toString("hex")}`;
      const safePlatform = platform === "ios" ? "ios" : "web";
      await storage.createDeviceSession({ userId: user.id, token, deviceId: boundDeviceId, deviceName, platform: safePlatform });

      const { password: _, currentAuthToken: __, ...safeUser } = user as any;
      return res.json({ user: safeUser, token, boundDeviceId });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  // Sign in with Apple — verifies identity token, creates session
  app.post('/api/auth/apple', async (req: any, res) => {
    try {
      const { identityToken, firstName, lastName, email, deviceId, deviceName, platform } = req.body;
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

      // Generate a device-bound Bearer token — Capacitor/WKWebView loses session cookies
      // so native iOS uses this token for all subsequent API calls
      const token = crypto.randomBytes(32).toString("hex");
      const boundDeviceId = deviceId || `ios-${crypto.randomBytes(8).toString("hex")}`;
      const safePlatform = platform === "web" ? "web" : "ios";
      await storage.createDeviceSession({ userId: user.id, token, deviceId: boundDeviceId, deviceName, platform: safePlatform });

      const { password: _, currentAuthToken: __, ...safeUser } = user as any;
      return res.json({ user: safeUser, token, boundDeviceId });
    } catch (error: any) {
      console.error("Apple auth error:", error);
      return res.status(401).json({ message: "Apple Sign In failed. Please try again." });
    }
  });

  // Apple Sign In — web OAuth callback (Apple POSTs here after user authenticates)
  app.post('/api/auth/apple/web/callback', async (req: any, res) => {
    try {
      const { id_token, user: userJson } = req.body;
      if (!id_token) return res.redirect('/?apple_error=missing_token');

      // Parse name from Apple's first-login JSON blob
      let firstName: string | null = null;
      let lastName: string | null = null;
      if (userJson) {
        try {
          const parsed = JSON.parse(userJson);
          firstName = parsed?.name?.firstName || null;
          lastName  = parsed?.name?.lastName  || null;
        } catch { /* Apple didn't send user info — that's normal after first sign-in */ }
      }

      // Verify token with Apple's public keys (same as native iOS flow)
      const { payload } = await jwtVerify(id_token, APPLE_JWKS, {
        issuer: "https://appleid.apple.com",
      });

      const appleUserId = payload.sub as string;
      if (!appleUserId) return res.redirect('/?apple_error=invalid_token');

      let user = await storage.getUser(appleUserId);
      if (!user) {
        user = await storage.upsertUser({
          id: appleUserId,
          email: (payload.email as string) || null,
          firstName,
          lastName,
        });
      }

      // Create a web device session and return token via redirect
      const token = crypto.randomBytes(32).toString("hex");
      const deviceId = `web-apple-${crypto.randomBytes(8).toString("hex")}`;
      await storage.createDeviceSession({ userId: user.id, token, deviceId, platform: "web" });

      // Redirect to frontend callback page with the token
      res.redirect(`/apple-callback?token=${token}&deviceId=${encodeURIComponent(deviceId)}`);
    } catch (error: any) {
      console.error("Apple web callback error:", error);
      res.redirect('/?apple_error=auth_failed');
    }
  });

  // Logout - clear all sessions
  app.post('/api/auth/logout', async (req: any, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        await storage.deleteDeviceSession(token).catch(() => {});
      }
      req.session?.destroy(() => {});
      return res.json({ success: true });
    } catch {
      return res.json({ success: true });
    }
  });

  // Auth middleware — supports Apple session, Replit session, or Bearer token
  // Note on backward compat: tokens issued before device_sessions migration are
  // not in the device_sessions table and will fall through to 401, requiring
  // users to log in again. This is intentional — users without device binding
  // must re-authenticate to get a bound token.
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

    // 3. Bearer token — device-bound (email/password + Apple Sign In on Capacitor)
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const session = await storage.getDeviceSessionByToken(token);
        if (session) {
          // Device binding: X-Device-ID is required and must match the stored device
          const incomingDeviceId = req.headers["x-device-id"] as string | undefined;
          if (!incomingDeviceId || incomingDeviceId !== session.deviceId) {
            return res.status(401).json({ message: "Unauthorized", reason: "device_mismatch" });
          }
          req.authUserId = session.userId;
          // Update lastSeenAt in background — don't block the request
          storage.touchDeviceSession(token).catch(() => {});
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

  // Seed a demo case for a new user (no-op if they already have cases or a demo)
  app.post("/api/cases/seed-demo", sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const existing = await storage.getCasesByUserId(userId);
      const realCases = existing.filter((c: any) => !c.isDemo);
      if (realCases.length > 0 || existing.length > 0) {
        return res.json({ seeded: false, reason: "user already has cases" });
      }

      const demoCase = await storage.createCase({
        userId,
        patientName: "Sarah Mitchell",
        mrn: "MRN-DEMO-001",
        age: 54,
        gender: "F",
        chiefComplaint: "Chest pain and shortness of breath",
        status: "completed",
        transcription: "Demo transcription — this is an example case.",
        hpi: "Sarah Mitchell is a 54-year-old female with a history of hypertension and hyperlipidemia who presents with substernal chest pain radiating to the left arm for the past 2 hours, rated 7/10, associated with diaphoresis and mild shortness of breath. Onset was at rest. Denies nausea, vomiting, or syncope. Last episode of chest pain was 6 months ago, evaluated and negative at that time.",
        ros: { cardiovascular: "chest pain, palpitations", respiratory: "mild dyspnea", gastrointestinal: "denies nausea", musculoskeletal: "no extremity swelling" },
        physicalExam: "Vitals: BP 158/94, HR 88, RR 18, SpO2 97% on RA, Temp 37.1°C. General: Alert, mild distress. CV: RRR, no murmurs. Resp: Clear to auscultation bilaterally. Abdomen: Soft, non-tender. Extremities: No edema.",
        assessment: "Acute chest pain, likely NSTEMI vs unstable angina given the clinical presentation. EKG shows ST depression in V4-V6. Troponins pending. Risk-stratified as high-risk ACS.",
        differentialDiagnosis: [
          { diagnosis: "Non-ST Elevation Myocardial Infarction (NSTEMI)", icdCode: "I21.4" },
          { diagnosis: "Unstable Angina", icdCode: "I20.0" },
          { diagnosis: "Aortic Dissection", icdCode: "I71.00" },
          { diagnosis: "Pulmonary Embolism", icdCode: "I26.99" },
        ],
        plan: "1. Aspirin 325mg PO stat, then 81mg daily\n2. Nitroglycerin 0.4mg SL PRN chest pain\n3. Serial EKGs q30 min\n4. Troponin I at 0h and 3h\n5. Heparin drip per ACS protocol\n6. Cardiology consult stat\n7. NPO for possible cath\n8. Continuous cardiac monitoring",
        isDemo: true,
      } as any);

      res.json({ seeded: true, case: demoCase });
    } catch (error) {
      console.error("Error seeding demo case:", error);
      res.status(500).json({ error: "Failed to seed demo case" });
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

      // Ambassador accounts get unlimited lifetime Pro access — skip all subscription checks
      if ((user as any).accountType !== 'ambassador') {
        let hasActiveSubscription = false;
        const subscription = await storage.getSubscriptionByUserId(userId);
        if (subscription) {
          hasActiveSubscription = ['active', 'on_trial', 'trialing'].includes(subscription.status);
        }

        // Fallback: check RevenueCat live API (covers iOS subscribers using the web app
        // when the webhook hasn't fired yet or was missed)
        if (!hasActiveSubscription) {
          hasActiveSubscription = await checkRevenueCatEntitlement(userId);
        }

        // 14-day free trial for new users (based on account creation date)
        const TRIAL_DAYS = 14;
        const trialEnd = new Date((user.createdAt || new Date()).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        const isInTrial = new Date() < trialEnd;

        const hasFreeTokens = (user.freeTokensRemaining || 0) > 0;

        if (!hasActiveSubscription && !isInTrial && !hasFreeTokens) {
          return res.status(403).json({ 
            error: "SUBSCRIPTION_REQUIRED",
            message: "Your 14-day free trial has ended. Subscribe to continue creating cases.",
            trialEnded: true,
          });
        }

        // Decrement free token if applicable
        const parsed2 = insertCaseSchema.safeParse(req.body);
        if (parsed2.success) {
          if (!hasActiveSubscription && hasFreeTokens) {
            await storage.decrementFreeTokens(userId);
          }
        }
      }

      const parsed = insertCaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid case data", details: parsed.error.format() });
      }
      
      // Enforce server-side ownership - always use authenticated user's ID
      const caseData = { ...parsed.data, userId };
      const newCase = await storage.createCase(caseData);

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
        finalNotes: (caseRecord as any).finalNotes ?? null,
        disposition: (caseRecord as any).disposition ?? null,
      });

      const planText = Array.isArray(summary.plan) ? summary.plan.join("\n") : summary.plan;

      // Build the base update payload
      const updatePayload: Record<string, any> = {
        chiefComplaint: summary.chiefComplaint,
        hpi: summary.hpi,
        ros: summary.ros,
        physicalExam: summary.physicalExam,
        assessment: summary.assessment,
        differentialDiagnosis: summary.differentialDiagnosis,
        plan: planText,
        patientEducation: summary.patientEducation,
        treatmentRedFlags: summary.treatmentRedFlags,
        status: "completed",
      };

      // If disposition is set, also generate a full structured narrative summary
      const disposition = (caseRecord as any).disposition;
      if (disposition) {
        try {
          const { generateStructuredDispositionNote } = await import("./services/openai.js");
          const dischargeSummary = await generateStructuredDispositionNote({
            patientName: caseRecord.patientName,
            age: caseRecord.age,
            gender: caseRecord.gender,
            mrn: (caseRecord as any).mrn ?? null,
            chiefComplaint: summary.chiefComplaint,
            hpi: summary.hpi,
            physicalExam: summary.physicalExam,
            ros: summary.ros,
            assessment: summary.assessment,
            differentialDiagnosis: summary.differentialDiagnosis,
            plan: planText,
            disposition,
            finalNotes: (caseRecord as any).finalNotes ?? null,
            medications: (caseRecord as any).dischargeMedications ?? null,
            patientEducation: summary.patientEducation,
            treatmentRedFlags: summary.treatmentRedFlags,
            recordedAt: (caseRecord as any).recordedAt?.toString() ?? null,
          });
          updatePayload.dischargeSummary = dischargeSummary;
        } catch (e) {
          console.error("Failed to generate disposition narrative (non-fatal):", e);
        }
      }

      const updated = await storage.updateCase(req.params.id, updatePayload);
      res.json(updated);
    } catch (error) {
      console.error("Error generating summary:", error);
      await storage.updateCase(req.params.id, { status: "draft" });
      res.status(500).json({ error: "Failed to generate medical summary" });
    }
  });

  // Paraphrase raw dictation into clean clinical note
  app.post("/api/paraphrase", sessionAuth, async (req, res) => {
    try {
      const schema = z.object({ text: z.string().min(1) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "text is required" });

      const cleaned = await paraphraseDispositionNote(parsed.data.text);
      res.json({ cleaned });
    } catch (error) {
      console.error("Error paraphrasing:", error);
      res.status(500).json({ error: "Failed to paraphrase text" });
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
      const rawTranscription = await transcribeAudio(audioBase64, mimeType);

      // Step 2: Clean any remaining transcription errors with Gemini
      const transcription = await cleanMedicalTranscription(rawTranscription);

      // Step 3: Generate medical summary with OpenAI
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
        plan: Array.isArray(summary.plan) ? summary.plan.join("\n") : summary.plan,
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

      const rawDictation = parsed.data.dictation;
      console.log(`[process-text] Starting AI processing for case ${req.params.id}`);
      const transcription = await cleanMedicalTranscription(rawDictation);
      console.log(`[process-text] Transcription cleaned for case ${req.params.id}`);
      const summary = await generateMedicalSummary({
        patientName: caseRecord.patientName,
        age: caseRecord.age,
        gender: caseRecord.gender,
        transcription,
      });
      console.log(`[process-text] Summary generated for case ${req.params.id}`);
      const updatedCase = await storage.updateCase(req.params.id, {
        transcription,
        chiefComplaint: summary.chiefComplaint,
        hpi: summary.hpi,
        ros: summary.ros,
        physicalExam: summary.physicalExam,
        assessment: summary.assessment,
        differentialDiagnosis: summary.differentialDiagnosis,
        plan: Array.isArray(summary.plan) ? summary.plan.join("\n") : summary.plan,
        patientEducation: summary.patientEducation,
        treatmentRedFlags: summary.treatmentRedFlags,
        status: "completed",
      });
      console.log(`[process-text] Case ${req.params.id} completed`);
      res.json(updatedCase);
    } catch (error) {
      console.error("Error processing text:", error);
      await storage.updateCase(req.params.id, { status: "failed" });
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

  // Billing Routes

  app.get('/api/billing/status', sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const subscription = await storage.getSubscriptionByUserId(userId);
      const isSubscribed = subscription && ['active', 'trialing', 'on_trial'].includes(subscription.status);
      const isAmbassador = (user as any).accountType === 'ambassador';

      const TRIAL_DAYS = 14;
      const trialEnd = new Date((user.createdAt || new Date()).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      const isInTrial = !isSubscribed && !isAmbassador && new Date() < trialEnd;
      const trialDaysRemaining = isInTrial ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

      res.json({
        isEmailVerified: user.isEmailVerified,
        freeTokensRemaining: user.freeTokensRemaining || 0,
        isSubscribed: isSubscribed || isAmbassador,
        isAmbassador,
        isInTrial,
        trialDaysRemaining,
        trialEndsAt: trialEnd.toISOString(),
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

  // RevenueCat webhook — fires on every subscription lifecycle event
  app.post('/api/webhooks/revenuecat', async (req, res) => {
    try {
      const event = req.body?.event;
      const eventType = event?.type;
      const appUserId = event?.app_user_id;     // we set this to the user's DB id
      const productId = event?.product_id || 'apple-iap';
      const periodEnd = event?.expiration_at_ms ? new Date(event.expiration_at_ms) : null;

      if (!appUserId) return res.status(400).send('Missing app_user_id');

      const ACTIVE_EVENTS = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'SUBSCRIBER_ALIAS'];
      const CANCEL_EVENTS = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];

      if (ACTIVE_EVENTS.includes(eventType)) {
        const existing = await storage.getSubscriptionByUserId(appUserId);
        if (existing) {
          await storage.updateSubscription(existing.paddleSubscriptionId!, {
            status: 'active',
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
          });
        } else {
          await storage.createSubscription({
            userId: appUserId,
            paddleSubscriptionId: productId,
            paddleCustomerId: null,
            priceId: productId,
            status: 'active',
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
          });
        }
        // Also clear any free token debt so they can create cases immediately
        const user = await storage.getUser(appUserId);
        if (user && (user.freeTokensRemaining ?? 0) < 0) {
          await storage.updateUser(appUserId, { freeTokensRemaining: 0 });
        }
      }

      if (CANCEL_EVENTS.includes(eventType)) {
        const existing = await storage.getSubscriptionByUserId(appUserId);
        if (existing) {
          await storage.updateSubscription(existing.paddleSubscriptionId!, {
            status: eventType === 'BILLING_ISSUE' ? 'past_due' : 'canceled',
            cancelAtPeriodEnd: true,
          });
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('RevenueCat webhook error:', error);
      res.status(500).send('Webhook processing failed');
    }
  });

  // Account deletion
  app.delete('/api/auth/account', sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      await storage.deleteAccount(userId);
      req.session?.destroy(() => {});
      res.json({ success: true });
    } catch (e) {
      console.error("[delete-account]", e);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Promo code redemption
  app.post('/api/promo/redeem', sessionAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "No code provided" });

      const VALID_CODES = (process.env.AMBASSADOR_CODES || "MEDNOTE-FREE,MEDNOTEAI,DOCFREE2024")
        .split(",").map((c: string) => c.trim().toUpperCase());

      if (!VALID_CODES.includes(code.trim().toUpperCase())) {
        return res.status(400).json({ message: "Invalid promo code" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if ((user as any).accountType === 'ambassador') {
        return res.json({ message: "Already active", alreadyActive: true });
      }

      await storage.updateUser(userId, { accountType: 'ambassador' } as any);
      res.json({ success: true, message: "Promo code applied! You now have unlimited access." });
    } catch (e) {
      console.error("[promo]", e);
      res.status(500).json({ message: "Failed to redeem code" });
    }
  });

  return httpServer;
}
