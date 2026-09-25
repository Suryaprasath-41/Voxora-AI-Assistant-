import { TTSProvider, TTSVoice, TTSOptions, TTSResult } from "./types";

export class OpenAITTSProvider implements TTSProvider {
  name = "openai-tts";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
  }

  private voices: TTSVoice[] = [
    { id: "alloy", name: "Alloy", language: "en", gender: "neutral", style: "natural", description: "Versatile, balanced voice" },
    { id: "echo", name: "Echo", language: "en", gender: "male", style: "professional", description: "Warm, resonant tone" },
    { id: "fable", name: "Fable", language: "en", gender: "male", style: "narrator", description: "Expressive, animated narrator" },
    { id: "onyx", name: "Onyx", language: "en", gender: "male", style: "professional", description: "Deep, authoritative presence" },
    { id: "nova", name: "Nova", language: "en", gender: "female", style: "friendly", description: "Friendly, upbeat tone" },
    { id: "shimmer", name: "Shimmer", language: "en", gender: "female", style: "natural", description: "Clear, gentle voice" },
  ];

  async getAvailableVoices(): Promise<TTSVoice[]> {
    return this.voices;
  }

  async synthesize(
    text: string,
    _language: string,
    options?: TTSOptions
  ): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is missing.");
    }

    const voice = options?.voiceId || "nova";
    const speed = Math.min(Math.max(options?.speed || 1.0, 0.25), 4.0);

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice,
        speed,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI TTS Error (${response.status}): ${err}`);
    }

    const arrayBuf = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuf);

    return {
      audioBuffer,
      mimeType: "audio/mpeg",
      provider: this.name,
      voiceId: voice,
    };
  }
}
