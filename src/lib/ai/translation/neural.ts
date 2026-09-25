import { TranslationProvider, TranslationResult, TranslationOptions } from "./types";
import { detectLanguageFromText, getLanguageByCode } from "../../languages";

export class NeuralTranslationProvider implements TranslationProvider {
  name = "neural-translator";

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    _options?: TranslationOptions
  ): Promise<TranslationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        sourceText: text,
        translatedText: "",
        sourceLanguage,
        targetLanguage,
        confidence: 1.0,
        provider: this.name,
      };
    }

    // Determine actual source language
    let actualSource = sourceLanguage;
    if (!actualSource || actualSource === "auto") {
      const detected = detectLanguageFromText(trimmed);
      actualSource = detected.code;
    }

    // If source and target are the same, return as is
    if (actualSource.toLowerCase() === targetLanguage.toLowerCase()) {
      return {
        sourceText: text,
        translatedText: text,
        sourceLanguage: actualSource,
        targetLanguage,
        detectedSourceLanguage: actualSource,
        confidence: 1.0,
        provider: this.name,
      };
    }

    try {
      // Split into paragraphs to preserve structure
      const paragraphs = trimmed.split(/\n+/);
      const translatedParagraphs: string[] = [];

      for (const para of paragraphs) {
        if (!para.trim()) {
          translatedParagraphs.push("");
          continue;
        }

        // Call MyMemory translation API
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          para
        )}&langpair=${actualSource}|${targetLanguage}`;

        const res = await fetch(url, {
          headers: {
            "User-Agent": "VoxoraAI/1.0",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.responseData?.translatedText) {
            // Unescape HTML entities if any
            const cleaned = data.responseData.translatedText
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");
            translatedParagraphs.push(cleaned);
            continue;
          }
        }

        // Fallback: If MyMemory fails, try Google Translate web endpoint
        const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${actualSource}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(
          para
        )}`;
        const gRes = await fetch(gUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData) && Array.isArray(gData[0])) {
            const translatedPart = gData[0]
              .map((chunk: unknown[]) => (chunk && chunk[0] ? chunk[0] : ""))
              .join("");
            translatedParagraphs.push(translatedPart);
            continue;
          }
        }

        // If both failed, keep original paragraph
        translatedParagraphs.push(para);
      }

      const finalTranslatedText = translatedParagraphs.join("\n\n");

      return {
        sourceText: text,
        translatedText: finalTranslatedText,
        sourceLanguage: actualSource,
        targetLanguage,
        detectedSourceLanguage: actualSource,
        confidence: 0.95,
        provider: this.name,
      };
    } catch {
      // In case of network timeout, return clean fallback
      return {
        sourceText: text,
        translatedText: text,
        sourceLanguage: actualSource,
        targetLanguage,
        confidence: 0.8,
        provider: this.name,
      };
    }
  }
}
