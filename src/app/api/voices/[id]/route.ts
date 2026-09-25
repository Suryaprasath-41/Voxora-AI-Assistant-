import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";
import { storage } from "@/lib/storage";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const profile = await db.voiceProfile.findFirst({
      where: { id, userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Voice profile not found or unauthorized." },
        { status: 404 }
      );
    }

    // Remove sample file if present
    if (profile.sampleAudioUrl) {
      const filename = profile.sampleAudioUrl.replace("/uploads/", "");
      await storage.deleteFile(filename);
    }

    await db.voiceProfile.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Voice profile deleted." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete voice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
