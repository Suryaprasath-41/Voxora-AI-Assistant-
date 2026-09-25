"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { FileUploader } from "@/components/upload/FileUploader";
import { TextEditor } from "@/components/text/TextEditor";
import { StudioAudioPlayer } from "@/components/audio/StudioAudioPlayer";
import {
  SUPPORTED_LANGUAGES,
  getLanguageByCode,
  detectLanguageFromText,
} from "@/lib/languages";
import {
  Mic,
  Upload,
  Keyboard,
  Globe2,
  Volume2,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FastForward,
} from "lucide-react";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "voice" | "text" | "upload") || "voice";
  const projectIdParam = searchParams.get("projectId");
  const voiceProfileIdParam = searchParams.get("voiceProfileId");

  // Tab & Mode
  const [activeTab, setActiveTab] = useState<"voice" | "text" | "upload">(initialTab);

  // Language selectors
  const [sourceLanguage, setSourceLanguage] = useState<string>("auto");
  const [targetLanguage, setTargetLanguage] = useState<string>("en");

  // Input states
  const [inputText, setInputText] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Transcription & Detection states
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0.98);

  // Translation states
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Speech & Voice options
  const [voiceCategory, setVoiceCategory] = useState<string>("natural-female");
  const [voiceSpeed, setVoiceSpeed] = useState<string>("1.0");
  const [availableVoices, setAvailableVoices] = useState<
    { id: string; name: string; consentConfirmed?: boolean }[]
  >([]);
  const [selectedVoiceProfileId, setSelectedVoiceProfileId] = useState<string | null>(
    voiceProfileIdParam || null
  );

  // Generated Audio state
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isClonedVoice, setIsClonedVoice] = useState<boolean>(false);

  // Multi-step processing status
  const [processingStep, setProcessingStep] = useState<
    "idle" | "uploading" | "transcribing" | "translating" | "synthesizing" | "completed"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  // Load existing project if requested
  useEffect(() => {
    if (projectIdParam) {
      fetch(`/api/projects/${projectIdParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.project) {
            const p = data.project;
            setSourceLanguage(p.sourceLanguage || "auto");
            setTargetLanguage(p.targetLanguage || "en");
            if (p.transcripts?.[0]) {
              setTranscriptText(p.transcripts[0].originalText);
              setDetectedLanguage(p.transcripts[0].detectedLanguage);
            }
            if (p.translations?.[0]) {
              setTranslatedText(p.translations[0].translatedText);
            }
            if (p.audioAssets?.[0]?.fileUrl) {
              setGeneratedAudioUrl(p.audioAssets[0].fileUrl);
            }
          }
        })
        .catch(console.error);
    }
  }, [projectIdParam]);

  // Load authorized voice profiles
  useEffect(() => {
    fetch("/api/voices")
      .then((res) => res.json())
      .then((data) => {
        if (data.voices) {
          setAvailableVoices(data.voices);
          if (voiceProfileIdParam) {
            setSelectedVoiceProfileId(voiceProfileIdParam);
          }
        }
      })
      .catch(console.error);
  }, [voiceProfileIdParam]);

  // Audio recording completion handler
  const handleRecordingComplete = async (audioBlob: Blob) => {
    setProcessingStep("transcribing");
    setErrorMessage(null);
    setTranscriptText("");
    setTranslatedText("");
    setGeneratedAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", sourceLanguage);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed");

      setTranscriptText(data.text);
      setDetectedLanguage(data.language);
      setDetectionConfidence(data.confidence || 0.98);
      setProcessingStep("idle");

      // Auto-translate to target language
      await performTranslation(data.text, data.language || sourceLanguage, targetLanguage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transcription failed";
      setErrorMessage(msg);
      setProcessingStep("idle");
    }
  };

  // Upload completion handler
  const handleFileSelected = async (file: File) => {
    setUploadedFile(file);
    setProcessingStep("uploading");
    setErrorMessage(null);
    setTranscriptText("");
    setTranslatedText("");
    setGeneratedAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("language", sourceLanguage);

      setProcessingStep("transcribing");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed");

      setTranscriptText(data.text);
      setDetectedLanguage(data.language);
      setDetectionConfidence(data.confidence || 0.97);
      setProcessingStep("idle");

      // Auto-translate to target language
      await performTranslation(data.text, data.language || sourceLanguage, targetLanguage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "File transcription failed";
      setErrorMessage(msg);
      setProcessingStep("idle");
    }
  };

  // Direct text typing handler
  const handleTextChange = (text: string) => {
    setInputText(text);
    setTranscriptText(text);

    // Dynamic lightweight language identification
    const detected = detectLanguageFromText(text);
    if (detected && detected.code !== "auto") {
      setDetectedLanguage(detected.code);
      setDetectionConfidence(detected.confidence);
    }
  };

  // Translation executor
  const performTranslation = async (text: string, srcLang: string, tgtLang: string) => {
    if (!text || !text.trim()) return;
    setIsTranslating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceLanguage: srcLang,
          targetLanguage: tgtLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");

      setTranslatedText(data.translatedText);
      if (data.detectedSourceLanguage) {
        setDetectedLanguage(data.detectedSourceLanguage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      setErrorMessage(msg);
    } finally {
      setIsTranslating(false);
    }
  };

  // Text-To-Speech Synthesis
  const handleGenerateSpeech = async () => {
    const textToSpeak = translatedText || transcriptText;
    if (!textToSpeak) return;

    setProcessingStep("synthesizing");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          language: targetLanguage,
          voiceId: voiceCategory,
          speed: parseFloat(voiceSpeed) || 1.0,
          voiceProfileId: selectedVoiceProfileId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speech synthesis failed");

      setGeneratedAudioUrl(data.audioUrl);
      setIsClonedVoice(Boolean(data.isClonedVoice));
      setProcessingStep("completed");

      // Automatically persist to project history
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${getLanguageByCode(detectedLanguage || sourceLanguage).name} → ${getLanguageByCode(targetLanguage).name} Studio Session`,
          sourceLanguage: detectedLanguage || sourceLanguage,
          targetLanguage,
          type: activeTab,
          transcriptText,
          translatedText: textToSpeak,
          audioUrl: data.audioUrl,
          duration: data.duration,
        }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setErrorMessage(msg);
      setProcessingStep("idle");
    }
  };

  const handleCopyTranscript = async () => {
    if (!transcriptText) return;
    await navigator.clipboard.writeText(transcriptText);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleCopyTranslation = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopiedTranslation(true);
    setTimeout(() => setCopiedTranslation(false), 2000);
  };

  const detectedLangInfo = detectedLanguage ? getLanguageByCode(detectedLanguage) : null;

  return (
    <AppLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#F4F7FC] min-h-screen text-[#17233C] flex flex-col gap-6">
        {/* Workspace Subheader / Language Selector Bar */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 border border-[#D9E2F0] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-[#17233C] uppercase tracking-wider">
              Translation Pair:
            </span>

            {/* Source Language Selector */}
            <div className="relative">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="bg-[#F8FAFC] text-[#17233C] text-xs font-bold rounded-xl px-3.5 py-2 border border-[#D9E2F0] focus:outline-none focus:border-[#5B35F5] cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[#5B35F5] font-extrabold text-sm">→</span>

            {/* Target Language Selector */}
            <div className="relative">
              <select
                value={targetLanguage}
                onChange={(e) => {
                  setTargetLanguage(e.target.value);
                  if (transcriptText) {
                    performTranslation(transcriptText, detectedLanguage || sourceLanguage, e.target.value);
                  }
                }}
                className="bg-[#F8FAFC] text-[#5B35F5] text-xs font-bold rounded-xl px-3.5 py-2 border border-[#D9E2F0] focus:outline-none focus:border-[#5B35F5] cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.filter((l) => l.code !== "auto").map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Mode Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (transcriptText) {
                  performTranslation(transcriptText, detectedLanguage || sourceLanguage, targetLanguage).then(() => {
                    handleGenerateSpeech();
                  });
                }
              }}
              disabled={!transcriptText || processingStep !== "idle"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white text-xs font-bold shadow-md shadow-[#5B35F5]/25 transition-all disabled:opacity-40 cursor-pointer"
              title="Quick Mode: Translate and synthesize in one click"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span>Quick Mode</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-600 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MAIN WORKSPACE GRID: LEFT SIDE (INPUT) & RIGHT SIDE (OUTPUT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ================= LEFT SIDE: INPUT PANEL ================= */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-[#D9E2F0] shadow-sm flex-1 flex flex-col">
              {/* Input Mode Tabs: [Voice] [Text] [Upload] */}
              <div className="flex items-center justify-between border-b border-[#D9E2F0] pb-3 mb-4">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F4F7FC] border border-[#D9E2F0]">
                  <button
                    onClick={() => setActiveTab("voice")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "voice"
                        ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm"
                        : "text-[#61708A] hover:text-[#17233C]"
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Voice</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("text")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "text"
                        ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm"
                        : "text-[#61708A] hover:text-[#17233C]"
                    }`}
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    <span>Text</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("upload")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "upload"
                        ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm"
                        : "text-[#61708A] hover:text-[#17233C]"
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                </div>

                <span className="text-[11px] text-[#61708A] font-semibold">
                  {activeTab === "voice" && "Microphone Stream"}
                  {activeTab === "text" && "Multilingual Typing"}
                  {activeTab === "upload" && "Audio/Video Dropzone"}
                </span>
              </div>

              {/* Mode 1: Voice Recording */}
              {activeTab === "voice" && (
                <div className="flex-1 flex flex-col justify-center">
                  <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    sourceLanguage={sourceLanguage}
                  />
                </div>
              )}

              {/* Mode 2: Direct Text Input */}
              {activeTab === "text" && (
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <TextEditor
                    value={inputText}
                    onChange={handleTextChange}
                    sourceLanguageName={getLanguageByCode(sourceLanguage).name}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        performTranslation(
                          inputText,
                          detectedLanguage || sourceLanguage,
                          targetLanguage
                        )
                      }
                      disabled={!inputText.trim() || isTranslating}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white text-xs font-bold shadow-md shadow-[#5B35F5]/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span>Translate</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 3: Upload Audio / Video */}
              {activeTab === "upload" && (
                <div className="flex-1 flex flex-col justify-center">
                  <FileUploader
                    onFileSelected={handleFileSelected}
                    selectedFile={uploadedFile}
                    onClear={() => {
                      setUploadedFile(null);
                      setTranscriptText("");
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT SIDE: OUTPUT PANEL ================= */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-[#D9E2F0] shadow-sm flex-1 flex flex-col space-y-5">
              {/* SECTION A: SOURCE TRANSCRIPTION */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#17233C]">
                      Original Transcript
                    </span>
                    {detectedLangInfo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B35F5]/10 text-[#5B35F5] border border-[#5B35F5]/20 font-bold">
                        <span>{detectedLangInfo.name}</span>
                        <span className="text-[#61708A] ml-1">({Math.round(detectionConfidence * 100)}% match)</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleCopyTranscript}
                    disabled={!transcriptText}
                    className="p-1.5 rounded-lg text-[#61708A] hover:text-[#17233C] hover:bg-[#F4F7FC] transition-colors disabled:opacity-40"
                    title="Copy transcript"
                  >
                    {copiedTranscript ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="min-h-[90px] p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-xs sm:text-sm text-[#17233C] leading-relaxed overflow-y-auto max-h-40 font-sans">
                  {transcriptText || (
                    <span className="text-[#61708A] italic">
                      Spoken or typed transcript will appear here with automatic language detection...
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION B: TRANSLATION DISPLAY */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-3.5 w-3.5 text-[#5B35F5]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#17233C]">
                      Translation ({getLanguageByCode(targetLanguage).name})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        performTranslation(
                          transcriptText,
                          detectedLanguage || sourceLanguage,
                          targetLanguage
                        )
                      }
                      disabled={!transcriptText || isTranslating}
                      className="p-1.5 rounded-lg text-[#61708A] hover:text-[#17233C] hover:bg-[#F4F7FC] transition-colors disabled:opacity-40"
                      title="Regenerate translation"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleCopyTranslation}
                      disabled={!translatedText}
                      className="p-1.5 rounded-lg text-[#61708A] hover:text-[#17233C] hover:bg-[#F4F7FC] transition-colors disabled:opacity-40"
                      title="Copy translation"
                    >
                      {copiedTranslation ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <textarea
                  value={translatedText}
                  onChange={(e) => setTranslatedText(e.target.value)}
                  placeholder="Context-aware translation output..."
                  rows={4}
                  className="w-full p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-xs sm:text-sm text-[#17233C] placeholder:text-[#61708A] focus:outline-none focus:border-[#5B35F5] leading-relaxed resize-none font-sans"
                />
              </div>

              {/* SECTION C: AI VOICE SELECTION & VOICE PRESERVATION */}
              <div className="pt-2 border-t border-[#D9E2F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#17233C] flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-[#5B35F5]" />
                    <span>Voice Model &amp; Speaker Timbre</span>
                  </span>

                  {selectedVoiceProfileId && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B35F5]/10 text-[#5B35F5] border border-[#5B35F5]/30 flex items-center gap-1 font-bold">
                      <ShieldCheck className="h-3 w-3 text-[#5B35F5]" />
                      <span>Authorized Voice Profile Active</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Voice Category / Profile Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#17233C] mb-1">
                      Select Voice / Profile
                    </label>
                    <select
                      value={selectedVoiceProfileId ? `vp-${selectedVoiceProfileId}` : voiceCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("vp-")) {
                          setSelectedVoiceProfileId(val.replace("vp-", ""));
                        } else {
                          setSelectedVoiceProfileId(null);
                          setVoiceCategory(val);
                        }
                      }}
                      className="w-full bg-[#F8FAFC] text-[#17233C] text-xs font-semibold rounded-xl px-3 py-2 border border-[#D9E2F0] focus:outline-none focus:border-[#5B35F5]"
                    >
                      <optgroup label="Standard AI Voices">
                        <option value="natural-female">Aria (Natural Conversational)</option>
                        <option value="natural-male">Marcus (Studio Professional)</option>
                        <option value="friendly-female">Maya (Friendly &amp; Warm)</option>
                        <option value="narrator-male">David (Deep Narrator)</option>
                        <option value="assistant-female">Nova (Crisp Assistant)</option>
                      </optgroup>
                      {availableVoices.length > 0 && (
                        <optgroup label="Authorized Cloned Profiles">
                          {availableVoices.map((vp) => (
                            <option key={vp.id} value={`vp-${vp.id}`}>
                              ★ {vp.name} (Same-Speaker Timbre)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Playback Speed (Strictly Default 1.0x) */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#17233C] mb-1">
                      Speech Tempo / Speed
                    </label>
                    <select
                      value={voiceSpeed}
                      onChange={(e) => setVoiceSpeed(e.target.value)}
                      className="w-full bg-[#F8FAFC] text-[#17233C] text-xs font-semibold rounded-xl px-3 py-2 border border-[#D9E2F0] focus:outline-none focus:border-[#5B35F5]"
                    >
                      <option value="0.75">0.75x (Slow &amp; Clear)</option>
                      <option value="1.0">1.0x (Natural Speed - Default)</option>
                      <option value="1.25">1.25x (Dynamic)</option>
                      <option value="1.5">1.5x (Fast)</option>
                      <option value="2.0">2.0x (Double Speed)</option>
                    </select>
                  </div>
                </div>

                {/* Synthesis Action Button */}
                <button
                  onClick={handleGenerateSpeech}
                  disabled={
                    (!translatedText && !transcriptText) ||
                    processingStep !== "idle"
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#5B35F5] via-[#268CFF] to-[#35D6FF] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#5B35F5]/25 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>
                    {processingStep === "synthesizing"
                      ? "Synthesizing Neural Speech..."
                      : "Generate AI Speech"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: PROCESSING STATUS STEPPER */}
        {processingStep !== "idle" && (
          <div className="rounded-2xl bg-[#08162B] p-5 border border-white/10 text-white shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#35D6FF] animate-pulse" />
                Pipeline Execution:
              </span>

              <div className="flex flex-wrap items-center gap-4 sm:gap-8 font-mono">
                <span
                  className={
                    processingStep === "uploading"
                      ? "text-[#35D6FF] font-bold"
                      : "text-slate-400"
                  }
                >
                  Uploading {processingStep === "uploading" ? "●" : "✓"}
                </span>
                <span
                  className={
                    processingStep === "transcribing"
                      ? "text-[#35D6FF] font-bold"
                      : transcriptText
                      ? "text-slate-300"
                      : "text-slate-500"
                  }
                >
                  Transcription {processingStep === "transcribing" ? "●" : transcriptText ? "✓" : "○"}
                </span>
                <span
                  className={
                    processingStep === "translating"
                      ? "text-[#35D6FF] font-bold"
                      : translatedText
                      ? "text-slate-300"
                      : "text-slate-500"
                  }
                >
                  Translation {processingStep === "translating" ? "●" : translatedText ? "✓" : "○"}
                </span>
                <span
                  className={
                    processingStep === "synthesizing"
                      ? "text-[#5B35F5] font-bold"
                      : generatedAudioUrl
                      ? "text-slate-300"
                      : "text-slate-500"
                  }
                >
                  Voice Creation {processingStep === "synthesizing" ? "●" : generatedAudioUrl ? "✓" : "○"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SECTION: STUDIO AUDIO PLAYER */}
        {generatedAudioUrl && (
          <div className="rounded-2xl bg-white p-5 border border-[#D9E2F0] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17233C] mb-3">
              Generated Audio Output
            </h3>
            <StudioAudioPlayer
              src={generatedAudioUrl}
              title={`${getLanguageByCode(targetLanguage).name} Speech Output`}
              isClonedVoice={isClonedVoice}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center text-[#61708A] font-semibold text-sm">Loading Workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
