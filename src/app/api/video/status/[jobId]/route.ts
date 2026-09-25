import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/server-auth";
import { getJob } from "@/lib/video-jobs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { jobId } = await params;

    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Video job not found or expired." },
        { status: 404 }
      );
    }

    if (job.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to video job." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
