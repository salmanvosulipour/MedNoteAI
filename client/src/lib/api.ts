import { queryClient } from "./queryClient";
import { getDeviceId } from "./device";
import { Capacitor } from "@capacitor/core";

const PRODUCTION_URL = "https://med-note-ai-1--salmanvosuli.replit.app";
const API_BASE = Capacitor.isNativePlatform() ? `${PRODUCTION_URL}/api` : "/api";

function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return (user as any)?.token ?? null;
  } catch {
    return null;
  }
}

async function buildAuthHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const deviceId = await getDeviceId();
    headers["X-Device-ID"] = deviceId;
  } catch {
    // non-fatal
  }
  return headers;
}

function handleDeviceMismatch(res: Response): void {
  if (res.status === 401) {
    res.clone().json().then((body) => {
      if (body?.reason === "device_mismatch") {
        localStorage.removeItem("user");
        window.location.href = "/?reason=device_mismatch";
      }
    }).catch(() => {});
  }
}

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const extraHeaders = (init.headers as Record<string, string>) ?? {};
  const authHeaders = await buildAuthHeaders(extraHeaders);
  const res = await fetch(url, { ...init, headers: authHeaders, credentials: "include" });
  handleDeviceMismatch(res);
  return res;
}

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
  disposition?: string;
  finalNotes?: string;
  dischargeSummary?: string;
}

export async function fetchCases(userId: string = "demo-user"): Promise<Case[]> {
  const res = await apiFetch(`${API_BASE}/cases?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function fetchCase(id: string): Promise<Case> {
  const res = await apiFetch(`${API_BASE}/cases/${id}`);
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
  const res = await apiFetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, status: "draft" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.message || "Failed to create case");
    err.code = body.error;
    throw err;
  }
  return res.json();
}

export async function updateCase(id: string, data: Partial<Case>): Promise<Case> {
  const res = await apiFetch(`${API_BASE}/cases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update case");
  return res.json();
}

export async function deleteCase(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/cases/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete case");
}

export async function processAudio(caseId: string, audioBlob: Blob): Promise<Case> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const token = getStoredToken();
  const deviceId = await getDeviceId().catch(() => "");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (deviceId) headers["X-Device-ID"] = deviceId;

  const res = await fetch(`${API_BASE}/cases/${caseId}/process-audio`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  handleDeviceMismatch(res);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to process audio");
  }
  return res.json();
}

export async function processText(caseId: string, dictation: string): Promise<Case> {
  const res = await apiFetch(`${API_BASE}/cases/${caseId}/process-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dictation }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to process dictation");
  }
  return res.json();
}

export async function generateSummary(caseId: string): Promise<Case> {
  const res = await apiFetch(`${API_BASE}/cases/${caseId}/generate-summary`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to generate summary");
  return res.json();
}

export async function sendEmailSummary(caseId: string, patientEmail: string, physicianName?: string): Promise<{ success: boolean; messageId: string }> {
  const res = await apiFetch(`${API_BASE}/cases/${caseId}/email-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientEmail, physicianName }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to send email");
  }
  return res.json();
}

export async function paraphraseNote(text: string): Promise<string> {
  const res = await apiFetch(`${API_BASE}/paraphrase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await apiFetch(`${API_BASE}/patients/${encodeURIComponent(mrn)}/cases`);
  if (!res.ok) throw new Error("Failed to fetch patient cases");
  return res.json();
}
