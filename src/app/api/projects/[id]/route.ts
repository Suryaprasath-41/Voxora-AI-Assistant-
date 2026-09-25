import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";
import { storage } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const project = await db.project.findFirst({
      where: { id, userId: user.id },
      include: {
        transcripts: { orderBy: { createdAt: "desc" } },
        translations: { orderBy: { createdAt: "desc" } },
        generations: {
          orderBy: { createdAt: "desc" },
          include: { voiceProfile: true },
        },
        audioAssets: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;
    const body = await req.json();

    const existing = await db.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access." },
        { status: 404 }
      );
    }

    const updated = await db.project.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : existing.title,
        sourceLanguage: body.sourceLanguage || existing.sourceLanguage,
        targetLanguage: body.targetLanguage || existing.targetLanguage,
        status: body.status || existing.status,
      },
      include: {
        transcripts: true,
        translations: true,
        generations: true,
        audioAssets: true,
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const existing = await db.project.findFirst({
      where: { id, userId: user.id },
      include: { audioAssets: true, generations: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access." },
        { status: 404 }
      );
    }

    // Clean up audio files from disk/storage
    for (const asset of existing.audioAssets) {
      if (asset.fileUrl && asset.fileUrl.startsWith("/uploads/")) {
        const fileKey = asset.fileUrl.replace("/uploads/", "");
        await storage.deleteFile(fileKey);
      }
    }

    for (const gen of existing.generations) {
      if (gen.audioUrl && gen.audioUrl.startsWith("/uploads/")) {
        const fileKey = gen.audioUrl.replace("/uploads/", "");
        await storage.deleteFile(fileKey);
      }
    }

    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
