import { NextRequest, NextResponse } from "next/server";
import { getTTSProvider } from "@/lib/ai/tts";
import { getVoiceCloningProvider } from "@/lib/ai/voice";
import { storage } from "@/lib/storage";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const user = await getRequiredUser();
    const rateLimit = checkRateLimit(`speech:${user.id}`, 40, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many speech synthesis requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      text,
      language = "en",
      voiceId,
      speed = 1.0,
      pitch = 0,
      style = "natural",
      voiceProfileId,
      projectId,
    } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Text is required to generate speech." },
        { status: 400 }
      );
    }

    let audioBuffer: Buffer;
    let mimeType: string = "audio/mpeg";
    let isClonedVoice = false;
    let safetyLabel = "";
    let providerName = "";
    let estimatedDuration = Math.max(1, Math.round(text.trim().split(/\s+/).length / 2.5));

    // Case 1: Cloned / Same-Speaker Voice Generation with Authorized Voice Profile
    if (voiceProfileId) {
      const voiceProfile = await db.voiceProfile.findFirst({
        where: { id: voiceProfileId, userId: user.id },
      });

      if (!voiceProfile) {
        return NextResponse.json(
          { error: "Voice profile not found or unauthorized." },
          { status: 404 }
        );
      }

      if (!voiceProfile.consentConfirmed) {
        return NextResponse.json(
          { error: "Voice cloning requires verified speaker consent." },
          { status: 403 }
        );
      }

      const voiceProvider = getVoiceCloningProvider();
      const clonedResult = await voiceProvider.generateSpeech(
        {
          providerVoiceId: voiceProfile.providerVoiceId,
          timbreProfile: voiceProfile.timbreProfile,
        },
        text.trim(),
        language
      );

      audioBuffer = clonedResult.audioBuffer;
      mimeType = clonedResult.mimeType;
      isClonedVoice = true;
      safetyLabel = "AI-generated voice";
      providerName = voiceProvider.name;
      if (clonedResult.duration) estimatedDuration = clonedResult.duration;
    } else {
      // Case 2: Standard Natural AI Speech Synthesis
      const ttsProvider = getTTSProvider();
      const ttsResult = await ttsProvider.synthesize(text.trim(), language, {
        voiceId,
        speed: Number(speed),
        pitch: Number(pitch),
        style,
      });

      audioBuffer = ttsResult.audioBuffer;
      mimeType = ttsResult.mimeType;
      providerName = ttsProvider.name;
      if (ttsResult.duration) estimatedDuration = ttsResult.duration;
    }

    // Save audio file to storage
    const saved = await storage.saveFile({
      buffer: audioBuffer,
      mimeType,
      originalName: `speech-${Date.now()}.mp3`,
    });

    // Save generation and audio asset in database if projectId is provided
    if (projectId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (project) {
        await db.generation.create({
          data: {
            projectId: project.id,
            voiceProfileId: voiceProfileId || null,
            text: text.trim(),
            language,
            audioUrl: saved.fileUrl,
            status: "COMPLETED",
            isClonedVoice,
          },
        });

        await db.audioAsset.create({
          data: {
            projectId: project.id,
            type: "SYNTHESIZED_SPEECH",
            fileUrl: saved.fileUrl,
            duration: estimatedDuration,
            mimeType: saved.mimeType,
            fileSize: saved.fileSize,
          },
        });

        await db.project.update({
          where: { id: project.id },
          data: { status: "COMPLETED" },
        });
      }
    }

    logger.info({
      requestId,
      userId: user.id,
      operation: "speech",
      processingTimeMs: Date.now() - startTime,
      provider: providerName,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      audioUrl: saved.fileUrl,
      duration: estimatedDuration,
      mimeType: saved.mimeType,
      isClonedVoice,
      safetyLabel: isClonedVoice ? "AI-generated voice" : undefined,
      provider: providerName,
      voiceId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Speech generation failed";
    logger.error({
      requestId,
      operation: "speech",
      processingTimeMs: Date.now() - startTime,
      status: "FAILED",
      error,
    });

    return NextResponse.json(
      { error: "The AI speech service is temporarily unavailable. " + message },
      { status: 500 }
    );
  }
}
