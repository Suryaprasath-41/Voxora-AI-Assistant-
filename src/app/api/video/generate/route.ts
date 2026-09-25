import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/server-auth";
import { createAndStartVideoJob } from "@/lib/video-jobs";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const user = await getRequiredUser();
    const rateLimit = checkRateLimit(`video:${user.id}`, 20, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many video processing requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const mode = (formData.get("mode") as "video" | "image_voice" | "image_text") || "video";
    const sourceLanguage = (formData.get("sourceLanguage") as string) || "auto";
    const targetLanguage = (formData.get("targetLanguage") as string) || "en";
    const voiceProfileId = (formData.get("voiceProfileId") as string) || null;
    const voiceId = (formData.get("voiceId") as string) || "natural-female";
    const text = (formData.get("text") as string) || "";
    const consentConfirmed = formData.get("consentConfirmed") === "true";
    const title = (formData.get("title") as string) || "AI Video Translation";

    let videoBuffer: Buffer | undefined = undefined;
    let videoMimeType: string | undefined = undefined;
    let imageBuffer: Buffer | undefined = undefined;
    let imageMimeType: string | undefined = undefined;
    let voiceBuffer: Buffer | undefined = undefined;
    let voiceMimeType: string | undefined = undefined;

    // Read video file if video mode
    const videoFile = formData.get("videoFile") as File | null;
    if (videoFile) {
      const ab = await videoFile.arrayBuffer();
      videoBuffer = Buffer.from(ab);
      videoMimeType = videoFile.type || "video/mp4";
    }

    // Read image file if image mode
    const imageFile = formData.get("imageFile") as File | null;
    if (imageFile) {
      const ab = await imageFile.arrayBuffer();
      imageBuffer = Buffer.from(ab);
      imageMimeType = imageFile.type || "image/png";
    }

    // Read voice file if voice mode
    const voiceFile = formData.get("voiceFile") as File | null;
    if (voiceFile) {
      const ab = await voiceFile.arrayBuffer();
      voiceBuffer = Buffer.from(ab);
      voiceMimeType = voiceFile.type || "audio/wav";
    }

    // Validation
    if (mode === "video" && !videoBuffer) {
      return NextResponse.json(
        { error: "A video file is required for Video Translation." },
        { status: 400 }
      );
    }

    if ((mode === "image_voice" || mode === "image_text") && !imageBuffer) {
      return NextResponse.json(
        { error: "A person image is required." },
        { status: 400 }
      );
    }

    if (mode === "image_voice" && !voiceBuffer) {
      return NextResponse.json(
        { error: "A voice recording or audio file is required." },
        { status: 400 }
      );
    }

    if (mode === "image_text" && !text.trim()) {
      return NextResponse.json(
        { error: "Please enter text for the person to speak." },
        { status: 400 }
      );
    }

    // If a cloned voice profile is used, ensure consent
    if (voiceProfileId && !consentConfirmed) {
      return NextResponse.json(
        {
          error:
            "Voice cloning requires permission from the speaker. You must explicitly confirm authorization.",
        },
        { status: 403 }
      );
    }

    // Start background video job
    const jobId = await createAndStartVideoJob({
      userId: user.id,
      sourceType: mode,
      sourceLanguage,
      targetLanguage,
      voiceProfileId,
      voiceId,
      inputText: text,
      videoBuffer,
      videoMimeType,
      imageBuffer,
      imageMimeType,
      voiceBuffer,
      voiceMimeType,
      title,
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Video translation job initiated.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Video initiation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
