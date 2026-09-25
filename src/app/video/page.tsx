"use client";

import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SUPPORTED_LANGUAGES, getLanguageByCode } from "@/lib/languages";
import {
  Video,
  Upload,
  User,
  Mic,
  FileText,
  Globe2,
  Volume2,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Image as ImageIcon,
  Check,
  Info,
  Square,
  Trash2,
  Copy,
  Layers,
  Wand2,
  HelpCircle,
  X,
  ArrowRight,
  MoreVertical,
} from "lucide-react";

type VideoMode = "video" | "image" | "text";
type InputTab = "upload_video" | "use_image" | "record_voice" | "type_text";
type OutputTab = "transcript" | "translation" | "subtitles" | "details";

interface VoiceProfileOption {
  id: string;
  name: string;
}

interface RecentVideoProject {
  id: string;
  title: string;
  srcLang: string;
  tgtLang: string;
  duration: string;
  date: string;
  videoUrl?: string;
}

export default function VideoTranslatorPage() {
  // Top 3 Large Mode Tabs: VIDEO TO VIDEO | IMAGE TO VIDEO | TEXT TO VIDEO
  const [activeMode, setActiveMode] = useState<VideoMode>("video");

  // Input Card Tabs
  const [activeInputTab, setActiveInputTab] = useState<InputTab>("upload_video");

  // Output Tabs
  const [activeOutputTab, setActiveOutputTab] = useState<OutputTab>("transcript");

  // Language selectors
  const [sourceLanguage, setSourceLanguage] = useState<string>("auto");
  const [targetLanguage, setTargetLanguage] = useState<string>("en");

  // Voice settings
  const [voiceOption, setVoiceOption] = useState<"original" | "profile" | "natural">("original");
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfileOption[]>([]);
  const [selectedVoiceProfileId, setSelectedVoiceProfileId] = useState<string>("");
  const [preserveOriginalVoice, setPreserveOriginalVoice] = useState<boolean>(true);
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(true);

  // Voice Speed (Default strictly preserved as 1.0x)
  const [voiceSpeed, setVoiceSpeed] = useState<string>("1.0");

  // Input Assets
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{ size: string; duration: string } | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);

  const [textInput, setTextInput] = useState<string>("");

  // Voice Recording state
  const [recordingState, setRecordingState] = useState<"ready" | "recording" | "paused" | "recorded">("ready");
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Job progress & Status
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<
    "idle" | "uploading" | "extracting_audio" | "transcribing" | "detecting_language" | "translating" | "generating_voice" | "synchronizing_video" | "rendering" | "completed" | "failed"
  >("idle");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Completed job results
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  // Video Players references
  const originalVideoRef = useRef<HTMLVideoElement | null>(null);
  const translatedVideoRef = useRef<HTMLVideoElement | null>(null);

  // UI Modals
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  // Drag and drop state
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Recent video projects (Matches Reference Specification)
  const [recentProjects, setRecentProjects] = useState<RecentVideoProject[]>([
    {
      id: "demo-1",
      title: "College Introduction",
      srcLang: "Tamil",
      tgtLang: "English",
      duration: "00:28",
      date: "Today, 10:42 AM",
    },
    {
      id: "demo-2",
      title: "Project Presentation",
      srcLang: "English",
      tgtLang: "Tamil",
      duration: "01:15",
      date: "Sep 24, 2026",
    },
    {
      id: "demo-3",
      title: "Self Introduction",
      srcLang: "Hindi",
      tgtLang: "English",
      duration: "00:45",
      date: "Sep 22, 2026",
    },
    {
      id: "demo-4",
      title: "Conference Speech",
      srcLang: "English",
      tgtLang: "Hindi",
      duration: "02:10",
      date: "Sep 20, 2026",
    },
  ]);

  // Mode Selection handler
  const handleSelectMode = (mode: VideoMode) => {
    setActiveMode(mode);
    if (mode === "video") {
      setActiveInputTab("upload_video");
    } else if (mode === "image") {
      setActiveInputTab("use_image");
    } else if (mode === "text") {
      setActiveInputTab("type_text");
    }
  };

  // Fetch voice profiles and projects
  useEffect(() => {
    fetch("/api/voices")
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && data.voices.length > 0) {
          setVoiceProfiles(data.voices);
          setSelectedVoiceProfileId(data.voices[0].id);
        }
      })
      .catch(console.error);

    // Fetch actual recent video projects
    fetch("/api/projects?type=video&limit=4")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          const mapped = data.projects.map((p: { id: string; title?: string; sourceLanguage: string; targetLanguage: string; createdAt: string }) => ({
            id: p.id,
            title: p.title || "Untitled Video",
            srcLang: getLanguageByCode(p.sourceLanguage)?.name || p.sourceLanguage,
            tgtLang: getLanguageByCode(p.targetLanguage)?.name || p.targetLanguage,
            duration: "00:30",
            date: new Date(p.createdAt).toLocaleDateString(),
          }));
          setRecentProjects(mapped);
        }
      })
      .catch(console.error);
  }, []);

  // Poll video job status
  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/status/${jobId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.job) {
          const job = data.job;
          setJobStatus(job.step || "uploading");
          setProgressPercent(job.progressPercent || 10);

          if (job.transcriptText) setTranscriptText(job.transcriptText);
          if (job.translatedText) setTranslatedText(job.translatedText);
          if (job.detectedLanguage) setDetectedLanguage(job.detectedLanguage);

          if (job.status === "COMPLETED") {
            setJobStatus("completed");
            setProgressPercent(100);
            setFinalVideoUrl(job.finalVideoUrl || null);
            clearInterval(interval);
          } else if (job.status === "FAILED") {
            setJobStatus("failed");
            setErrorMessage(job.error || "Video translation failed.");
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Job polling error", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  // Video File selection & metadata extraction
  const handleVideoFile = (file: File) => {
    if (!file.type.includes("video") && !file.name.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
      setErrorMessage("Please select a valid video file (MP4, MOV, AVI, WebM).");
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);

    // Format size
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setVideoMetadata({ size: `${sizeMb} MB`, duration: "--:--" });

    // Extract duration
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const mins = Math.floor(tempVideo.duration / 60);
      const secs = Math.floor(tempVideo.duration % 60);
      const durStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      setVideoMetadata({ size: `${sizeMb} MB`, duration: durStr });
    };
  };

  const removeVideoFile = () => {
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setVideoMetadata(null);
  };

  // Image File selection
  const handleImageFile = (file: File) => {
    if (!file.type.includes("image")) {
      setErrorMessage("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const removeImageFile = () => {
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setVoicePreviewUrl(audioUrl);
        const file = new File([audioBlob], `recorded-voice-${Date.now()}.webm`, { type: "audio/webm" });
        setVoiceFile(file);
        setRecordingState("recorded");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMessage("Microphone access was denied. Please allow microphone permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === "recording" || recordingState === "paused")) {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    setRecordingState("ready");
    setRecordingTime(0);
    setVoiceFile(null);
    setVoicePreviewUrl(null);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Main Submit Action
  const handleSubmit = async () => {
    setErrorMessage(null);
    setFinalVideoUrl(null);
    setTranscriptText(null);
    setTranslatedText(null);

    // Validation according to activeMode
    if (activeMode === "video" && !videoFile) {
      setErrorMessage("Please upload a video file containing a person speaking.");
      return;
    }
    if (activeMode === "image" && !imageFile) {
      setErrorMessage("Please upload a person's photo for Image-to-Video generation.");
      return;
    }
    if (activeMode === "text" && (!textInput.trim() || !imageFile)) {
      if (!imageFile) {
        setErrorMessage("Please provide a portrait photo of the person to speak the text.");
      } else {
        setErrorMessage("Please enter the text you want the person to say.");
      }
      return;
    }

    if (preserveOriginalVoice && !consentConfirmed) {
      setErrorMessage("Voice cloning requires authorized speaker consent.");
      return;
    }

    setJobStatus("uploading");
    setProgressPercent(10);

    try {
      const formData = new FormData();
      const backendMode =
        activeMode === "video"
          ? "video"
          : activeMode === "image"
          ? voiceFile
            ? "image_voice"
            : "image_text"
          : "image_text";

      formData.append("mode", backendMode);
      formData.append("sourceLanguage", sourceLanguage);
      formData.append("targetLanguage", targetLanguage);
      formData.append("consentConfirmed", consentConfirmed ? "true" : "false");
      formData.append("speed", voiceSpeed);

      if (voiceOption === "profile" && selectedVoiceProfileId) {
        formData.append("voiceProfileId", selectedVoiceProfileId);
      } else if (voiceOption === "original") {
        formData.append("voiceId", "natural-female");
      } else {
        formData.append("voiceId", "natural-female");
      }

      if (videoFile) formData.append("videoFile", videoFile);
      if (imageFile) formData.append("imageFile", imageFile);
      if (voiceFile) formData.append("voiceFile", voiceFile);
      if (textInput.trim()) formData.append("text", textInput.trim());

      const res = await fetch("/api/video/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start video translation.");
      }

      setJobId(data.jobId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      setErrorMessage(msg);
      setJobStatus("idle");
    }
  };

  const isProcessing = jobStatus !== "idle" && jobStatus !== "completed" && jobStatus !== "failed";

  // Step timeline definitions
  const stepsTimeline = [
    { key: "uploading", label: "Uploading", icon: Upload },
    { key: "extracting_audio", label: "Extracting Audio", icon: Volume2 },
    { key: "transcribing", label: "Transcribing", icon: FileText },
    { key: "detecting_language", label: "Detecting Language", icon: Globe2 },
    { key: "translating", label: "Translating", icon: Sparkles },
    { key: "generating_voice", label: "Generating Voice", icon: Mic },
    { key: "synchronizing_video", label: "Synchronizing Video", icon: Layers },
    { key: "rendering", label: "Rendering", icon: Video },
    { key: "completed", label: "Complete", icon: CheckCircle2 },
  ];

  const getStepStatus = (stepKey: string, index: number) => {
    if (jobStatus === "failed") return "failed";
    if (progressPercent >= 100) return "completed";

    const stepOrder = [
      "uploading",
      "extracting_audio",
      "transcribing",
      "detecting_language",
      "translating",
      "generating_voice",
      "synchronizing_video",
      "rendering",
      "completed",
    ];

    const currentIndex = stepOrder.indexOf(jobStatus);
    if (currentIndex > index) return "completed";
    if (currentIndex === index) return "in_progress";
    return "pending";
  };

  const copyText = (txt: string, type: "transcript" | "translation") => {
    navigator.clipboard.writeText(txt);
    if (type === "transcript") {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } else {
      setCopiedTranslation(true);
      setTimeout(() => setCopiedTranslation(false), 2000);
    }
  };

  return (
    <AppLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#F4F7FC] min-h-screen text-[#17233C] flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ============================================================ */}
        {/* CENTER COLUMN: MAIN AI VIDEO TRANSLATOR WORKSPACE */}
        {/* ============================================================ */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {/* SECTION 6: HERO SECTION (~130px height) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#08162B] border border-white/10 p-5 sm:p-6 shadow-md min-h-[130px] flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Glowing gradient background accents */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#5B35F5]/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#35D6FF]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Left: Title, Beta Badge, and Description */}
            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                  AI Video Translator
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm">
                  Beta
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Turn any video, image, or text into a realistic talking video in any language with the same person and voice.
              </p>
            </div>

            {/* Right: Person Avatar visual, Waveforms & Tamil -> English transformation */}
            <div className="relative z-10 flex items-center gap-4 shrink-0 bg-white/[0.04] p-3 rounded-2xl border border-white/[0.08]">
              {/* Avatar with glowing ring */}
              <div className="relative h-12 w-12 rounded-xl bg-gradient-to-tr from-[#5B35F5] via-[#268CFF] to-[#35D6FF] p-[2px] shadow-lg shadow-[#5B35F5]/30 shrink-0">
                <div className="h-full w-full rounded-[10px] bg-[#08162B] flex items-center justify-center overflow-hidden">
                  <User className="h-6 w-6 text-[#35D6FF]" />
                </div>
              </div>

              {/* Waveform graphic */}
              <div className="flex items-center gap-1 h-6">
                {[12, 24, 18, 28, 14, 22, 16, 26, 10].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-[#5B35F5] to-[#35D6FF] rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Language Transformation Badge */}
              <div className="flex flex-col text-right pl-1">
                <span className="text-[10px] font-bold text-[#35D6FF] tracking-wider uppercase">
                  Tamil → English
                </span>
                <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5 justify-end">
                  <span className="text-slate-300 font-normal">&quot;வணக்கம்&quot;</span>
                  <ArrowRight className="h-3 w-3 text-[#35D6FF]" />
                  <span className="text-white font-bold">&quot;Hello&quot;</span>
                </span>
              </div>

              {/* How it works Button */}
              <button
                onClick={() => setShowHowItWorks(true)}
                className="ml-2 p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-all"
                title="How AI Video Translator works"
                aria-label="How it works"
              >
                <HelpCircle className="h-4 w-4 text-[#35D6FF]" />
              </button>
            </div>
          </div>

          {/* SECTION 7: MODE SELECTOR (3 LARGE TABS FULL WIDTH) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            {/* Tab 1: Video to Video */}
            <button
              type="button"
              onClick={() => handleSelectMode("video")}
              className={`p-4 rounded-2xl text-left transition-all ${
                activeMode === "video"
                  ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-lg shadow-[#5B35F5]/25 ring-1 ring-white/30"
                  : "bg-white border border-[#D9E2F0] text-[#17233C] hover:border-[#5B35F5]/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <Video className={`h-4 w-4 ${activeMode === "video" ? "text-white" : "text-[#5B35F5]"}`} />
                <span className="font-bold text-sm tracking-wide">VIDEO TO VIDEO</span>
              </div>
              <p className={`text-xs ${activeMode === "video" ? "text-blue-100" : "text-[#61708A]"}`}>
                Translate existing video
              </p>
            </button>

            {/* Tab 2: Image to Video */}
            <button
              type="button"
              onClick={() => handleSelectMode("image")}
              className={`p-4 rounded-2xl text-left transition-all ${
                activeMode === "image"
                  ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-lg shadow-[#5B35F5]/25 ring-1 ring-white/30"
                  : "bg-white border border-[#D9E2F0] text-[#17233C] hover:border-[#5B35F5]/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <ImageIcon className={`h-4 w-4 ${activeMode === "image" ? "text-white" : "text-[#268CFF]"}`} />
                <span className="font-bold text-sm tracking-wide">IMAGE TO VIDEO</span>
              </div>
              <p className={`text-xs ${activeMode === "image" ? "text-blue-100" : "text-[#61708A]"}`}>
                Upload image + text/voice
              </p>
            </button>

            {/* Tab 3: Text to Video */}
            <button
              type="button"
              onClick={() => handleSelectMode("text")}
              className={`p-4 rounded-2xl text-left transition-all ${
                activeMode === "text"
                  ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-lg shadow-[#5B35F5]/25 ring-1 ring-white/30"
                  : "bg-white border border-[#D9E2F0] text-[#17233C] hover:border-[#5B35F5]/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <FileText className={`h-4 w-4 ${activeMode === "text" ? "text-white" : "text-[#5B35F5]"}`} />
                <span className="font-bold text-sm tracking-wide">TEXT TO VIDEO</span>
              </div>
              <p className={`text-xs ${activeMode === "text" ? "text-blue-100" : "text-[#61708A]"}`}>
                Type text and generate video
              </p>
            </button>
          </div>

          {/* Global Error Alert Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs text-red-600 hover:text-red-800 underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* SECTION 8: MAIN WORKSPACE (2-COLUMN LAYOUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ============================================================ */}
            {/* LEFT COLUMN: ~45% (lg:col-span-5) - INPUT & SETTINGS */}
            {/* ============================================================ */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* SECTION 9: INPUT CARD */}
              <div className="bg-white rounded-2xl border border-[#D9E2F0] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5B35F5]/10 text-[#5B35F5] text-[11px] font-bold">
                        1
                      </span>
                      <h2 className="text-sm font-bold text-[#17233C]">Input</h2>
                    </div>
                    <p className="text-xs text-[#61708A] mt-0.5">
                      Upload a video, image, or provide text/voice
                    </p>
                  </div>
                </div>

                {/* Input Card Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-[#F4F7FC] border border-[#D9E2F0] mb-5">
                  <button
                    type="button"
                    onClick={() => setActiveInputTab("upload_video")}
                    className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-center truncate ${
                      activeInputTab === "upload_video"
                        ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm"
                        : "text-[#61708A] hover:text-[#17233C]"
                    }`}
                  >
                    Upload Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInputTab("use_image")}
                    className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-center truncate ${
                      activeInputTab === "use_image"
                        ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm"
                        : "text-[#61708A] hover:text-[#17233C]"
                    }`}
                  >
                    Use Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInputTab("record_voice")}
                    className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-center truncate ${
                      activeInputTab === "record_voice"
                        ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm"
                        : "text-[#61708A] hover:text-[#17233C]"
                    }`}
                  >
                    Record Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInputTab("type_text")}
                    className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-center truncate ${
                      activeInputTab === "type_text"
                        ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm"
                        : "text-[#61708A] hover:text-[#17233C]"
                    }`}
                  >
                    Type Text
                  </button>
                </div>

                {/* TAB 1: UPLOAD VIDEO UI */}
                {activeInputTab === "upload_video" && (
                  <div>
                    {!videoFile ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingVideo(true);
                        }}
                        onDragLeave={() => setIsDraggingVideo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingVideo(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleVideoFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`relative border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isDraggingVideo
                            ? "border-[#268CFF] bg-[#268CFF]/10 shadow-md"
                            : "border-[#D9E2F0] hover:border-[#5B35F5] bg-[#F8FAFC]"
                        }`}
                      >
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleVideoFile(e.target.files[0]);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#5B35F5]/20 to-[#268CFF]/20 flex items-center justify-center mb-3">
                          <Upload className="h-6 w-6 text-[#5B35F5]" />
                        </div>
                        <p className="text-xs font-bold text-[#17233C]">
                          Drag &amp; drop a video file here
                        </p>
                        <p className="text-[11px] text-[#61708A] mt-1">or click to upload</p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#D9E2F0] text-[10px] font-medium text-[#61708A]">
                            MP4, MOV, AVI, WebM
                          </span>
                          <span className="text-[10px] text-[#61708A]">Max 500MB</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl p-3 bg-[#F8FAFC] border border-[#D9E2F0] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-[#5B35F5]/10 flex items-center justify-center shrink-0">
                            <FileVideo className="h-5 w-5 text-[#5B35F5]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#17233C] truncate">
                              {videoFile.name}
                            </p>
                            <p className="text-[11px] text-[#61708A] mt-0.5">
                              {videoMetadata?.size || "24.5 MB"} • {videoMetadata?.duration || "00:28"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeVideoFile}
                          className="p-1.5 rounded-lg text-[#61708A] hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: USE IMAGE UI */}
                {activeInputTab === "use_image" && (
                  <div className="flex flex-col gap-4">
                    {!imageFile ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingImage(true);
                        }}
                        onDragLeave={() => setIsDraggingImage(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingImage(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleImageFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`relative border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isDraggingImage
                            ? "border-[#268CFF] bg-[#268CFF]/10"
                            : "border-[#D9E2F0] hover:border-[#5B35F5] bg-[#F8FAFC]"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#5B35F5]/20 to-[#268CFF]/20 flex items-center justify-center mb-3">
                          <ImageIcon className="h-6 w-6 text-[#268CFF]" />
                        </div>
                        <p className="text-xs font-bold text-[#17233C]">
                          Upload a portrait photo
                        </p>
                        <p className="text-[11px] text-[#61708A] mt-1">PNG, JPG, WebP</p>
                      </div>
                    ) : (
                      <div className="rounded-xl p-3 bg-[#F8FAFC] border border-[#D9E2F0] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {imagePreviewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imagePreviewUrl}
                              alt="Uploaded portrait"
                              className="h-10 w-10 rounded-lg object-cover ring-1 ring-[#D9E2F0]"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#17233C] truncate">
                              {imageFile.name}
                            </p>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Portrait ready for animation
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={removeImageFile}
                          className="p-1.5 rounded-lg text-[#61708A] hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: RECORD VOICE UI */}
                {activeInputTab === "record_voice" && (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#5B35F5]/20 to-[#268CFF]/20 flex items-center justify-center mb-2">
                      <Mic className={`h-6 w-6 ${recordingState === "recording" ? "text-red-500 animate-pulse" : "text-[#5B35F5]"}`} />
                    </div>

                    <span className="text-lg font-mono font-bold text-[#17233C] mb-1">
                      {formatTimer(recordingTime)}
                    </span>
                    <span className="text-xs text-[#61708A] mb-4">
                      {recordingState === "recording"
                        ? "Recording in progress... speak clearly"
                        : recordingState === "paused"
                        ? "Recording paused"
                        : recordingState === "recorded"
                        ? "Voice recorded successfully"
                        : "Ready to record speech"}
                    </span>

                    <div className="flex items-center gap-2">
                      {recordingState === "ready" && (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5B35F5] hover:bg-[#4825dc] text-white flex items-center gap-2 shadow-sm"
                        >
                          <Mic className="h-4 w-4" />
                          Start Recording
                        </button>
                      )}

                      {recordingState === "recording" && (
                        <>
                          <button
                            type="button"
                            onClick={pauseRecording}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-white"
                          >
                            Pause
                          </button>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white flex items-center gap-1.5"
                          >
                            <Square className="h-3.5 w-3.5 fill-white" />
                            Stop
                          </button>
                        </>
                      )}

                      {recordingState === "paused" && (
                        <>
                          <button
                            type="button"
                            onClick={resumeRecording}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#5B35F5] text-white"
                          >
                            Resume
                          </button>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white"
                          >
                            Done
                          </button>
                        </>
                      )}

                      {recordingState === "recorded" && (
                        <div className="flex items-center gap-2">
                          {voicePreviewUrl && (
                            <audio src={voicePreviewUrl} controls className="h-8 max-w-[200px]" />
                          )}
                          <button
                            type="button"
                            onClick={cancelRecording}
                            className="p-1.5 rounded-lg text-[#61708A] hover:text-red-500 hover:bg-red-50"
                            title="Delete recording"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: TYPE TEXT UI */}
                {activeInputTab === "type_text" && (
                  <div>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={4}
                      placeholder="Enter the text you want the avatar to speak..."
                      className="w-full p-3 rounded-xl text-xs bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] placeholder:text-[#61708A] focus:outline-none focus:border-[#5B35F5] focus:ring-1 focus:ring-[#5B35F5] resize-none"
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#61708A] mt-1">
                      <span>Supports 30+ spoken languages</span>
                      <span>{textInput.length} characters</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 10: TRANSLATION SETTINGS CARD */}
              <div className="bg-white rounded-2xl border border-[#D9E2F0] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5B35F5]/10 text-[#5B35F5] text-[11px] font-bold">
                        2
                      </span>
                      <h2 className="text-sm font-bold text-[#17233C]">Translation Settings</h2>
                    </div>
                    <p className="text-xs text-[#61708A] mt-0.5">
                      Choose languages and voice options
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Source Language */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#17233C] mb-1">
                      Source Language
                    </label>
                    <select
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] focus:outline-none focus:border-[#5B35F5]"
                    >
                      <option value="auto">Auto Detect</option>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Language */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#17233C] mb-1">
                      Target Language
                    </label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] focus:outline-none focus:border-[#5B35F5]"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Voice Option */}
                <div className="pt-3 border-t border-[#D9E2F0] space-y-3">
                  <label className="block text-[11px] font-semibold text-[#17233C]">
                    Voice Option
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVoiceOption("original")}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        voiceOption === "original"
                          ? "bg-[#5B35F5]/10 border-[#5B35F5] text-[#5B35F5]"
                          : "bg-[#F8FAFC] border-[#D9E2F0] text-[#61708A] hover:text-[#17233C]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#17233C]">Original Speaker</span>
                        <Info className="h-3 w-3 text-[#5B35F5] shrink-0" />
                      </div>
                      <span className="text-[9px] text-[#5B35F5] font-extrabold block mt-0.5">
                        (Recommended)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVoiceOption("profile")}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        voiceOption === "profile"
                          ? "bg-[#5B35F5]/10 border-[#5B35F5] text-[#5B35F5]"
                          : "bg-[#F8FAFC] border-[#D9E2F0] text-[#61708A] hover:text-[#17233C]"
                      }`}
                    >
                      <span className="text-xs font-bold text-[#17233C] block">Voice Profile</span>
                      <span className="text-[10px] text-[#61708A] block mt-0.5">
                        {voiceProfiles.length} available
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVoiceOption("natural")}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        voiceOption === "natural"
                          ? "bg-[#5B35F5]/10 border-[#5B35F5] text-[#5B35F5]"
                          : "bg-[#F8FAFC] border-[#D9E2F0] text-[#61708A] hover:text-[#17233C]"
                      }`}
                    >
                      <span className="text-xs font-bold text-[#17233C] block">AI Natural Voice</span>
                      <span className="text-[10px] text-[#61708A] block mt-0.5">Studio Neural</span>
                    </button>
                  </div>

                  {/* Profile Dropdown if Selected */}
                  {voiceOption === "profile" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[#17233C] mb-1">
                        Select Voice Profile
                      </label>
                      <select
                        value={selectedVoiceProfileId}
                        onChange={(e) => setSelectedVoiceProfileId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C]"
                      >
                        {voiceProfiles.map((vp) => (
                          <option key={vp.id} value={vp.id}>
                            {vp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Preservation Checkbox */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#5B35F5]/5 border border-[#5B35F5]/20">
                    <input
                      type="checkbox"
                      id="preserve-voice"
                      checked={preserveOriginalVoice}
                      onChange={(e) => setPreserveOriginalVoice(e.target.checked)}
                      className="mt-0.5 rounded border-[#D9E2F0] text-[#5B35F5] focus:ring-[#5B35F5]"
                    />
                    <div className="text-xs">
                      <label
                        htmlFor="preserve-voice"
                        className="font-bold text-[#17233C] cursor-pointer select-none"
                      >
                        Preserve original speaker&apos;s voice
                      </label>
                      <p className="text-[11px] text-[#61708A] mt-0.5">
                        Use the authorized speaker&apos;s voice characteristics for the translated speech.
                      </p>
                    </div>
                  </div>

                  {/* Speaker Consent Checkbox */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                    <input
                      type="checkbox"
                      id="consent-confirm"
                      checked={consentConfirmed}
                      onChange={(e) => setConsentConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-[#D9E2F0] text-[#5B35F5] focus:ring-[#5B35F5]"
                    />
                    <label
                      htmlFor="consent-confirm"
                      className="text-[11px] text-[#61708A] cursor-pointer select-none"
                    >
                      I confirm that I have explicit authorization and consent to synthesize this speaker&apos;s voice and visual likeness.
                    </label>
                  </div>

                  {/* SECTION 11: SPEECH SPEED (STRICT DEFAULT: 1.0x) */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-[#17233C]">
                        Voice Speed
                      </label>
                      <span className="text-[11px] font-bold text-[#5B35F5]">
                        {voiceSpeed === "1.0"
                          ? "1.0x (Natural Speed)"
                          : voiceSpeed === "0.75"
                          ? "0.75x (Slow & Clear)"
                          : voiceSpeed === "1.25"
                          ? "1.25x (Dynamic)"
                          : voiceSpeed === "1.5"
                          ? "1.5x (Fast)"
                          : "2.0x (Double Speed)"}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-[#F4F7FC] border border-[#D9E2F0]">
                      {[
                        { val: "0.75", label: "0.75x" },
                        { val: "1.0", label: "1.0x" },
                        { val: "1.25", label: "1.25x" },
                        { val: "1.5", label: "1.5x" },
                        { val: "2.0", label: "2.0x" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setVoiceSpeed(item.val)}
                          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            voiceSpeed === item.val
                              ? "bg-[#5B35F5] text-white shadow-sm font-bold"
                              : "text-[#61708A] hover:text-[#17233C]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* RIGHT COLUMN: ~55% (lg:col-span-7) - PREVIEW & OUTPUT */}
            {/* ============================================================ */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* SECTION 12: PREVIEW & OUTPUT CARD */}
              <div className="bg-white rounded-2xl border border-[#D9E2F0] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5B35F5]/10 text-[#5B35F5] text-[11px] font-bold">
                        3
                      </span>
                      <h2 className="text-sm font-bold text-[#17233C]">Preview &amp; Output</h2>
                    </div>
                    <p className="text-xs text-[#61708A] mt-0.5">
                      Original video and translated video will appear here
                    </p>
                  </div>
                </div>

                {/* DUAL VIDEO PANELS SIDE-BY-SIDE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* LEFT: Original Video */}
                  <div className="rounded-2xl overflow-hidden border border-[#D9E2F0] bg-slate-950 flex flex-col shadow-sm">
                    <div className="p-2.5 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
                      <span className="text-xs font-semibold text-slate-200">Original Video</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5B35F5]/30 text-white border border-[#5B35F5]/50">
                        Detected: {detectedLanguage ? getLanguageByCode(detectedLanguage)?.name : "Tamil"}
                      </span>
                    </div>

                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {videoPreviewUrl ? (
                        <video
                          ref={originalVideoRef}
                          src={videoPreviewUrl}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      ) : imagePreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreviewUrl}
                          alt="Original"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
                          <FileVideo className="h-9 w-9 mb-2 opacity-40 text-slate-400" />
                          <span className="text-xs font-medium">No original video uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Translated Video */}
                  <div className="rounded-2xl overflow-hidden border border-[#268CFF]/50 bg-slate-950 flex flex-col shadow-sm">
                    <div className="p-2.5 border-b border-white/10 flex items-center justify-between bg-[#268CFF]/10">
                      <span className="text-xs font-bold text-[#35D6FF]">Translated Video</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#268CFF]/30 text-[#35D6FF] border border-[#268CFF]/50">
                        {getLanguageByCode(targetLanguage)?.name || "English"}
                      </span>
                    </div>

                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {finalVideoUrl ? (
                        <video
                          ref={translatedVideoRef}
                          src={finalVideoUrl}
                          controls
                          autoPlay
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      ) : isProcessing ? (
                        <div className="flex flex-col items-center justify-center text-center p-6 text-[#35D6FF]">
                          <div className="h-10 w-10 rounded-full border-2 border-[#35D6FF] border-t-transparent animate-spin mb-3" />
                          <span className="text-xs font-bold">Generating your translated video...</span>
                          <span className="text-[10px] text-slate-300 mt-1">{progressPercent}% complete</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
                          <Video className="h-9 w-9 mb-2 opacity-40 text-slate-400" />
                          <span className="text-xs font-medium">Translated output will display here</span>
                        </div>
                      )}
                    </div>

                    {finalVideoUrl && (
                      <div className="p-2.5 border-t border-white/10 bg-white/[0.04] flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">MP4 • 720p H.264</span>
                        <a
                          href={finalVideoUrl}
                          download={`translated-${targetLanguage}.mp4`}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#35D6FF] hover:bg-[#268CFF] text-[#08162B] transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 13: TRANSCRIPT SECTION */}
                <div className="border-t border-[#D9E2F0] pt-4">
                  <div className="flex items-center gap-2 mb-4 border-b border-[#D9E2F0] pb-2">
                    {[
                      { id: "transcript", label: "Transcript" },
                      { id: "translation", label: "Translation" },
                      { id: "subtitles", label: "Subtitles" },
                      { id: "details", label: "Details" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveOutputTab(tab.id as OutputTab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeOutputTab === tab.id
                            ? "bg-[#5B35F5]/10 text-[#5B35F5] border border-[#5B35F5]/30 font-bold"
                            : "text-[#61708A] hover:text-[#17233C]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab: Transcript & Translation Side-by-Side */}
                  {activeOutputTab === "transcript" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* LEFT: Original Transcript (Tamil) */}
                      <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#17233C]">
                            Original Transcript ({detectedLanguage ? getLanguageByCode(detectedLanguage)?.name : "Tamil"})
                          </span>
                          <button
                            onClick={() =>
                              copyText(
                                transcriptText ||
                                  "நான் இன்று கல்லூரிக்கு செல்கிறேன். எங்கள் கல்லூரியில் பல நல்ல வாய்ப்புகள் இருக்கின்றன. எல்லோருக்கும் நன்றி.",
                                "transcript"
                              )
                            }
                            className="p-1 rounded text-[#61708A] hover:text-[#17233C]"
                            title="Copy transcript"
                          >
                            {copiedTranscript ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-[#17233C] leading-relaxed font-sans min-h-[60px]">
                          {transcriptText ||
                            "நான் இன்று கல்லூரிக்கு செல்கிறேன். எங்கள் கல்லூரியில் பல நல்ல வாய்ப்புகள் இருக்கின்றன. எல்லோருக்கும் நன்றி."}
                        </p>
                      </div>

                      {/* RIGHT: Translated Text (English) */}
                      <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#268CFF]/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#268CFF]">
                            Translated Text ({getLanguageByCode(targetLanguage)?.name || "English"})
                          </span>
                          <button
                            onClick={() =>
                              copyText(
                                translatedText ||
                                  "I am going to college today. There are many good opportunities in our college. Thank you everyone.",
                                "translation"
                              )
                            }
                            className="p-1 rounded text-[#61708A] hover:text-[#17233C]"
                            title="Copy translation"
                          >
                            {copiedTranslation ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-[#17233C] leading-relaxed font-sans min-h-[60px]">
                          {translatedText ||
                            "I am going to college today. There are many good opportunities in our college. Thank you everyone."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tab: Translation Only */}
                  {activeOutputTab === "translation" && (
                    <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                      <p className="text-xs text-[#17233C] leading-relaxed">
                        {translatedText ||
                          "I am going to college today. There are many good opportunities in our college. Thank you everyone."}
                      </p>
                    </div>
                  )}

                  {/* Tab: Subtitles */}
                  {activeOutputTab === "subtitles" && (
                    <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] font-mono text-xs text-[#17233C] space-y-2">
                      <p className="text-[#61708A]">1</p>
                      <p className="text-[#5B35F5] font-semibold">00:00:00,500 --&gt; 00:00:02,800</p>
                      <p>
                        {translatedText ||
                          "I am going to college today. There are many good opportunities in our college."}
                      </p>
                    </div>
                  )}

                  {/* Tab: Details */}
                  {activeOutputTab === "details" && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                        <span className="text-[10px] text-[#61708A] block font-medium">Video Codec</span>
                        <span className="font-bold text-[#17233C]">H.264 (AVC)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                        <span className="text-[10px] text-[#61708A] block font-medium">Audio Codec</span>
                        <span className="font-bold text-[#17233C]">AAC (Stereo 192k)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                        <span className="text-[10px] text-[#61708A] block font-medium">Sample Rate</span>
                        <span className="font-bold text-[#17233C]">44,100 Hz</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                        <span className="text-[10px] text-[#61708A] block font-medium">Sync Model</span>
                        <span className="font-bold text-[#5B35F5]">Voxora Visual-Sync</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 17: PROCESSING STATUS (FULL-WIDTH DARK NAVY CARD AT BOTTOM) */}
          <div className="rounded-2xl bg-[#08162B] border border-white/10 p-5 sm:p-6 shadow-md text-slate-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#35D6FF] animate-pulse" />
                <h3 className="text-sm font-bold text-white">Processing Status</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Estimated Time: 2–4 minutes</span>
                {isProcessing && (
                  <span className="font-bold text-[#35D6FF]">{progressPercent}%</span>
                )}
              </div>
            </div>

            {/* Stepper Timeline with 9 Connected Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {stepsTimeline.map((step, idx) => {
                const Icon = step.icon;
                const status = getStepStatus(step.key, idx);

                return (
                  <div
                    key={step.key}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                      status === "completed"
                        ? "bg-[#5B35F5]/20 border-[#5B35F5]/40 text-violet-200"
                        : status === "in_progress"
                        ? "bg-[#268CFF]/20 border-[#35D6FF]/60 text-cyan-200 ring-2 ring-[#35D6FF]/20"
                        : "bg-white/[0.02] border-white/[0.05] text-slate-500"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${
                        status === "completed"
                          ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white"
                          : status === "in_progress"
                          ? "bg-[#35D6FF] text-[#08162B] animate-bounce shadow-md shadow-[#35D6FF]/30"
                          : "bg-white/[0.06] text-slate-500"
                      }`}
                    >
                      {status === "completed" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold truncate w-full mb-0.5">
                      {step.label}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wider font-extrabold ${
                        status === "completed"
                          ? "text-[#35D6FF]"
                          : status === "in_progress"
                          ? "text-cyan-300"
                          : "text-slate-600"
                      }`}
                    >
                      {status === "completed"
                        ? "Completed"
                        : status === "in_progress"
                        ? "In Progress"
                        : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 18: MAIN CTA BUTTON ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <p className="text-xs text-[#61708A]">
              Output is digitally labeled with <code className="text-[#5B35F5] font-semibold">AI-generated voice &amp; video</code> for transparency.
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#5B35F5] via-[#268CFF] to-[#35D6FF] text-white shadow-lg shadow-[#5B35F5]/30 hover:shadow-[#5B35F5]/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing Video Pipeline...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Translate &amp; Generate Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT SIDEBAR: RECENT PROJECTS, QUICK TIPS, SUPPORTED LANGS */}
        {/* Width approximately 230px on desktop */}
        {/* ============================================================ */}
        <aside className="w-full xl:w-[230px] shrink-0 flex flex-col gap-4">
          {/* SECTION 14: RECENT PROJECTS */}
          <div className="bg-white rounded-2xl border border-[#D9E2F0] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#17233C] uppercase tracking-wider">
                Recent Projects
              </h4>
              <a href="/projects" className="text-[11px] font-semibold text-[#5B35F5] hover:underline">
                View All
              </a>
            </div>
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <a
                  key={p.id}
                  href={`/projects`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#D9E2F0]/80 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-[#5B35F5]/10 flex items-center justify-center text-[#5B35F5] shrink-0">
                      <FileVideo className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#17233C] group-hover:text-[#5B35F5] truncate">
                        {p.title}
                      </p>
                      <p className="text-[9px] text-[#61708A]">
                        {p.srcLang} → {p.tgtLang} • {p.duration}
                      </p>
                    </div>
                  </div>
                  <MoreVertical className="h-3.5 w-3.5 text-[#61708A] group-hover:text-[#17233C] shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* SECTION 15: QUICK TIPS */}
          <div className="bg-white rounded-2xl border border-[#D9E2F0] p-4 shadow-sm">
            <h4 className="text-xs font-bold text-[#17233C] uppercase tracking-wider mb-3">
              Quick Tips
            </h4>
            <div className="space-y-2.5">
              {[
                "Upload a clear video with a visible face.",
                "Choose source and target languages.",
                "Select the original or a voice profile.",
                "Click translate & generate.",
                "Download your video.",
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="flex h-4 w-4 rounded-full bg-[#5B35F5]/10 text-[#5B35F5] text-[10px] font-extrabold items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] text-[#61708A] leading-snug">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 16: SUPPORTED LANGUAGES */}
          <div className="bg-white rounded-2xl border border-[#D9E2F0] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#17233C] uppercase tracking-wider">
                Supported Languages
              </h4>
              <span className="text-[10px] text-[#61708A] font-medium">30+ Total</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Tamil",
                "English",
                "Hindi",
                "Telugu",
                "Malayalam",
                "Kannada",
                "French",
                "German",
                "Spanish",
                "Japanese",
                "Chinese",
                "+ More",
              ].map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#F4F7FC] border border-[#D9E2F0] text-[#17233C] hover:border-[#5B35F5] hover:text-[#5B35F5] transition-colors cursor-default"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* HOW IT WORKS MODAL */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-[#D9E2F0] shadow-2xl text-[#17233C]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#5B35F5]/10 text-[#5B35F5]">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17233C]">How AI Video Translation Works</h3>
                  <p className="text-xs text-[#61708A]">Autonomous Multimodal Pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-[#61708A] hover:text-[#17233C]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#61708A] my-4 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                <strong className="text-[#5B35F5] block mb-0.5 font-bold">1. Multimodal Audio Extraction</strong>
                Your speaking video is ingested and the raw speech track is extracted at 16kHz studio fidelity.
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                <strong className="text-[#268CFF] block mb-0.5 font-bold">2. High-Accuracy Transcription &amp; Translation</strong>
                Whisper transcribes speech into Unicode text, detects the language, and translates to your chosen target language.
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                <strong className="text-[#5B35F5] block mb-0.5 font-bold">3. Same-Speaker Voice Synthesis</strong>
                The translated text is spoken using authorized timbre and voice characteristics matching the original speaker.
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                <strong className="text-[#268CFF] block mb-0.5 font-bold">4. Lip-Synchronization &amp; MP4 Rendering</strong>
                The original video visuals are matched with the translated speech track and exported into standard H.264 MP4.
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-md shadow-[#5B35F5]/30 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
