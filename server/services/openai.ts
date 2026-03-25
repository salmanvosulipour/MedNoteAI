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
  const systemPrompt = `You are an expert medical scribe AI assistant. Your task is to generate a structured medical note from a physician's dictation.

Output a JSON object with the following fields:
- chiefComplaint: Brief statement of the patient's main concern
- hpi: History of Present Illness - detailed narrative of the current problem
- ros: Review of Systems - object with keys for each system (General, HEENT, Cardiovascular, Respiratory, GI, Neurologic, etc.) and their findings
- physicalExam: Formatted physical examination findings
- assessment: Clinical assessment and reasoning
- differentialDiagnosis: Array of objects with {diagnosis, icdCode} - include ICD-10 codes
- plan: Array of strings, each a numbered treatment step. Example: ["1. Order chest X-ray.", "2. Obtain blood tests (CBC, BMP)."]
- patientEducation: Patient-friendly education about their condition
- treatmentRedFlags: Warning signs that require immediate medical attention

Be thorough, professional, and use standard medical terminology.`;

  const userPrompt = `Generate a medical note for the following patient encounter:

Patient: ${input.patientName}
Age: ${input.age} years old
Gender: ${input.gender}

Physician's Dictation:
${input.transcription}

Please generate a complete, structured medical note in JSON format.`;

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

  return JSON.parse(content) as MedicalSummary;
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
