import { TTSProvider, TTSOptions, TTSResult, TTSVoice } from "./types";
import { OpenAITTSProvider } from "./openai-tts";
import { NeuralTTSProvider } from "./neural-tts";

export * from "./types";
export * from "./openai-tts";
export * from "./neural-tts";

class ResilientTTSProvider implements TTSProvider {
  name = "resilient-tts";
  private primary: TTSProvider;
  private fallback: TTSProvider;

  constructor(primary: TTSProvider, fallback: TTSProvider) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async getAvailableVoices(languageCode?: string): Promise<TTSVoice[]> {
    try {
      return await this.primary.getAvailableVoices(languageCode);
    } catch {
      return await this.fallback.getAvailableVoices(languageCode);
    }
  }

  async synthesize(
    text: string,
    language: string,
    options?: TTSOptions
  ): Promise<TTSResult> {
    try {
      return await this.primary.synthesize(text, language, options);
    } catch (err) {
      console.warn("Primary TTS failed (e.g. quota or permission). Falling back to neural TTS:", (err as Error).message);
      return await this.fallback.synthesize(text, language, options);
    }
  }
}

export function getTTSProvider(): TTSProvider {
  const neural = new NeuralTTSProvider();
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
    return new ResilientTTSProvider(new OpenAITTSProvider(), neural);
  }
  return neural;
}
