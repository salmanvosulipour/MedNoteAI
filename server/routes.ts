import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMedicalSummary, generateDiagnosticInterpretation } from "./services/openai";
import { insertCaseSchema } from "@shared/schema";
import { z } from "zod";

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

  return httpServer;
}
