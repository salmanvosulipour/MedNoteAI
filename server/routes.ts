import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMedicalSummary, generateDiagnosticInterpretation } from "./services/openai";
import { transcribeAudio } from "./services/gemini";
import { sendCaseSummaryEmail } from "./services/resend";
import { insertCaseSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
