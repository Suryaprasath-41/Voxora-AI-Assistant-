import { TranslationProvider, TranslationResult, TranslationOptions } from "./types";
import { GeminiTranslationProvider } from "./gemini";
import { OpenAITranslationProvider } from "./openai";
import { NeuralTranslationProvider } from "./neural";

export * from "./types";
export * from "./gemini";
export * from "./openai";
export * from "./neural";

class ResilientTranslationProvider implements TranslationProvider {
  name = "resilient-multi-provider";
  private providers: TranslationProvider[] = [];

  constructor() {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") {
      this.providers.push(new GeminiTranslationProvider());
    }
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
      this.providers.push(new OpenAITranslationProvider());
    }
    this.providers.push(new NeuralTranslationProvider());
  }

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options?: TranslationOptions
  ): Promise<TranslationResult> {
    let lastError: Error | null = null;
    for (const provider of this.providers) {
      try {
        const result = await provider.translate(text, sourceLanguage, targetLanguage, options);
        if (result && result.translatedText) {
          return result;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Translation provider ${provider.name} failed, falling back to next provider:`, lastError.message);
      }
    }
    throw lastError || new Error("All translation providers failed.");
  }
}

export function getTranslationProvider(): TranslationProvider {
  return new ResilientTranslationProvider();
}
