import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function translateToEnglish(text: string, sourceLanguage?: string): Promise<{ translatedText: string; detectedLanguage: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a medical translation assistant. Translate the following text to English accurately, preserving all medical terminology and clinical details. If the text is already in English, return it unchanged.

Return a JSON object with:
- translatedText: The English translation
- detectedLanguage: The detected source language name (e.g., "Persian", "Arabic", "Spanish")

Preserve medical terms, drug names, and clinical measurements exactly as mentioned.`
      },
      {
        role: "user",
        content: sourceLanguage 
          ? `Translate this ${sourceLanguage} text to English:\n\n${text}`
          : `Translate this text to English:\n\n${text}`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No translation returned from OpenAI");
  }

  const result = JSON.parse(content);
  return {
    translatedText: result.translatedText || text,
    detectedLanguage: result.detectedLanguage || "Unknown"
  };
}

export async function translateFromEnglish(text: string, targetLanguage: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a medical translation assistant. Translate the following English medical text to ${targetLanguage} accurately, preserving all medical terminology and clinical details. Use appropriate medical terminology in the target language.`
      },
      {
        role: "user",
        content: text
      }
    ],
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content || text;
}
