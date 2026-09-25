import { NextRequest, NextResponse } from "next/server";
import { getTranslationProvider } from "@/lib/ai/translation";
import { getRequiredUser } from "@/lib/server-auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const user = await getRequiredUser();
    const rateLimit = checkRateLimit(`translate:${user.id}`, 60, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many translation requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { text, sourceLanguage = "auto", targetLanguage = "en", projectId } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Text is required for translation." },
        { status: 400 }
      );
    }

    const provider = getTranslationProvider();
    const result = await provider.translate(
      text.trim(),
      sourceLanguage,
      targetLanguage
    );

    if (projectId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (project) {
        await db.translation.create({
          data: {
            projectId: project.id,
            sourceText: text.trim(),
            translatedText: result.translatedText,
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage,
          },
        });

        await db.project.update({
          where: { id: project.id },
          data: {
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage,
            status: "COMPLETED",
          },
        });
      }
    }

    logger.info({
      requestId,
      userId: user.id,
      operation: "translate",
      processingTimeMs: Date.now() - startTime,
      provider: provider.name,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      sourceText: result.sourceText,
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
      detectedSourceLanguage: result.detectedSourceLanguage,
      confidence: result.confidence,
      provider: provider.name,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Translation error";
    logger.error({
      requestId,
      operation: "translate",
      processingTimeMs: Date.now() - startTime,
      status: "FAILED",
      error,
    });

    return NextResponse.json(
      { error: "We couldn't translate this content. " + message },
      { status: 500 }
    );
  }
}
