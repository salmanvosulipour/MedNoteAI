import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface TranscriptionInput {
  patientName: string;
  age: number;
  gender: string;
  transcription: string;
  finalNotes?: string | null;
  disposition?: string | null;
}

export interface MedicalSummary {
  chiefComplaint: string;
  hpi: string;
  ros: Record<string, string>;
  physicalExam: string;
  assessment: string;
  differentialDiagnosis: Array<{ diagnosis: string; icdCode: string }>;
  plan: string[] | string;
  patientEducation: string;
  treatmentRedFlags: string;
}

export async function generateMedicalSummary(input: TranscriptionInput): Promise<MedicalSummary> {
  const systemPrompt = `You are an expert medical scribe AI. A physician has dictated a full patient encounter — the dictation covers the history, review of systems, physical exam findings, and their clinical impression and plan, all mixed together in free speech.

Your job is to READ the entire dictation carefully and EXTRACT each section into its own structured field. Do NOT copy the entire dictation into a single field. Do NOT leave fields empty if the information exists in the dictation.

Return a JSON object with EXACTLY these fields:

{
  "chiefComplaint": "One sentence — the patient's main complaint and duration. e.g. 'Epigastric pain for 2 days'",

  "hpi": "Full narrative paragraph of the History of Present Illness — onset, location, duration, character, associated symptoms, aggravating/relieving factors, and pertinent positives/negatives mentioned in the history portion of the dictation",

  "ros": {
    "General": "findings or 'unremarkable'",
    "GI/Abdominal": "findings or 'unremarkable'",
    "Cardiovascular": "findings or 'unremarkable'",
    "Respiratory": "findings or 'unremarkable'",
    "Neurological": "findings or 'unremarkable'"
  },

  "physicalExam": "Complete physical exam findings formatted by system. Always include ALL standard systems below. For any system the physician did not explicitly report as abnormal, write 'Normal' or 'WNL'. Use line breaks between systems. Format exactly as:\nGeneral: [findings or 'Alert, well-appearing, in no acute distress']\nVitals: [BP/HR/RR/Temp/SpO2 or 'WNL']\nHEENT: [findings or 'Normal']\nNeck: [findings or 'Supple, no lymphadenopathy']\nCardiovascular: [findings or 'Regular rate and rhythm, no murmurs']\nRespiratory: [findings or 'Clear to auscultation bilaterally']\nAbdomen: [findings or 'Soft, non-tender, non-distended']\nExtremities: [findings or 'No edema, cyanosis, or clubbing']\nNeurological: [findings or 'Alert and oriented x3, grossly intact']\nSkin: [findings or 'No rashes or lesions']\nOnly mark abnormal if the physician explicitly dictated abnormal findings.",

  "assessment": "The physician's clinical assessment, impression, working diagnosis, and reasoning. Extract from the impression/assessment portion of the dictation.",

  "differentialDiagnosis": [
    { "diagnosis": "Most likely diagnosis", "icdCode": "ICD-10 code" },
    { "diagnosis": "Second possibility", "icdCode": "ICD-10 code" }
  ],

  "plan": [
    "1. First action item (labs, imaging, medications, referrals)",
    "2. Second action item",
    "3. Third action item"
  ],

  "patientEducation": "Patient-friendly explanation of their condition and what to expect",

  "treatmentRedFlags": "Warning signs the patient should watch for that require immediate medical attention"
}

CRITICAL RULES:
- Distribute the dictation content across ALL relevant fields — do NOT dump everything into hpi
- physicalExam should contain vitals + exam findings if mentioned
- ros should reflect pertinent positives and negatives mentioned
- If the physician mentions a diagnosis, put it in assessment and differentialDiagnosis
- If the physician mentions labs, imaging, or medications, put them in plan
- Generate reasonable content for fields based on the clinical context even if not explicitly stated
- Always return valid JSON with all fields populated`;

  const finalizationContext = input.disposition || input.finalNotes
    ? `\n\nFINALIZATION (added by physician after the encounter):
${input.disposition ? `Disposition: ${input.disposition}` : ""}
${input.finalNotes ? `Final Notes: ${input.finalNotes}` : ""}

Incorporate this finalization data into your Assessment and Plan — the disposition is the confirmed outcome, so update the Assessment to reflect it and ensure the Plan matches.`
    : "";

  const userPrompt = `Parse this physician dictation into a structured medical note:

Patient: ${input.patientName}, ${input.age} years old, ${input.gender}

FULL DICTATION:
${input.transcription}${finalizationContext}

Extract each section carefully. The dictation contains history, exam findings, and plan all together — separate them into the correct fields.`;

  let content: string | null | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });
      content = response.choices[0]?.message?.content;
      if (content) break;
      console.warn(`OpenAI attempt ${attempt}: empty response, retrying...`);
    } catch (err: any) {
      console.warn(`OpenAI attempt ${attempt} failed: ${err.message}`);
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  let parsed: MedicalSummary;
  try {
    parsed = JSON.parse(content) as MedicalSummary;
  } catch (e) {
    console.error("OpenAI returned non-JSON content:", content.slice(0, 500));
    throw new Error("OpenAI returned invalid JSON");
  }

  // Ensure required fields have defaults so the UI never shows empty
  return {
    chiefComplaint: parsed.chiefComplaint || "",
    hpi: parsed.hpi || "",
    ros: parsed.ros && typeof parsed.ros === "object" ? parsed.ros : {},
    physicalExam: parsed.physicalExam || "",
    assessment: parsed.assessment || "",
    differentialDiagnosis: Array.isArray(parsed.differentialDiagnosis) ? parsed.differentialDiagnosis : [],
    plan: parsed.plan || [],
    patientEducation: parsed.patientEducation || "",
    treatmentRedFlags: parsed.treatmentRedFlags || "",
  };
}

export interface DispositionNoteInput {
  patientName: string;
  age: number;
  gender: string;
  mrn?: string | null;
  chiefComplaint?: string | null;
  hpi?: string | null;
  physicalExam?: string | null;
  ros?: Record<string, string> | null;
  assessment?: string | null;
  differentialDiagnosis?: Array<{ diagnosis: string; icdCode: string }> | null;
  plan?: string | null;
  disposition: string;
  finalNotes?: string | null;
  medications?: Array<{ name: string; dose: string; frequency: string; duration: string; instructions?: string }> | null;
  patientEducation?: string | null;
  treatmentRedFlags?: string | null;
  recordedAt?: string | null;
}

const DISPOSITION_LABELS: Record<string, string> = {
  discharged: "Discharged Home",
  admitted: "Admitted to Hospital",
  transferred: "Transferred",
  ama: "Left Against Medical Advice",
  observation: "Admitted for Observation",
};

export async function generateStructuredDispositionNote(input: DispositionNoteInput): Promise<string> {
  const dispositionLabel = DISPOSITION_LABELS[input.disposition] || input.disposition;

  const rosText = input.ros && Object.keys(input.ros).length > 0
    ? Object.entries(input.ros).map(([sys, findings]) => `${sys}: ${findings}`).join("\n")
    : "Not recorded";

  const ddxText = input.differentialDiagnosis && input.differentialDiagnosis.length > 0
    ? input.differentialDiagnosis.map((d, i) => `${i + 1}. ${d.diagnosis} (${d.icdCode})`).join("\n")
    : "Not recorded";

  const medsText = input.medications && input.medications.length > 0
    ? input.medications.map(m => `- ${m.name} ${m.dose}, ${m.frequency}${m.duration ? " for " + m.duration : ""}${m.instructions ? " — " + m.instructions : ""}`).join("\n")
    : "None";

  const prompt = `You are an expert medical scribe. Write a complete, professional, structured clinical disposition summary for the following patient encounter. 

Write it as a proper medical document — NOT a list of fields. Use full clinical sentences and paragraphs where appropriate. It should read like a real hospital discharge or clinical encounter summary.

PATIENT: ${input.patientName}, ${input.age}-year-old ${input.gender}${input.mrn ? `, MRN: ${input.mrn}` : ""}
DATE: ${input.recordedAt ? new Date(input.recordedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
FINAL DISPOSITION: ${dispositionLabel}

CHIEF COMPLAINT: ${input.chiefComplaint || "Not recorded"}

HPI: ${input.hpi || "Not recorded"}

REVIEW OF SYSTEMS:
${rosText}

PHYSICAL EXAMINATION:
${input.physicalExam || "Not recorded"}

ASSESSMENT: ${input.assessment || "Not recorded"}

DIFFERENTIAL DIAGNOSIS:
${ddxText}

TREATMENT PLAN: ${input.plan || "Not recorded"}

MEDICATIONS: 
${medsText}

PHYSICIAN FINAL NOTES: ${input.finalNotes || "None"}

PATIENT EDUCATION: ${input.patientEducation || "Not recorded"}

WARNING SIGNS / RED FLAGS: ${input.treatmentRedFlags || "Not recorded"}

---

Write the disposition summary now. Use these section headers exactly:

CLINICAL ENCOUNTER SUMMARY
Patient Information
Chief Complaint & History
Review of Systems
Physical Examination
Assessment & Differential Diagnosis
Treatment & Management
Medications Prescribed
Disposition & Follow-up
Patient Education & Instructions

Make the narrative flow naturally. For sections with limited data, write a brief professional statement rather than "Not recorded". End with the disposition decision clearly stated and any follow-up instructions.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert clinical documentation specialist. Write professional, complete medical disposition summaries that read as real clinical documents — not template fill-ins.",
      },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 2048,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}

export async function paraphraseDispositionNote(rawDictation: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are an expert medical scribe. Convert raw physician voice dictation into a clean, professional, concise clinical note.
Fix transcription errors, use proper medical terminology, correct spelling, remove filler words, and structure the note clearly.
Keep all clinical facts exactly as stated. Return only the cleaned note text — no headings, no JSON, no extra commentary.`,
          },
          {
            role: "user",
            content: `Clean up this raw dictation into a professional clinical note:\n\n${rawDictation}`,
          },
        ],
        max_completion_tokens: 1024,
      });
      const content = response.choices[0]?.message?.content?.trim();
      if (content) return content;
      console.warn(`paraphraseDispositionNote attempt ${attempt}: empty response, retrying...`);
    } catch (err: any) {
      console.warn(`paraphraseDispositionNote attempt ${attempt} failed: ${err.message}`);
      if (attempt === 3) return rawDictation;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  return rawDictation;
}

export async function generateDiagnosticInterpretation(
  studyType: string,
  findings: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert radiologist/diagnostician. Provide a professional interpretation of diagnostic study findings. Be concise and clinically relevant.",
      },
      {
        role: "user",
        content: `Interpret the following ${studyType} findings:\n\n${findings}`,
      },
    ],
    max_completion_tokens: 1024,
  });

  return response.choices[0]?.message?.content || "";
}

export { openai };
