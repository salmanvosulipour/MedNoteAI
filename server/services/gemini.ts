import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
});

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const model = genAI.models.generateContent({
    model: "gemini-2.0-flash",
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
            text: "Please transcribe this audio recording word for word. This is a physician dictating medical notes. Preserve all medical terminology and details accurately. Return only the transcription text, no additional commentary.",
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
