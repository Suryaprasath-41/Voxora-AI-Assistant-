import { TranscriptionProvider, TranscriptionResult, TranscriptionOptions } from "./types";
import { getLanguageByCode } from "../../languages";

export class GroqWhisperProvider implements TranscriptionProvider {
  name = "groq-whisper";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || "";
  }

  async detectLanguage(audioBuffer: Buffer, mimeType: string): Promise<{ language: string; confidence: number }> {
    const result = await this.transcribe(audioBuffer, mimeType, { language: "auto" });
    return {
      language: result.detectedLanguage,
      confidence: result.confidence,
    };
  }

  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("Groq API key is not configured.");
    }

    const formData = new FormData();
    const uint8 = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8], { type: mimeType });
    formData.append("file", blob, "audio.wav");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "verbose_json");

    if (options?.language && options.language !== "auto") {
      formData.append("language", options.language);
    }

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq Whisper error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const detectedLangCode = data.language || options?.language || "en";
    const langInfo = getLanguageByCode(detectedLangCode);

    return {
      text: data.text || "",
      detectedLanguage: detectedLangCode,
      languageName: langInfo.name,
      confidence: 0.99,
      duration: data.duration,
      provider: this.name,
    };
  }
}
