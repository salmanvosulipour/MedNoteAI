import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  // Convert base64 to buffer for Whisper API
  const audioBuffer = Buffer.from(audioBase64, "base64");
  
  // Determine file extension from mime type
  let extension = "webm";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
    extension = "mp3";
  } else if (mimeType.includes("wav")) {
    extension = "wav";
  } else if (mimeType.includes("m4a")) {
    extension = "m4a";
  } else if (mimeType.includes("ogg")) {
    extension = "ogg";
  }

  // Create a File object for the Whisper API
  const file = new File([audioBuffer], `audio.${extension}`, { type: mimeType });

  const response = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
    language: "en",
    prompt: "This is a physician dictating a medical note for a patient encounter. Transcribe accurately preserving all medical terminology.",
  });

  if (!response.text) {
    throw new Error("No transcription returned from OpenAI Whisper");
  }
  
  return response.text;
}
