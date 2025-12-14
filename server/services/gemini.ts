import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  // Determine audio format for GPT-4o
  let format: "wav" | "mp3" = "mp3";
  if (mimeType.includes("wav")) {
    format = "wav";
  }

  // Use GPT-4o with audio input capability
  const response = await openai.chat.completions.create({
    model: "gpt-4o-audio-preview",
    modalities: ["text"],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: {
              data: audioBase64,
              format: format,
            },
          },
          {
            type: "text",
            text: "Please transcribe this audio recording word for word. This is a physician dictating a medical note for a patient encounter. Preserve all medical terminology and details accurately.",
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No transcription returned from OpenAI");
  }
  
  return text;
}
