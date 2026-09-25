import { TranslationProvider, TranslationResult, TranslationOptions } from "./types";
import { getLanguageByCode } from "../../languages";

export class OpenAITranslationProvider implements TranslationProvider {
  name = "openai-translator";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
  }

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options?: TranslationOptions
  ): Promise<TranslationResult> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is missing.");
    }

    const srcName = sourceLanguage === "auto" ? "the original language" : getLanguageByCode(sourceLanguage).name;
    const tgtName = getLanguageByCode(targetLanguage).name;

    const systemPrompt = `You are a professional human translator for Voxora AI.
Translate the user input from ${srcName} into fluent, natural ${tgtName}.
Preserve paragraphs, numbers, names, and tone.
Do not add commentary, preamble, or notes. Output ONLY the translated text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: options?.formality === "formal" ? 0.2 : 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Translation error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim() || "";

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
