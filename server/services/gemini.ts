import OpenAI, { toFile } from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const audioBuffer = Buffer.from(audioBase64, "base64");

  const ext = mimeType.includes("mp4") ? "mp4"
    : mimeType.includes("mp3") ? "mp3"
    : mimeType.includes("ogg") ? "ogg"
    : mimeType.includes("wav") ? "wav"
    : "webm";

  const file = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    prompt: "Medical dictation by a physician. May include medical terminology, drug names, anatomy, diagnoses, lab values, and vitals.",
    language: "en",
  });

  if (!transcription.text) {
    throw new Error("No transcription returned from Whisper");
  }

  return transcription.text;
}

export async function cleanMedicalTranscription(rawText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a medical transcription correction specialist. Fix phonetic errors in speech-to-text output — medical terms that were misheard and written as wrong words.

Correct ALL medical terminology errors while keeping meaning and structure intact. Do NOT add new information. Do NOT summarize. Return ONLY the corrected transcription text.

The speaker has an Arabic/Middle-Eastern accent. Common phonetic substitutions to fix:
- "APK area" / "Epic area" → "epigastric area"
- "grey umbilical" / "priambly" → "periumbilical"  
- "nozia" / "nawsea" → "nausea"
- "warmicking" / "vomicking" → "vomiting"
- "reborn tenderness" → "rebound tenderness"
- "gastrology" → "gastroenterology"
- "debit is" → "diabetes"
- "prolimed" / "prolined" → "prolonged"
- "pre-unliable" → "periumbilical"
- "Milena" → "melena"
- Fix any other obvious medical mis-transcriptions`,
        },
        {
          role: "user",
          content: rawText,
        },
      ],
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content?.trim() || rawText;
  } catch (err) {
    console.warn("cleanMedicalTranscription failed, using raw text:", (err as Error).message);
    return rawText;
  }
}
