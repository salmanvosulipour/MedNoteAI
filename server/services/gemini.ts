import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64,
            },
          },
          {
            text: "Please transcribe this audio recording. This is a physician dictating a medical note for a patient encounter. Transcribe it word for word, preserving all medical terminology and details.",
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

export { ai as gemini };
