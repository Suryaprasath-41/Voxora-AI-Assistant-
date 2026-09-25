export type VoiceStyle = "natural" | "professional" | "friendly" | "narrator" | "assistant";

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: "male" | "female" | "neutral";
  style: VoiceStyle;
  description: string;
}

export interface TTSOptions {
  voiceId?: string;
  style?: VoiceStyle;
  speed?: number; // 0.75 to 2.0
  pitch?: number; // -10 to +10
  format?: "mp3" | "wav" | "ogg";
}

export interface TTSResult {
  audioBuffer: Buffer;
  mimeType: string;
  duration?: number;
  provider: string;
  voiceId: string;
}

export interface TTSProvider {
  name: string;
  getAvailableVoices(languageCode?: string): Promise<TTSVoice[]>;
  synthesize(
    text: string,
    language: string,
    options?: TTSOptions
  ): Promise<TTSResult>;
}
