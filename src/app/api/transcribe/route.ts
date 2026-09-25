import { NextRequest, NextResponse } from "next/server";
import { getTranscriptionProvider } from "@/lib/ai/transcription";
import { storage } from "@/lib/storage";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/webm",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const user = await getRequiredUser();
    const rateLimit = checkRateLimit(`transcribe:${user.id}`, 30, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many transcription requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "auto";
    const prompt = (formData.get("prompt") as string) || "";
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Audio or video file is required." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Your file exceeds the maximum allowed size of 50MB." },
        { status: 413 }
      );
    }

    const mimeType = file.type || "audio/wav";
    const isAllowed = ALLOWED_MIME_TYPES.some((type) =>
      mimeType.toLowerCase().startsWith(type.split("/")[0]) ||
      mimeType.toLowerCase() === type
    );

    if (!isAllowed && !file.name.match(/\.(mp3|wav|m4a|aac|flac|ogg|mp4|webm)$/i)) {
      return NextResponse.json(
        { error: "This audio format is not supported. Please upload MP3, WAV, M4A, AAC, FLAC, OGG, MP4, or WebM." },
        { status: 415 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save audio asset securely
    const saved = await storage.saveFile({
      buffer,
      mimeType,
      originalName: file.name,
    });

    // Run transcription provider
    const provider = getTranscriptionProvider();
    const result = await provider.transcribe(buffer, mimeType, {
      language,
      prompt,
    });

    // If projectId provided, save or update DB transcript
    if (projectId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (project) {
        await db.transcript.create({
          data: {
            projectId: project.id,
            originalText: result.text,
            detectedLanguage: result.detectedLanguage,
            confidence: result.confidence,
          },
        });

        await db.audioAsset.create({
          data: {
            projectId: project.id,
            type: mimeType.startsWith("video") ? "EXTRACTED_AUDIO" : "INPUT_VOICE",
            fileUrl: saved.fileUrl,
            duration: result.duration || 0,
            mimeType: saved.mimeType,
            fileSize: saved.fileSize,
          },
        });

        await db.project.update({
          where: { id: project.id },
          data: {
            sourceLanguage: result.detectedLanguage,
            status: "COMPLETED",
          },
        });
      }
    }

    logger.info({
      requestId,
      userId: user.id,
      operation: "transcribe",
      processingTimeMs: Date.now() - startTime,
      provider: provider.name,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      detectedLanguage: result.detectedLanguage,
      languageName: result.languageName,
      confidence: result.confidence,
      duration: result.duration,
      audioUrl: saved.fileUrl,
      provider: provider.name,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Transcription failed";
    logger.error({
      requestId,
      operation: "transcribe",
      processingTimeMs: Date.now() - startTime,
      status: "FAILED",
      error,
    });

    return NextResponse.json(
      { error: "The AI transcription service encountered an issue. " + message },
      { status: 500 }
    );
  }
}
