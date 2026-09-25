export interface TranscriptionOptions {
  language?: string; // e.g. "ta", "hi", "en", or "auto"
  prompt?: string;
  temperature?: number;
}

export interface TranscriptionResult {
  text: string;
  detectedLanguage: string;
  languageName: string;
  confidence: number;
  duration?: number;
  provider: string;
}

export interface TranscriptionProvider {
  name: string;
  detectLanguage(audioBuffer: Buffer, mimeType: string): Promise<{ language: string; confidence: number }>;
  transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult>;
}
