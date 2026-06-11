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
