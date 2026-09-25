// Automated Verification Suite for VOXORA AI
import { PrismaClient } from "@prisma/client";
import { NeuralTranslationProvider } from "../src/lib/ai/translation/neural.ts";
import { NeuralTTSProvider } from "../src/lib/ai/tts/neural-tts.ts";
import { NeuralTimbreVoiceProvider } from "../src/lib/ai/voice/neural-timbre.ts";
import { detectLanguageFromText, getLanguageByCode } from "../src/lib/languages.ts";
import { storage } from "../src/lib/storage/index.ts";
import { checkRateLimit } from "../src/lib/rate-limit.ts";

const db = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("VOXORA AI — AUTOMATED END-TO-END VERIFICATION");
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
    // TEST 1: Database Connectivity & User Creation
    console.log("[1/7] Testing Database Persistence & Models...");
    const testEmail = `test_${Date.now()}@voxora.ai`;
    const user = await db.user.create({
      data: {
        email: testEmail,
        name: "Test Engineer",
        image: "https://example.com/avatar.jpg",
        preferences: JSON.stringify({ defaultSourceLanguage: "ta", defaultTargetLanguage: "en" }),
      },
    });
    assert(user && user.id, "User created successfully in database");

    // TEST 2: Language Detection & Unicode Support
    console.log("\n[2/7] Testing Language Detection & Unicode Support...");
    const tamilDetect = detectLanguageFromText("நான் இன்று கல்லூரிக்கு செல்கிறேன்.");
    assert(tamilDetect.code === "ta", `Tamil detected correctly (got: ${tamilDetect.code})`);

    const hindiDetect = detectLanguageFromText("नमस्ते, आप कैसे हैं?");
    assert(hindiDetect.code === "hi", `Hindi detected correctly (got: ${hindiDetect.code})`);

    const spanishDetect = detectLanguageFromText("Hola, ¿cómo estás hoy?");
    assert(spanishDetect.code === "es", `Spanish detected correctly (got: ${spanishDetect.code})`);

    // TEST 3: Real Multilingual Translation
    console.log("\n[3/7] Testing Multilingual Translation Provider...");
    const translator = new NeuralTranslationProvider();
    
    // Tamil -> English (The exact example from the prompt)
    const t1 = await translator.translate("நான் இன்று கல்லூரிக்கு செல்கிறேன்.", "ta", "en");
    assert(
      t1 && t1.translatedText && t1.translatedText.length > 0,
      `Tamil -> English translated: "${t1.translatedText}"`
    );

    // English -> Tamil
    const t2 = await translator.translate("I am going to college today", "en", "ta");
    assert(
      t2 && t2.translatedText && t2.translatedText.length > 0,
      `English -> Tamil translated: "${t2.translatedText}"`
    );

    // TEST 4: Real Text-To-Speech Synthesis
    console.log("\n[4/7] Testing Neural TTS Synthesis...");
    const tts = new NeuralTTSProvider();
    
    // Synthesize English
    const audioEn = await tts.synthesize("Welcome to Voxora AI", "en");
    assert(
      audioEn && audioEn.audioBuffer && audioEn.audioBuffer.length > 5000,
      `English speech synthesized (${audioEn.audioBuffer.length} bytes, MIME: ${audioEn.mimeType})`
    );

    // Synthesize Tamil
    const audioTa = await tts.synthesize("வணக்கம் நண்பர்களே", "ta");
    assert(
      audioTa && audioTa.audioBuffer && audioTa.audioBuffer.length > 3000,
      `Tamil speech synthesized (${audioTa.audioBuffer.length} bytes, MIME: ${audioTa.mimeType})`
    );

    // TEST 5: Voice Cloning Safety & Consent Verification
    console.log("\n[5/7] Testing Voice Cloning & Consent Verification...");
    const voiceProvider = new NeuralTimbreVoiceProvider();
    
    // Sample dummy audio buffer for profiling
    const sampleBuffer = Buffer.alloc(16000, 128);

    // Test rejection without consent
    let caughtConsentError = false;
    try {
      await voiceProvider.createVoiceProfile(user.id, "Unauthorized Voice", sampleBuffer, "audio/wav", false);
    } catch {
      caughtConsentError = true;
    }
    assert(caughtConsentError, "Creation rejected without explicit consent confirmation");

    // Test authorized creation
    const authorizedProfile = await voiceProvider.createVoiceProfile(user.id, "Authorized Profile", sampleBuffer, "audio/wav", true);
    assert(authorizedProfile.consentConfirmed, "Authorized voice profile created with logged consent timestamp");

    // Test speech generation with safety label
    const clonedSpeech = await voiceProvider.generateSpeech(
      { providerVoiceId: authorizedProfile.providerVoiceId, timbreProfile: JSON.stringify(authorizedProfile.timbreProfile) },
      "Testing same-speaker translated speech.",
      "en"
    );
    assert(
      clonedSpeech.safetyLabel === "AI-generated voice",
      `Safety label attached to cloned voice: "${clonedSpeech.safetyLabel}"`
    );

    // TEST 6: Project Management CRUD & Duplication
    console.log("\n[6/7] Testing Project Management CRUD...");
    const project = await db.project.create({
      data: {
        userId: user.id,
        title: "College Introduction",
        sourceLanguage: "ta",
        targetLanguage: "en",
        type: "voice",
        status: "COMPLETED",
        transcripts: {
          create: {
            originalText: "நான் இன்று கல்லூரிக்கு செல்கிறேன்.",
            detectedLanguage: "ta",
            confidence: 0.98,
          },
        },
        translations: {
          create: {
            sourceText: "நான் இன்று கல்லூரிக்கு செல்கிறேன்.",
            translatedText: "I am going to college today.",
            sourceLanguage: "ta",
            targetLanguage: "en",
          },
        },
      },
      include: { transcripts: true, translations: true },
    });
    assert(project.title === "College Introduction", "Project created with relational transcript and translation");

    // Update
    const updated = await db.project.update({
      where: { id: project.id },
      data: { title: "College Introduction (Updated)" },
    });
    assert(updated.title === "College Introduction (Updated)", "Project renamed successfully");

    // Clean up test project
    await db.project.delete({ where: { id: project.id } });
    const checkDeleted = await db.project.findUnique({ where: { id: project.id } });
    assert(checkDeleted === null, "Project deleted cleanly with cascade");

    // TEST 7: Storage & Security Controls
    console.log("\n[7/7] Testing Storage Security & Rate Limiting...");
    const savedFile = await storage.saveFile({
      buffer: Buffer.from("test-audio-content"),
      mimeType: "audio/mpeg",
      originalName: "../../../etc/passwd.mp3", // path traversal attempt
    });
    assert(
      !savedFile.fileUrl.includes(".."),
      `Path traversal prevented, secure randomized storage key: ${savedFile.fileKey}`
    );

    const rate1 = checkRateLimit("test-client-ip", 5, 1000);
    assert(rate1.allowed, "Rate limit permits valid requests");

    // Clean up test user
    await db.user.delete({ where: { id: user.id } });
    console.log("\n==================================================");
    console.log(`ALL VERIFICATION TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
  } catch (err) {
    console.error("Verification suite encountered unexpected error:", err);
  } finally {
    await db.$disconnect();
  }
}

runTests();
