export interface TimbreAcousticProfile {
  pitchMeanHz: number;
  tempoWordsPerMin: number;
  spectralCentroid: number;
  energyVariance: number;
  genderEstimate: "male" | "female" | "neutral";
  timbreWarmth: number; // 0.0 - 1.0
}

export interface VoiceProfileResult {
  providerVoiceId: string;
  name: string;
  timbreProfile: TimbreAcousticProfile;
  consentConfirmed: boolean;
  consentTimestamp: Date;
}

export interface VoiceGenerationResult {
  audioBuffer: Buffer;
  mimeType: string;
  duration?: number;
  provider: string;
  isClonedVoice: boolean;
  safetyLabel: "AI-generated voice";
}

export interface VoiceCloningProvider {
  name: string;
  createVoiceProfile(
    userId: string,
    name: string,
    sampleAudio: Buffer,
    mimeType: string,
    consentConfirmed: boolean
  ): Promise<VoiceProfileResult>;
  generateSpeech(
    voiceProfile: {
      providerVoiceId?: string | null;
      timbreProfile?: string | null;
    },
    text: string,
    language: string
  ): Promise<VoiceGenerationResult>;
}
