import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getRequiredUser();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const whereClause: Record<string, unknown> = {
      userId: user.id,
    };

    if (search.trim()) {
      whereClause.title = {
        contains: search.trim(),
      };
    }

    if (type !== "all") {
      whereClause.type = type;
    }

    const [total, projects] = await Promise.all([
      db.project.count({ where: whereClause }),
      db.project.findMany({
        where: whereClause,
        include: {
          transcripts: { take: 1, orderBy: { createdAt: "desc" } },
          translations: { take: 1, orderBy: { createdAt: "desc" } },
          generations: { take: 1, orderBy: { createdAt: "desc" } },
          audioAssets: { take: 2, orderBy: { createdAt: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequiredUser();
    const body = await req.json();

    const {
      title = "Untitled Project",
      sourceLanguage = "auto",
      targetLanguage = "en",
      type = "voice",
      transcriptText,
      translatedText,
      audioUrl,
      duration,
    } = body;

    const project = await db.project.create({
      data: {
        userId: user.id,
        title: title.trim(),
        sourceLanguage,
        targetLanguage,
        type,
        status: "COMPLETED",
        ...(transcriptText
          ? {
              transcripts: {
                create: {
                  originalText: transcriptText,
                  detectedLanguage: sourceLanguage,
                  confidence: 0.98,
                },
              },
            }
          : {}),
        ...(translatedText
          ? {
              translations: {
                create: {
                  sourceText: transcriptText || "",
                  translatedText,
                  sourceLanguage,
                  targetLanguage,
                },
              },
            }
          : {}),
        ...(audioUrl
          ? {
              audioAssets: {
                create: {
                  type: "SYNTHESIZED_SPEECH",
                  fileUrl: audioUrl,
                  duration: duration || 0,
                  mimeType: "audio/mpeg",
                  fileSize: 1024,
                },
              },
            }
          : {}),
      },
      include: {
        transcripts: true,
        translations: true,
        generations: true,
        audioAssets: true,
      },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
