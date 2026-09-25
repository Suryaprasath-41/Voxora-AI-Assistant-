export type VideoProcessingStep =
  | "uploading"
  | "extracting_audio"
  | "transcribing"
  | "detecting_language"
  | "translating"
  | "generating_voice"
  | "synchronizing_video"
  | "rendering"
  | "completed"
  | "failed";

export interface VideoJobProgress {
  jobId: string;
  userId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  step: VideoProcessingStep;
  progressPercent: number;
  sourceType: "video" | "image_voice" | "image_text";
  sourceVideoUrl?: string;
  sourceImageUrl?: string;
  originalAudioUrl?: string;
  transcriptText?: string;
  sourceLanguage?: string;
  detectedLanguage?: string;
  translatedText?: string;
  targetLanguage: string;
  generatedAudioUrl?: string;
  finalVideoUrl?: string;
  duration?: number;
  isClonedVoice?: boolean;
  voiceProfileId?: string;
  projectId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoProvider {
  name: string;
  extractAudio(videoBuffer: Buffer): Promise<Buffer>;
  generateTalkingVideo(imageBuffer: Buffer, audioBuffer: Buffer, duration?: number): Promise<Buffer>;
  translateAndLipSyncVideo(videoBuffer: Buffer, newAudioBuffer: Buffer, duration?: number): Promise<Buffer>;
}
