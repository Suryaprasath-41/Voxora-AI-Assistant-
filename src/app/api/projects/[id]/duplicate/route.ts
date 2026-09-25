import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const original = await db.project.findFirst({
      where: { id, userId: user.id },
      include: {
        transcripts: true,
        translations: true,
        generations: true,
        audioAssets: true,
      },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access." },
        { status: 404 }
      );
    }

    const duplicated = await db.project.create({
      data: {
        userId: user.id,
        title: `${original.title} (Copy)`,
        sourceLanguage: original.sourceLanguage,
        targetLanguage: original.targetLanguage,
        status: original.status,
        type: original.type,
        transcripts: {
          create: original.transcripts.map((t) => ({
            originalText: t.originalText,
            detectedLanguage: t.detectedLanguage,
            confidence: t.confidence,
          })),
        },
        translations: {
          create: original.translations.map((tr) => ({
            sourceText: tr.sourceText,
            translatedText: tr.translatedText,
            sourceLanguage: tr.sourceLanguage,
            targetLanguage: tr.targetLanguage,
          })),
        },
        audioAssets: {
          create: original.audioAssets.map((a) => ({
            type: a.type,
            fileUrl: a.fileUrl,
            duration: a.duration,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
          })),
        },
        generations: {
          create: original.generations.map((g) => ({
            voiceProfileId: g.voiceProfileId,
            text: g.text,
            language: g.language,
            audioUrl: g.audioUrl,
            status: g.status,
            isClonedVoice: g.isClonedVoice,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, project: duplicated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to duplicate project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
