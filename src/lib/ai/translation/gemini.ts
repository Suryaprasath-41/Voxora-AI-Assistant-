import { TranslationProvider, TranslationResult, TranslationOptions } from "./types";
import { getLanguageByCode } from "../../languages";

export class GeminiTranslationProvider implements TranslationProvider {
  name = "google-gemini-2.5-flash";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
  }

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    _options?: TranslationOptions
  ): Promise<TranslationResult> {
    if (!this.apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    const srcName =
      sourceLanguage === "auto"
        ? "the original language"
        : getLanguageByCode(sourceLanguage).name;
    const tgtName = getLanguageByCode(targetLanguage).name;

    const prompt = `You are a professional human translator for Voxora AI.
Translate the following input from ${srcName} into fluent, natural ${tgtName}.
Preserve paragraphs, numbers, names, and tone.
Do NOT add any commentary, notes, explanations, or quotes. Output ONLY the translated text.

Text to translate:
${text}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Translation Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const translatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    return {
      sourceText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.99,
      provider: this.name,
    };
  }
}
