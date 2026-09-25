import {
  VoiceCloningProvider,
  VoiceProfileResult,
  VoiceGenerationResult,
} from "./types";

export class ElevenLabsVoiceProvider implements VoiceCloningProvider {
  name = "elevenlabs-clone";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || "";
  }

  async createVoiceProfile(
    userId: string,
    name: string,
    sampleAudio: Buffer,
    mimeType: string,
    consentConfirmed: boolean
  ): Promise<VoiceProfileResult> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key is missing.");
    }
    if (!consentConfirmed) {
      throw new Error("Explicit speaker authorization is required for voice cloning.");
    }

    const formData = new FormData();
    formData.append("name", `Voxora-${name}`);
    formData.append("description", `Authorized Voxora AI voice for user ${userId}`);
    const uint8 = new Uint8Array(sampleAudio);
    const blob = new Blob([uint8], { type: mimeType });
    formData.append("files", blob, "sample.mp3");

    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs Voice Cloning Error (${res.status}): ${err}`);
    }

    const data = await res.json();

    return {
      providerVoiceId: data.voice_id,
      name,
      timbreProfile: {
        pitchMeanHz: 150,
        tempoWordsPerMin: 140,
        spectralCentroid: 2000,
        energyVariance: 0.8,
        genderEstimate: "neutral",
        timbreWarmth: 0.9,
      },
      consentConfirmed: true,
      consentTimestamp: new Date(),
    };
  }

  async generateSpeech(
    voiceProfile: {
      providerVoiceId?: string | null;
      timbreProfile?: string | null;
    },
    text: string,
    _language: string
  ): Promise<VoiceGenerationResult> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key is missing.");
    }
    const voiceId = voiceProfile.providerVoiceId || "21m00Tcm4TlvDq8ikWAM";

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs Speech Generation Error (${res.status}): ${err}`);
    }

    const arrayBuf = await res.arrayBuffer();
    return {
      audioBuffer: Buffer.from(arrayBuf),
      mimeType: "audio/mpeg",
      provider: this.name,
      isClonedVoice: true,
      safetyLabel: "AI-generated voice",
    };
  }
}
