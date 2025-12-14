import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
});

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${audioBase64}`,
            },
          },
          {
            type: "text",
            text: "Please transcribe this audio recording. This is a physician dictating a medical note for a patient encounter. Transcribe it word for word, preserving all medical terminology and details.",
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No transcription returned from Gemini");
  }
  return text;
}

export { openai as gemini };
