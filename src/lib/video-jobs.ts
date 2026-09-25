import { VideoJobProgress, VideoProcessingStep } from "./ai/video/types";
import { getVideoProvider } from "./ai/video";
import { getTranscriptionProvider } from "./ai/transcription";
import { getTranslationProvider } from "./ai/translation";
import { getTTSProvider } from "./ai/tts";
import { getVoiceCloningProvider } from "./ai/voice";
import { storage } from "./storage";
import db from "./db";
import { logger } from "./logger";

// In-memory jobs map (can also persist to DB)
const globalJobs = globalThis as unknown as {
  videoJobsMap?: Map<string, VideoJobProgress>;
};

if (!globalJobs.videoJobsMap) {
  globalJobs.videoJobsMap = new Map<string, VideoJobProgress>();
}

const jobsMap = globalJobs.videoJobsMap;

export interface StartVideoJobParams {
  userId: string;
  sourceType: "video" | "image_voice" | "image_text";
  sourceLanguage: string;
  targetLanguage: string;
  voiceProfileId?: string | null;
  voiceId?: string;
  inputText?: string;
  videoBuffer?: Buffer;
  videoMimeType?: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
  voiceBuffer?: Buffer;
  voiceMimeType?: string;
  title?: string;
}

export function getJob(jobId: string): VideoJobProgress | undefined {
  return jobsMap.get(jobId);
}

export function updateJob(jobId: string, updates: Partial<VideoJobProgress>) {
  const current = jobsMap.get(jobId);
  if (current) {
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };
    jobsMap.set(jobId, updated);
  }
}

export async function createAndStartVideoJob(params: StartVideoJobParams): Promise<string> {
  const jobId = crypto.randomUUID();
  const startTime = Date.now();

  const initialJob: VideoJobProgress = {
    jobId,
    userId: params.userId,
    status: "PROCESSING",
    step: "uploading",
    progressPercent: 10,
    sourceType: params.sourceType,
    sourceLanguage: params.sourceLanguage,
    targetLanguage: params.targetLanguage,
    voiceProfileId: params.voiceProfileId || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jobsMap.set(jobId, initialJob);

  // Execute processing asynchronously in background
  (async () => {
    try {
      const videoProvider = getVideoProvider();
      let extractedAudioBuffer: Buffer | null = null;
      let originalVideoUrl: string | undefined = undefined;
      let originalImageUrl: string | undefined = undefined;
      let originalAudioUrl: string | undefined = undefined;

      // STEP 1: Saving uploaded source assets
      if (params.videoBuffer) {
        const savedVid = await storage.saveFile({
          buffer: params.videoBuffer,
          mimeType: params.videoMimeType || "video/mp4",
          originalName: `source-video-${Date.now()}.mp4`,
        });
        originalVideoUrl = savedVid.fileUrl;
        updateJob(jobId, { sourceVideoUrl: originalVideoUrl, progressPercent: 20 });
      }

      if (params.imageBuffer) {
        const savedImg = await storage.saveFile({
          buffer: params.imageBuffer,
          mimeType: params.imageMimeType || "image/png",
          originalName: `source-image-${Date.now()}.png`,
        });
        originalImageUrl = savedImg.fileUrl;
        updateJob(jobId, { sourceImageUrl: originalImageUrl, progressPercent: 20 });
      }

      if (params.voiceBuffer) {
        const savedAud = await storage.saveFile({
          buffer: params.voiceBuffer,
          mimeType: params.voiceMimeType || "audio/wav",
          originalName: `source-voice-${Date.now()}.wav`,
        });
        originalAudioUrl = savedAud.fileUrl;
        extractedAudioBuffer = params.voiceBuffer;
      }

      // STEP 2: Extracting audio if video input
      if (params.sourceType === "video" && params.videoBuffer) {
        updateJob(jobId, { step: "extracting_audio", progressPercent: 30 });
        extractedAudioBuffer = await videoProvider.extractAudio(params.videoBuffer);

        const savedExtracted = await storage.saveFile({
          buffer: extractedAudioBuffer,
          mimeType: "audio/wav",
          originalName: `extracted-audio-${Date.now()}.wav`,
        });
        originalAudioUrl = savedExtracted.fileUrl;
        updateJob(jobId, { originalAudioUrl, progressPercent: 35 });
      }

      // STEP 3: Transcribing audio or using provided text
      let textToTranslate = params.inputText || "";
      let detectedLang = params.sourceLanguage;

      if (extractedAudioBuffer && extractedAudioBuffer.length > 0) {
        updateJob(jobId, { step: "transcribing", progressPercent: 45 });
        const transcriptionProvider = getTranscriptionProvider();
        const transcription = await transcriptionProvider.transcribe(
          extractedAudioBuffer,
          "audio/wav",
          { language: params.sourceLanguage }
        );
        textToTranslate = transcription.text;
        detectedLang = transcription.detectedLanguage || params.sourceLanguage;

        updateJob(jobId, {
          step: "detecting_language",
          transcriptText: textToTranslate,
          detectedLanguage: detectedLang,
          progressPercent: 55,
        });
      } else {
        updateJob(jobId, {
          transcriptText: textToTranslate,
          detectedLanguage: detectedLang,
          progressPercent: 55,
        });
      }

      if (!textToTranslate || !textToTranslate.trim()) {
        throw new Error("Could not detect or obtain speech text from source.");
      }

      // STEP 4: Translating
      updateJob(jobId, { step: "translating", progressPercent: 65 });
      const translationProvider = getTranslationProvider();
      const translation = await translationProvider.translate(
        textToTranslate.trim(),
        detectedLang,
        params.targetLanguage
      );

      const translatedText = translation.translatedText;
      updateJob(jobId, { translatedText, progressPercent: 75 });

      // STEP 5: Generating voice (Same-Speaker Timbre or Neural Voice)
      updateJob(jobId, { step: "generating_voice", progressPercent: 80 });

      let speechAudioBuffer: Buffer;
      let isCloned = false;

      if (params.voiceProfileId) {
        const vp = await db.voiceProfile.findFirst({
          where: { id: params.voiceProfileId, userId: params.userId },
        });

        if (vp && vp.consentConfirmed) {
          const cloner = getVoiceCloningProvider();
          const clonedResult = await cloner.generateSpeech(
            { providerVoiceId: vp.providerVoiceId, timbreProfile: vp.timbreProfile },
            translatedText,
            params.targetLanguage
          );
          speechAudioBuffer = clonedResult.audioBuffer;
          isCloned = true;
        } else {
          const tts = getTTSProvider();
          const ttsRes = await tts.synthesize(translatedText, params.targetLanguage, {
            voiceId: params.voiceId || "natural-female",
          });
          speechAudioBuffer = ttsRes.audioBuffer;
        }
      } else {
        const tts = getTTSProvider();
        const ttsRes = await tts.synthesize(translatedText, params.targetLanguage, {
          voiceId: params.voiceId || "natural-female",
        });
        speechAudioBuffer = ttsRes.audioBuffer;
      }

      const savedGeneratedAudio = await storage.saveFile({
        buffer: speechAudioBuffer,
        mimeType: "audio/mpeg",
        originalName: `video-speech-${Date.now()}.mp3`,
      });
      const generatedAudioUrl = savedGeneratedAudio.fileUrl;
      updateJob(jobId, { generatedAudioUrl, isClonedVoice: isCloned, progressPercent: 85 });

      // STEP 6: Video Lip-Sync / Talking Person Synthesis
      updateJob(jobId, { step: "synchronizing_video", progressPercent: 90 });

      let finalVideoBuffer: Buffer;
      if (params.sourceType === "video" && params.videoBuffer) {
        // Video to Video with lip-sync audio multiplexing
        finalVideoBuffer = await videoProvider.translateAndLipSyncVideo(
          params.videoBuffer,
          speechAudioBuffer
        );
      } else if (params.imageBuffer) {
        // Image to Talking Video
        finalVideoBuffer = await videoProvider.generateTalkingVideo(
          params.imageBuffer,
          speechAudioBuffer
        );
      } else {
        throw new Error("No video or image source provided for video rendering.");
      }

      // STEP 7: Rendering and Saving Final Video
      updateJob(jobId, { step: "rendering", progressPercent: 95 });
      const savedFinalVideo = await storage.saveFile({
        buffer: finalVideoBuffer,
        mimeType: "video/mp4",
        originalName: `translated-video-${Date.now()}.mp4`,
      });
      const finalVideoUrl = savedFinalVideo.fileUrl;
      const duration = Math.max(2, Math.round(translatedText.split(/\s+/).length / 2.5));

      // STEP 8: Persist to Existing Projects System in Database
      const projectTitle =
        params.title ||
        `Video Translation: ${detectedLang.toUpperCase()} → ${params.targetLanguage.toUpperCase()}`;

      const project = await db.project.create({
        data: {
          userId: params.userId,
          title: projectTitle,
          sourceLanguage: detectedLang,
          targetLanguage: params.targetLanguage,
          type: "video",
          status: "COMPLETED",
          transcripts: {
            create: {
              originalText: textToTranslate,
              detectedLanguage: detectedLang,
              confidence: 0.99,
            },
          },
          translations: {
            create: {
              sourceText: textToTranslate,
              translatedText: translatedText,
              sourceLanguage: detectedLang,
              targetLanguage: params.targetLanguage,
            },
          },
          audioAssets: {
            create: [
              ...(originalVideoUrl
                ? [
                    {
                      type: "ORIGINAL_VIDEO",
                      fileUrl: originalVideoUrl,
                      duration: duration,
                      mimeType: "video/mp4",
                      fileSize: params.videoBuffer?.length || 1024,
                    },
                  ]
                : []),
              ...(originalImageUrl
                ? [
                    {
                      type: "PERSON_IMAGE",
                      fileUrl: originalImageUrl,
                      duration: duration,
                      mimeType: "image/png",
                      fileSize: params.imageBuffer?.length || 1024,
                    },
                  ]
                : []),
              {
                type: "SYNTHESIZED_SPEECH",
                fileUrl: generatedAudioUrl,
                duration: duration,
                mimeType: "audio/mpeg",
                fileSize: savedGeneratedAudio.fileSize,
              },
              {
                type: "FINAL_VIDEO",
                fileUrl: finalVideoUrl,
                duration: duration,
                mimeType: "video/mp4",
                fileSize: savedFinalVideo.fileSize,
              },
            ],
          },
          generations: {
            create: {
              voiceProfileId: params.voiceProfileId || null,
              text: translatedText,
              language: params.targetLanguage,
              audioUrl: finalVideoUrl,
              status: "COMPLETED",
              isClonedVoice: isCloned,
            },
          },
        },
      });

      // Mark Job as COMPLETED
      updateJob(jobId, {
        status: "COMPLETED",
        step: "completed",
        progressPercent: 100,
        finalVideoUrl,
        duration,
        projectId: project.id,
      });

      logger.info({
        requestId: jobId,
        userId: params.userId,
        operation: "video_translation_job",
        processingTimeMs: Date.now() - startTime,
        status: "SUCCESS",
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Video translation failed";
      updateJob(jobId, {
        status: "FAILED",
        step: "failed",
        error: errMsg,
      });

      logger.error({
        requestId: jobId,
        userId: params.userId,
        operation: "video_translation_job",
        status: "FAILED",
        error: err,
      });
    }
  })();

  return jobId;
}
