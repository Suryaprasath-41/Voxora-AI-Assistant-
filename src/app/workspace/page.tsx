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
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  FastForward,
  Play,
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
  const [inputAudioBlob, setInputAudioBlob] = useState<Blob | null>(null);
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
  const [audioDuration, setAudioDuration] = useState<number>(0);

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
            if (p.generations?.[0]) {
              setGeneratedAudioUrl(p.generations[0].audioUrl);
              setIsClonedVoice(p.generations[0].isClonedVoice);
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

  // When text is typed in Text tab, automatically update input
  const handleTextChange = (val: string) => {
    setInputText(val);
    setTranscriptText(val);
    if (val.trim()) {
      const detected = detectLanguageFromText(val);
      if (sourceLanguage === "auto") {
        setDetectedLanguage(detected.code);
        setDetectionConfidence(detected.confidence);
      }
    }
  };

  // When voice recording completes
  const handleRecordingComplete = async (blob: Blob, liveTranscript?: string) => {
    setInputAudioBlob(blob);
    setErrorMessage(null);
    setProcessingStep("transcribing");

    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("language", sourceLanguage);
      if (liveTranscript) {
        formData.append("prompt", liveTranscript);
      }

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed");

      setTranscriptText(data.text);
      setDetectedLanguage(data.detectedLanguage);
      setDetectionConfidence(data.confidence || 0.98);
      setProcessingStep("idle");

      // Auto-trigger translation for seamless flow: SPEAK -> UNDERSTAND -> TRANSLATE
      await performTranslation(data.text, data.detectedLanguage || sourceLanguage, targetLanguage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transcription error";
      setErrorMessage(msg);
      setProcessingStep("idle");
    }
  };

  // When audio/video file is uploaded
  const handleFileSelected = async (file: File) => {
    setUploadedFile(file);
    setErrorMessage(null);
    setProcessingStep("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", sourceLanguage);

      setProcessingStep("transcribing");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speech extraction failed");

      setTranscriptText(data.text);
      setDetectedLanguage(data.detectedLanguage);
      setDetectionConfidence(data.confidence || 0.98);
      setProcessingStep("idle");

      // Auto-trigger translation
      await performTranslation(data.text, data.detectedLanguage || sourceLanguage, targetLanguage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload processing failed";
      setErrorMessage(msg);
      setProcessingStep("idle");
    }
  };

  // Translation execution
  const performTranslation = async (text: string, src: string, tgt: string) => {
    if (!text || !text.trim()) return;

    setIsTranslating(true);
    setProcessingStep("translating");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          sourceLanguage: src,
          targetLanguage: tgt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");

      setTranslatedText(data.translatedText);
      setProcessingStep("idle");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Translation error";
      setErrorMessage(msg);
      setProcessingStep("idle");
    } finally {
      setIsTranslating(false);
    }
  };

  // Speech Generation (Text-To-Speech or Authorized Voice Cloning)
  const handleGenerateSpeech = async () => {
    const textToSpeak = translatedText || transcriptText;
    if (!textToSpeak || !textToSpeak.trim()) {
      setErrorMessage("No text available to synthesize.");
      return;
    }

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
      setAudioDuration(data.duration || 3);
      setProcessingStep("completed");

      // Automatically persist to project history (Section 1)
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
      <div className="flex flex-col gap-6">
        {/* Workspace Subheader / Language Selector Bar */}
        <div className="rounded-2xl glass-panel p-4 border border-white/10 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Translation Pair:
            </span>

            {/* Source Language Selector (Section 9: Auto Detect, Tamil, Hindi, etc.) */}
            <div className="relative">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="bg-white/10 text-white text-xs font-semibold rounded-xl px-3 py-1.5 border border-white/15 focus:outline-none focus:border-cyan-400 appearance-none pr-8 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-500 font-bold">→</span>

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
                className="bg-cyan-500/10 text-cyan-300 text-xs font-semibold rounded-xl px-3 py-1.5 border border-cyan-500/30 focus:outline-none focus:border-cyan-400 appearance-none pr-8 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.filter((l) => l.code !== "auto").map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Mode Button (Section 20) */}
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40"
              title="Quick Mode: Translate and synthesize in one click"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span>Quick Mode</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MAIN WORKSPACE GRID: LEFT SIDE (INPUT) & RIGHT SIDE (OUTPUT) - Section 8 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* ================= LEFT SIDE: INPUT PANEL ================= */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="rounded-2xl glass-panel p-5 border border-white/10 shadow-xl flex-1 flex flex-col">
              {/* Input Mode Tabs: [Voice] [Text] [Upload] */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
                  <button
                    onClick={() => setActiveTab("voice")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "voice"
                        ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Voice</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("text")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "text"
                        ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    <span>Text</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("upload")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "upload"
                        ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
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
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
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
            <div className="rounded-2xl glass-panel p-5 border border-white/10 shadow-xl flex-1 flex flex-col space-y-5">
              {/* SECTION A: SOURCE TRANSCRIPTION (Section 12 & 13) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Original Transcript
                    </span>
                    {detectedLangInfo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-semibold">
                        <span>{detectedLangInfo.name}</span>
                        <span className="text-slate-400">({Math.round(detectionConfidence * 100)}% match)</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleCopyTranscript}
                    disabled={!transcriptText}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                    title="Copy transcript"
                  >
                    {copiedTranscript ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="min-h-[90px] p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs sm:text-sm text-slate-200 leading-relaxed overflow-y-auto max-h-40">
                  {transcriptText || (
                    <span className="text-slate-500 italic">
                      Spoken or typed transcript will appear here with automatic language detection...
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION B: TRANSLATION DISPLAY (Section 14) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                      title="Regenerate translation"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleCopyTranslation}
                      disabled={!translatedText}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                      title="Copy translation"
                    >
                      {copiedTranslation ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <textarea
                  value={translatedText}
                  onChange={(e) => setTranslatedText(e.target.value)}
                  placeholder="Context-aware translation output..."
                  rows={4}
                  className="w-full p-3.5 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
                />
              </div>

              {/* SECTION C: AI VOICE SELECTION & VOICE PRESERVATION (Sections 16, 17, 18) */}
              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-purple-400" />
                    <span>Voice Model & Speaker Timbre</span>
                  </span>

                  {selectedVoiceProfileId && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-purple-400" />
                      <span>Authorized Voice Profile Active</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Voice Category / Profile Selection */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Select Voice / Profile
                    </label>
                    <select
                      value={selectedVoiceProfileId || voiceCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("vp-")) {
                          setSelectedVoiceProfileId(val.replace("vp-", ""));
                        } else {
                          setSelectedVoiceProfileId(null);
                          setVoiceCategory(val);
                        }
                      }}
                      className="w-full bg-white/5 text-white text-xs rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-purple-400 appearance-none"
                    >
                      <optgroup label="Standard AI Voices" className="bg-slate-900 text-slate-300">
                        <option value="natural-female">Aria (Natural Conversational)</option>
                        <option value="natural-male">Marcus (Studio Professional)</option>
                        <option value="friendly-female">Maya (Friendly & Warm)</option>
                        <option value="narrator-male">David (Deep Narrator)</option>
                        <option value="assistant-female">Nova (Crisp Assistant)</option>
                      </optgroup>
                      {availableVoices.length > 0 && (
                        <optgroup label="Authorized Cloned Profiles" className="bg-slate-900 text-purple-300 font-semibold">
                          {availableVoices.map((vp) => (
                            <option key={vp.id} value={`vp-${vp.id}`}>
                              ★ {vp.name} (Same-Speaker Timbre)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Playback Speed */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Speech Tempo / Speed
                    </label>
                    <select
                      value={voiceSpeed}
                      onChange={(e) => setVoiceSpeed(e.target.value)}
                      className="w-full bg-white/5 text-white text-xs rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-purple-400 appearance-none"
                    >
                      <option value="0.75" className="bg-slate-900">0.75x (Slow & Clear)</option>
                      <option value="1.0" className="bg-slate-900">1.0x (Natural Speed)</option>
                      <option value="1.25" className="bg-slate-900">1.25x (Dynamic)</option>
                      <option value="1.5" className="bg-slate-900">1.5x (Fast)</option>
                      <option value="2.0" className="bg-slate-900">2.0x (Double Speed)</option>
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
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-purple-600/25 transition-all disabled:opacity-40"
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

        {/* BOTTOM SECTION: PROCESSING STATUS STEPPER (Section 20) */}
        {processingStep !== "idle" && (
          <div className="rounded-2xl glass-panel p-4 border border-cyan-500/20 bg-cyan-950/10 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                Pipeline Execution:
              </span>

              <div className="flex flex-wrap items-center gap-4 sm:gap-8 font-mono">
                <span
                  className={
                    processingStep === "uploading"
                      ? "text-cyan-400 font-bold"
                      : "text-slate-400"
                  }
                >
                  Uploading {processingStep === "uploading" ? "●" : "✓"}
                </span>
                <span
                  className={
                    processingStep === "transcribing"
                      ? "text-cyan-400 font-bold"
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
                      ? "text-cyan-400 font-bold"
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
                      ? "text-purple-400 font-bold"
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

        {/* BOTTOM SECTION: STUDIO AUDIO PLAYER (Section 22) */}
        {generatedAudioUrl && (
          <div className="mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
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
    <Suspense fallback={<div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400">Loading Workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
