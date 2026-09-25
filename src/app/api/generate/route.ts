import { NextRequest, NextResponse } from "next/server";
import { getTranscriptionProvider } from "@/lib/ai/transcription";
import { getTranslationProvider } from "@/lib/ai/translation";
import { getTTSProvider } from "@/lib/ai/tts";
import { getVoiceCloningProvider } from "@/lib/ai/voice";
import { storage } from "@/lib/storage";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const user = await getRequiredUser();
    const contentType = req.headers.get("content-type") || "";

    let mode: "voice" | "upload" | "text" = "text";
    let inputText = "";
    let sourceLanguage = "auto";
    let targetLanguage = "en";
    let voiceId = "natural-female";
    let voiceProfileId: string | null = null;
    let inputAudioUrl: string | null = null;
    let title = "Voice Project";
    let fileBuffer: Buffer | null = null;
    let fileMimeType = "audio/wav";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      mode = (formData.get("mode") as "voice" | "upload" | "text") || "voice";
      sourceLanguage = (formData.get("sourceLanguage") as string) || "auto";
      targetLanguage = (formData.get("targetLanguage") as string) || "en";
      voiceId = (formData.get("voiceId") as string) || "natural-female";
      voiceProfileId = (formData.get("voiceProfileId") as string) || null;
      title = (formData.get("title") as string) || "Voice Translation";
      const prompt = (formData.get("prompt") as string) || "";

      const file = formData.get("file") as File | null;
      if (file) {
        fileMimeType = file.type || "audio/wav";
        const ab = await file.arrayBuffer();
        fileBuffer = Buffer.from(ab);

        // Save input audio
        const savedInput = await storage.saveFile({
          buffer: fileBuffer,
          mimeType: fileMimeType,
          originalName: file.name || "input.wav",
        });
        inputAudioUrl = savedInput.fileUrl;

        // Step 1: Transcribe
        const transcriptionProvider = getTranscriptionProvider();
        const transcription = await transcriptionProvider.transcribe(
          fileBuffer,
          fileMimeType,
          { language: sourceLanguage, prompt }
        );

        inputText = transcription.text;
        if (sourceLanguage === "auto") {
          sourceLanguage = transcription.detectedLanguage;
        }
      }
    } else {
      const body = await req.json();
      mode = "text";
      inputText = body.text || "";
      sourceLanguage = body.sourceLanguage || "auto";
      targetLanguage = body.targetLanguage || "en";
      voiceId = body.voiceId || "natural-female";
      voiceProfileId = body.voiceProfileId || null;
      title = body.title || "Text to Speech Translation";
    }

    if (!inputText || !inputText.trim()) {
      return NextResponse.json(
        { error: "Could not obtain or recognize text from input." },
        { status: 400 }
      );
    }

    // Step 2: Translate
    const translationProvider = getTranslationProvider();
    const translation = await translationProvider.translate(
      inputText.trim(),
      sourceLanguage,
      targetLanguage
    );

    // Step 3: Text-To-Speech / Voice-Preserving Cloning
    let audioBuffer: Buffer;
    let outMime = "audio/mpeg";
    let isClonedVoice = false;
    let safetyLabel = "";

    if (voiceProfileId) {
      const vp = await db.voiceProfile.findFirst({
        where: { id: voiceProfileId, userId: user.id },
      });
      if (vp && vp.consentConfirmed) {
        const cloner = getVoiceCloningProvider();
        const cloned = await cloner.generateSpeech(
          { providerVoiceId: vp.providerVoiceId, timbreProfile: vp.timbreProfile },
          translation.translatedText,
          targetLanguage
        );
        audioBuffer = cloned.audioBuffer;
        outMime = cloned.mimeType;
        isClonedVoice = true;
        safetyLabel = "AI-generated voice";
      } else {
        const tts = getTTSProvider();
        const res = await tts.synthesize(translation.translatedText, targetLanguage, { voiceId });
        audioBuffer = res.audioBuffer;
      }
    } else {
      const tts = getTTSProvider();
      const res = await tts.synthesize(translation.translatedText, targetLanguage, { voiceId });
      audioBuffer = res.audioBuffer;
    }

    // Save generated audio
    const savedAudio = await storage.saveFile({
      buffer: audioBuffer,
      mimeType: outMime,
      originalName: `voxora-${Date.now()}.mp3`,
    });

    const duration = Math.max(1, Math.round(translation.translatedText.split(/\s+/).length / 2.5));

    // Save project in database
    const project = await db.project.create({
      data: {
        userId: user.id,
        title: title || `${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()} Translation`,
        sourceLanguage,
        targetLanguage,
        status: "COMPLETED",
        type: mode,
        transcripts: {
          create: {
            originalText: inputText,
            detectedLanguage: sourceLanguage,
            confidence: 0.98,
          },
        },
        translations: {
          create: {
            sourceText: inputText,
            translatedText: translation.translatedText,
            sourceLanguage,
            targetLanguage,
          },
        },
        audioAssets: {
          create: [
            ...(inputAudioUrl
              ? [
                  {
                    type: "INPUT_VOICE",
                    fileUrl: inputAudioUrl,
                    duration: 3.0,
                    mimeType: fileMimeType,
                    fileSize: fileBuffer?.length || 1024,
                  },
                ]
              : []),
            {
              type: "SYNTHESIZED_SPEECH",
              fileUrl: savedAudio.fileUrl,
              duration,
              mimeType: outMime,
              fileSize: savedAudio.fileSize,
            },
          ],
        },
        generations: {
          create: {
            voiceProfileId: voiceProfileId || null,
            text: translation.translatedText,
            language: targetLanguage,
            audioUrl: savedAudio.fileUrl,
            status: "COMPLETED",
            isClonedVoice,
          },
        },
      },
      include: {
        transcripts: true,
        translations: true,
        generations: true,
        audioAssets: true,
      },
    });

    logger.info({
      requestId,
      userId: user.id,
      operation: "full_pipeline_generate",
      processingTimeMs: Date.now() - startTime,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      project,
      transcript: inputText,
      translation: translation.translatedText,
      sourceLanguage,
      targetLanguage,
      audioUrl: savedAudio.fileUrl,
      duration,
      isClonedVoice,
      safetyLabel: isClonedVoice ? "AI-generated voice" : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Pipeline generation failed";
    logger.error({
      requestId,
      operation: "full_pipeline_generate",
      processingTimeMs: Date.now() - startTime,
      status: "FAILED",
      error,
    });

    return NextResponse.json(
      { error: "Processing failed: " + message },
      { status: 500 }
    );
  }
}
