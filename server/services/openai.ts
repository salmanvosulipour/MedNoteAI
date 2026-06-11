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

  "physicalExam": "Formatted physical exam findings. Use line breaks between systems. Include vitals if mentioned. Extract from the examination portion of the dictation — do NOT leave blank if the physician mentioned any exam findings.",

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
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

export async function paraphraseDispositionNote(rawDictation: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
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
  return response.choices[0]?.message?.content?.trim() || rawDictation;
}

export async function generateDiagnosticInterpretation(
  studyType: string,
  findings: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
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
