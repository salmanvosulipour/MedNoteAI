import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
});

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const model = genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "audio/webm",
              data: audioBase64,
            },
          },
          {
            text: `You are a highly specialized medical transcription AI. Transcribe this physician dictation with maximum accuracy.

CRITICAL RULES:
1. Return ONLY the transcription — no commentary, no explanations, no formatting.
2. Preserve ALL medical terminology exactly as intended, correcting obvious phonetic mis-hearings.
3. The speaker may have an Arabic or Middle-Eastern accent — interpret accordingly.

MEDICAL CONTEXT — correct common mis-hearings to their intended medical terms:
- Anatomical: epigastric, periumbilical, RUQ/LUQ/RLQ/LLQ, peritoneal, retroperitoneal, pericardial, pleural, lumbar, sacral, inguinal, femoral, popliteal, brachial, radial, ulnar, temporal, occipital
- Symptoms: dyspnea, orthopnea, dysphagia, dysuria, hematuria, hemoptysis, hematemesis, melena, hematochezia, palpitations, syncope, presyncope, diaphoresis, pruritus, jaundice, edema
- Exam: auscultation, percussion, palpation, rebound tenderness, guarding, rigidity, crepitus, bruits, murmur, S1/S2/S3/S4, wheeze, crackles, rales, rhonchi, pleural rub
- Diagnoses: myocardial infarction, pulmonary embolism, deep vein thrombosis (DVT), pneumothorax, appendicitis, cholecystitis, pancreatitis, diverticulitis, Crohn's, ulcerative colitis, GERD, peptic ulcer, cirrhosis, hepatitis
- Labs/Imaging: CBC, BMP, CMP, troponin, D-dimer, BNP, creatinine, eGFR, INR, PT/PTT, ABG, CT angiography, echocardiogram, EKG/ECG
- Medications: metformin, metoprolol, lisinopril, atorvastatin, amlodipine, omeprazole, warfarin, heparin, aspirin, clopidogrel, furosemide, spironolactone, levothyroxine, prednisone, albuterol

Transcribe the audio now:`,
          },
        ],
      },
    ],
  });

  const response = await model;
  const text = response.text;
  
  if (!text) {
    throw new Error("No transcription returned from Gemini");
  }
  
  return text;
}

export async function cleanMedicalTranscription(rawText: string): Promise<string> {
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a medical transcription correction specialist. The text below was captured by a browser's built-in speech recognition, which does not understand medical terminology. It contains phonetic errors — medical terms were misheard and written as incorrect words.

Your job: correct ALL medical terminology errors while keeping the meaning and structure intact. Do NOT add new information. Do NOT summarize. Return ONLY the corrected transcription text.

The speaker has an Arabic/Middle-Eastern accent. Common phonetic substitutions to fix:
- "APK area" / "Epic area" / "Epic 3 area" → "epigastric area"
- "grey umbilical" / "preambe Kali" / "priambly" → "periumbilical"
- "nozia" / "nasha" / "nawsea" → "nausea"
- "warmicking" / "vomicking" / "vom" → "vomiting"
- "reborn" / "rebound" confusion → "rebound tenderness"
- "gastrology" → "gastroenterology"
- "worries" → "vomiting" (context dependent)
- "diabetic" → "diabetes" (when used as noun)
- "hypertension" should stay as is
- "debit is" → "diabetes"
- "preamble and as but" → "peristaltic sounds"
- "prolimed" / "prolined" → "prolonged"
- "DVT" related: "deep vein" stays, "thrombosis" stays
- Fix any other obvious medical mis-transcriptions

Input text:
${rawText}

Output (corrected transcription only):`,
          },
        ],
      },
    ],
  });

  const cleaned = response.text;
  // If Gemini fails for any reason, return original text as fallback
  return cleaned?.trim() || rawText;
}
