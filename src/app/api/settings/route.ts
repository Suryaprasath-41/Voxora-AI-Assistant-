import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const user = await getRequiredUser();

    // Calculate storage usage
    const audioAssets = await db.audioAsset.findMany({
      where: { project: { userId: user.id } },
    });

    const totalBytes = audioAssets.reduce((sum, a) => sum + (a.fileSize || 0), 0);
    const projectsCount = await db.project.count({ where: { userId: user.id } });
    const voiceProfilesCount = await db.voiceProfile.count({ where: { userId: user.id } });

    let preferences = {
      defaultSourceLanguage: "auto",
      defaultTargetLanguage: "en",
      defaultVoice: "natural-female",
      playbackSpeed: 1.0,
    };

    if (user.preferences) {
      try {
        preferences = { ...preferences, ...JSON.parse(user.preferences) };
      } catch {
        // use default
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      preferences,
      storage: {
        totalBytes,
        totalMb: (totalBytes / (1024 * 1024)).toFixed(2),
        fileCount: audioAssets.length,
        projectsCount,
        voiceProfilesCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getRequiredUser();
    const body = await req.json();

    const { name, preferences } = body;

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(preferences ? { preferences: JSON.stringify(preferences) } : {}),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getRequiredUser();

    // 1. Delete all audio assets on disk
    const audioAssets = await db.audioAsset.findMany({
      where: { project: { userId: user.id } },
    });
    for (const a of audioAssets) {
      if (a.fileUrl?.startsWith("/uploads/")) {
        await storage.deleteFile(a.fileUrl.replace("/uploads/", ""));
      }
    }

    const voiceProfiles = await db.voiceProfile.findMany({
      where: { userId: user.id },
    });
    for (const vp of voiceProfiles) {
      if (vp.sampleAudioUrl?.startsWith("/uploads/")) {
        await storage.deleteFile(vp.sampleAudioUrl.replace("/uploads/", ""));
      }
    }

    // 2. Cascade delete in database
    await db.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({ success: true, message: "Account and all associated data permanently deleted." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
