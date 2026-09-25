import { NextRequest, NextResponse } from "next/server";
import { getVoiceCloningProvider } from "@/lib/ai/voice";
import { storage } from "@/lib/storage";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getRequiredUser();
    const profiles = await db.voiceProfile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      voices: profiles.map((vp) => ({
        id: vp.id,
        name: vp.name,
        providerVoiceId: vp.providerVoiceId,
        sampleAudioUrl: vp.sampleAudioUrl,
        consentConfirmed: vp.consentConfirmed,
        consentTimestamp: vp.consentTimestamp,
        createdAt: vp.createdAt,
        updatedAt: vp.updatedAt,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch voices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const user = await getRequiredUser();
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const consent = formData.get("consentConfirmed") === "true";
    const sampleFile = formData.get("sampleFile") as File | null;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "A descriptive voice profile name is required." },
        { status: 400 }
      );
    }

    // Safety constraint: explicit consent must be confirmed
    if (!consent) {
      return NextResponse.json(
        {
          error:
            "Voice cloning requires permission from the speaker. You must explicitly confirm that you own this voice or have authorization to use it.",
        },
        { status: 403 }
      );
    }

    if (!sampleFile) {
      return NextResponse.json(
        { error: "A voice sample audio recording or file is required." },
        { status: 400 }
      );
    }

    const arrayBuffer = await sampleFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = sampleFile.type || "audio/wav";

    // Save sample file securely
    const saved = await storage.saveFile({
      buffer,
      mimeType,
      originalName: sampleFile.name || "voice_sample.wav",
    });

    // Process with voice cloning provider
    const provider = getVoiceCloningProvider();
    const result = await provider.createVoiceProfile(
      user.id,
      name.trim(),
      buffer,
      mimeType,
      true
    );

    // Save VoiceProfile to database with consent record
    const voiceProfile = await db.voiceProfile.create({
      data: {
        userId: user.id,
        name: name.trim(),
        providerVoiceId: result.providerVoiceId,
        sampleAudioUrl: saved.fileUrl,
        timbreProfile: JSON.stringify(result.timbreProfile),
        consentConfirmed: true,
        consentTimestamp: result.consentTimestamp,
      },
    });

    logger.info({
      requestId,
      userId: user.id,
      operation: "create_voice_profile",
      processingTimeMs: Date.now() - startTime,
      provider: provider.name,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      voice: {
        id: voiceProfile.id,
        name: voiceProfile.name,
        providerVoiceId: voiceProfile.providerVoiceId,
        sampleAudioUrl: voiceProfile.sampleAudioUrl,
        consentConfirmed: voiceProfile.consentConfirmed,
        consentTimestamp: voiceProfile.consentTimestamp,
        createdAt: voiceProfile.createdAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create voice profile";
    logger.error({
      requestId,
      operation: "create_voice_profile",
      processingTimeMs: Date.now() - startTime,
      status: "FAILED",
      error,
    });

    return NextResponse.json(
      { error: "Could not create voice profile: " + message },
      { status: 500 }
    );
  }
}
