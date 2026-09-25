import {
  VoiceCloningProvider,
  VoiceProfileResult,
  VoiceGenerationResult,
} from "./types";
import { ElevenLabsVoiceProvider } from "./elevenlabs";
import { NeuralTimbreVoiceProvider } from "./neural-timbre";

export * from "./types";
export * from "./elevenlabs";
export * from "./neural-timbre";

class ResilientVoiceCloningProvider implements VoiceCloningProvider {
  name = "resilient-voice-cloner";
  private primary: VoiceCloningProvider;
  private fallback: VoiceCloningProvider;

  constructor(primary: VoiceCloningProvider, fallback: VoiceCloningProvider) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async createVoiceProfile(
    userId: string,
    name: string,
    sampleAudio: Buffer,
    mimeType: string,
    consentConfirmed: boolean
  ): Promise<VoiceProfileResult> {
    try {
      return await this.primary.createVoiceProfile(
        userId,
        name,
        sampleAudio,
        mimeType,
        consentConfirmed
      );
    } catch (err) {
      console.warn(
        "Primary voice cloner failed (e.g. ElevenLabs paid tier requirement). Falling back to acoustic timbre profiler:",
        (err as Error).message
      );
      return await this.fallback.createVoiceProfile(
        userId,
        name,
        sampleAudio,
        mimeType,
        consentConfirmed
      );
    }
  }

  async generateSpeech(
    voiceProfile: {
      providerVoiceId?: string | null;
      timbreProfile?: string | null;
    },
    text: string,
    language: string
  ): Promise<VoiceGenerationResult> {
    try {
      return await this.primary.generateSpeech(voiceProfile, text, language);
    } catch (err) {
      console.warn(
        "Primary voice speech generation failed. Falling back to neural acoustic timbre synthesis:",
        (err as Error).message
      );
      return await this.fallback.generateSpeech(voiceProfile, text, language);
    }
  }
}

export function getVoiceCloningProvider(): VoiceCloningProvider {
  const timbre = new NeuralTimbreVoiceProvider();
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim() !== "") {
    return new ResilientVoiceCloningProvider(new ElevenLabsVoiceProvider(), timbre);
  }
  return timbre;
}
