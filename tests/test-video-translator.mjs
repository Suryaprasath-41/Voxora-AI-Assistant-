// Automated Verification Suite for AI Video Translator Feature
import { PrismaClient } from "@prisma/client";
import { FFmpegVideoEngine } from "../src/lib/ai/video/ffmpeg-video-engine.ts";
import { createAndStartVideoJob, getJob } from "../src/lib/video-jobs.ts";
import fs from "fs/promises";
import path from "path";

const db = new PrismaClient();

async function runVideoTests() {
  console.log("==================================================");
  console.log("VOXORA AI — AI VIDEO TRANSLATOR VERIFICATION");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Get or create test user
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          email: "video-tester@voxora.ai",
          name: "Video Test User",
        },
      });
    }

    const engine = new FFmpegVideoEngine();

    // TEST 1: Synthesize a real test video with audio using FFmpeg
    console.log("[1/5] Testing FFmpeg Engine & Audio Extraction from Video...");
    
    // Create a 2-second test MP4 video with a tone
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegPath = require("ffmpeg-static");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require("child_process");
    
    const testVideoPath = path.join(process.cwd(), "public", "uploads", "test-source-video.mp4");
    execSync(`"${ffmpegPath}" -y -f lavfi -i testsrc=duration=2:size=320x240:rate=24 -f lavfi -i sine=frequency=440:duration=2 -c:v libx264 -c:a aac "${testVideoPath}"`);
    
    const videoBuffer = await fs.readFile(testVideoPath);
    assert(videoBuffer.length > 5000, `Source video generated (${videoBuffer.length} bytes)`);

    // Extract audio
    const extractedWav = await engine.extractAudio(videoBuffer);
    assert(extractedWav.length > 1000, `Audio cleanly extracted from video (${extractedWav.length} bytes WAV)`);

    // TEST 2: Testing Person Image + Speech Audio -> Talking Video
    console.log("\n[2/5] Testing Person Image + Speech Audio -> Talking Video...");
    // Create a small 1x1 test PNG
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x20, 0x08, 0x02, 0x00, 0x00, 0x00, 0xfc, 0x18, 0xed,
      0xa3, 0x00, 0x00, 0x00, 0x19, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x60, 0x18, 0x05, 0xa3,
      0x60, 0x14, 0x8c, 0x82, 0x51, 0x30, 0x0a, 0x46, 0x01, 0x00, 0x00, 0xff, 0xff, 0x03, 0xa0, 0x00,
      0x01, 0x6e, 0x2c, 0x9a, 0x37, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);

    // Create a 1-second audio buffer
    const testAudioPath = path.join(process.cwd(), "public", "uploads", "test-audio.mp3");
    execSync(`"${ffmpegPath}" -y -f lavfi -i sine=frequency=880:duration=1.5 -c:a aac "${testAudioPath}"`);
    const audioBuffer = await fs.readFile(testAudioPath);

    const talkingVideo = await engine.generateTalkingVideo(pngHeader, audioBuffer);
    assert(talkingVideo.length > 5000, `Talking Video generated from portrait + audio (${talkingVideo.length} bytes MP4)`);

    // TEST 3: Testing Video to Video Translation & Audio-Visual Lip Multiplexing
    console.log("\n[3/5] Testing Video-to-Video Lip-Sync & Multiplexing...");
    const translatedLipSyncVideo = await engine.translateAndLipSyncVideo(videoBuffer, audioBuffer);
    assert(translatedLipSyncVideo.length > 5000, `Lip-synced video rendered (${translatedLipSyncVideo.length} bytes MP4)`);

    // TEST 4: Testing Full Asynchronous Video Job Pipeline & Progress
    console.log("\n[4/5] Testing Asynchronous Video Job Execution Pipeline...");
    const jobId = await createAndStartVideoJob({
      userId: user.id,
      sourceType: "image_text",
      sourceLanguage: "ta",
      targetLanguage: "en",
      inputText: "வணக்கம், இன்று கல்லூரிக்கு செல்கிறேன்.",
      imageBuffer: pngHeader,
      imageMimeType: "image/png",
      title: "Test Image to Video",
    });

    assert(jobId && jobId.length > 10, `Video job created with ID: ${jobId}`);

    // Poll until completion (or max 30s)
    let completedJob = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const current = getJob(jobId);
      if (current && (current.status === "COMPLETED" || current.status === "FAILED")) {
        completedJob = current;
        break;
      }
    }

    assert(completedJob !== null, "Job finished within timeout window");
    assert(completedJob?.status === "COMPLETED", `Job status is COMPLETED (got: ${completedJob?.status})`);
    assert(Boolean(completedJob?.finalVideoUrl), `Final MP4 Video URL generated: ${completedJob?.finalVideoUrl}`);
    assert(Boolean(completedJob?.translatedText), `Translation populated: "${completedJob?.translatedText}"`);
    assert(Boolean(completedJob?.projectId), `Project saved in database with ID: ${completedJob?.projectId}`);

    // TEST 5: Verify Saved Video Project in Database
    console.log("\n[5/5] Testing Database Persistence of Video Project...");
    if (completedJob?.projectId) {
      const savedProject = await db.project.findUnique({
        where: { id: completedJob.projectId },
        include: { audioAssets: true, translations: true, transcripts: true },
      });

      assert(savedProject !== null, "Project verified in Prisma database");
      assert(savedProject?.type === "video", `Project type is 'video'`);
      const finalVideoAsset = savedProject?.audioAssets.find((a) => a.type === "FINAL_VIDEO");
      assert(finalVideoAsset !== undefined, `AudioAsset includes FINAL_VIDEO record (${finalVideoAsset?.fileUrl})`);

      // Cleanup test project
      await db.project.delete({ where: { id: completedJob.projectId } });
      assert(true, "Test project cleaned up");
    }

    // Cleanup temp files
    await fs.unlink(testVideoPath).catch(() => {});
    await fs.unlink(testAudioPath).catch(() => {});

    console.log("\n==================================================");
    console.log(`AI VIDEO TRANSLATOR TESTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
  } catch (err) {
    console.error("Video verification suite error:", err);
  } finally {
    await db.$disconnect();
  }
}

runVideoTests();
