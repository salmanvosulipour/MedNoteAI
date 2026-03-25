import { queryClient } from "./queryClient";

const API_BASE = "/api";

export interface Case {
  id: string;
  userId: string;
  patientName: string;
  mrn?: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  status: string;
  recordedAt: string;
  transcription?: string;
  hpi?: string;
  ros?: Record<string, string>;
  physicalExam?: string;
  assessment?: string;
  differentialDiagnosis?: Array<{ diagnosis: string; icdCode: string }>;
  plan?: string;
  patientEducation?: string;
  treatmentRedFlags?: string;
  diagnosticStudies?: Array<{ type: string; imageUrl?: string; interpretation: string; aiAssisted: boolean }>;
  dischargeMedications?: Array<{ name: string; dose: string; frequency: string; duration: string; instructions: string }>;
  patientEmail?: string;
  emailStatus?: { sentAt: string; recipient: string; status: string; messageId?: string; error?: string };
}

export async function fetchCases(userId: string = "demo-user"): Promise<Case[]> {
  const res = await fetch(`${API_BASE}/cases?userId=${userId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function fetchCase(id: string): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch case");
  return res.json();
}

export async function createCase(data: {
  userId: string;
  patientName: string;
  mrn?: string;
  age: number;
  gender: string;
  chiefComplaint: string;
}): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ...data, status: "draft" }),
  });
  if (!res.ok) throw new Error("Failed to create case");
  return res.json();
}

export async function updateCase(id: string, data: Partial<Case>): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update case");
  return res.json();
}

export async function deleteCase(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cases/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete case");
}

export async function processAudio(caseId: string, audioBlob: Blob): Promise<Case> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const res = await fetch(`${API_BASE}/cases/${caseId}/process-audio`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to process audio");
  }
  return res.json();
}

export async function processText(caseId: string, dictation: string): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/process-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ dictation }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to process dictation");
  }
  return res.json();
}

export async function generateSummary(caseId: string): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/generate-summary`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to generate summary");
  return res.json();
}

export async function sendEmailSummary(caseId: string, patientEmail: string, physicianName?: string): Promise<{ success: boolean; messageId: string }> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/email-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ patientEmail, physicianName }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to send email");
  }
  return res.json();
}

export async function paraphraseNote(text: string): Promise<string> {
  const res = await fetch(`${API_BASE}/paraphrase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to paraphrase");
  const data = await res.json();
  return data.cleaned as string;
}

export function invalidateCases() {
  queryClient.invalidateQueries({ queryKey: ["cases"] });
}

export function invalidateCase(id: string) {
  queryClient.invalidateQueries({ queryKey: ["case", id] });
}

export async function fetchCasesByMrn(mrn: string): Promise<Case[]> {
  const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(mrn)}/cases`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch patient cases");
  return res.json();
}
