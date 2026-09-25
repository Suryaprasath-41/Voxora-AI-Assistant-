export interface TranslationOptions {
  preserveTone?: boolean;
  formality?: "formal" | "casual" | "neutral";
  contextPrompt?: string;
}

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedSourceLanguage?: string;
  confidence: number;
  provider: string;
}

export interface TranslationProvider {
  name: string;
  translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options?: TranslationOptions
  ): Promise<TranslationResult>;
}
