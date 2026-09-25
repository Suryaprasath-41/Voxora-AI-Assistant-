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
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  Download,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Info,
  Clock,
  ExternalLink,
  Square,
  Trash2,
  Copy,
  ChevronRight,
  Maximize2,
  Layers,
  Wand2,
  HelpCircle,
  X,
  FileSpreadsheet,
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

  // Voice Speed (Default 1.0x preserved!)
  const [voiceSpeed, setVoiceSpeed] = useState<string>("1.0");

  // Input Assets
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{ size: string; duration: string } | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [voiceSourceOption, setVoiceSourceOption] = useState<"original" | "profile" | "upload" | "record">("original");
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
  const [isOrigPlaying, setIsOrigPlaying] = useState(false);
  const [isTransPlaying, setIsTransPlaying] = useState(false);

  // UI Modals
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Drag and drop state
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Recent video projects
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
      date: "Sep 23, 2026",
    },
  ]);

  // Sync mode changes to default tabs
  useEffect(() => {
    if (activeMode === "video") {
      setActiveInputTab("upload_video");
    } else if (activeMode === "image") {
      setActiveInputTab("use_image");
    } else if (activeMode === "text") {
      setActiveInputTab("type_text");
    }
  }, [activeMode]);

  // Fetch voice profiles
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
          const mapped = data.projects.map((p: any) => ({
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

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 pb-12">
        {/* SECTION 5: HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                AI Video Translator
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/40 text-cyan-300">
                Beta
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Turn your video, image, voice, or text into a realistic multilingual video.
            </p>
          </div>

          <button
            onClick={() => setShowHowItWorks(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/30 transition-all"
          >
            <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span>How it works?</span>
          </button>
        </div>

        {/* SECTION 6: MODE SELECTOR (3 LARGE TABS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tab 1: Video to Video */}
          <button
            onClick={() => {
              setActiveMode("video");
              setActiveInputTab("upload_video");
            }}
            className={`p-4 rounded-2xl text-left transition-all ${
              activeMode === "video"
                ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-violet-500/25 ring-1 ring-white/30"
                : "saas-card text-slate-300 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <Video className={`h-4 w-4 ${activeMode === "video" ? "text-white" : "text-violet-400"}`} />
              <span className="font-bold text-sm tracking-wide">VIDEO TO VIDEO</span>
            </div>
            <p className={`text-xs ${activeMode === "video" ? "text-violet-100" : "text-slate-400"}`}>
              Translate existing video.
            </p>
          </button>

          {/* Tab 2: Image to Video */}
          <button
            onClick={() => {
              setActiveMode("image");
              setActiveInputTab("use_image");
            }}
            className={`p-4 rounded-2xl text-left transition-all ${
              activeMode === "image"
                ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-violet-500/25 ring-1 ring-white/30"
                : "saas-card text-slate-300 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <ImageIcon className={`h-4 w-4 ${activeMode === "image" ? "text-white" : "text-cyan-400"}`} />
              <span className="font-bold text-sm tracking-wide">IMAGE TO VIDEO</span>
            </div>
            <p className={`text-xs ${activeMode === "image" ? "text-violet-100" : "text-slate-400"}`}>
              Upload image + text/voice.
            </p>
          </button>

          {/* Tab 3: Text to Video */}
          <button
            onClick={() => {
              setActiveMode("text");
              setActiveInputTab("type_text");
            }}
            className={`p-4 rounded-2xl text-left transition-all ${
              activeMode === "text"
                ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-violet-500/25 ring-1 ring-white/30"
                : "saas-card text-slate-300 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <FileText className={`h-4 w-4 ${activeMode === "text" ? "text-white" : "text-indigo-400"}`} />
              <span className="font-bold text-sm tracking-wide">TEXT TO VIDEO</span>
            </div>
            <p className={`text-xs ${activeMode === "text" ? "text-violet-100" : "text-slate-400"}`}>
              Type text and generate video.
            </p>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-400 hover:text-red-300 underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SECTION 7: MAIN WORKSPACE (2-COLUMN LAYOUT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: 40% (lg:col-span-5) - INPUT & SETTINGS */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* SECTION 8: INPUT CARD */}
            <div className="saas-card p-6 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600/30 text-violet-300 text-[11px] font-bold">
                      1
                    </span>
                    <h2 className="text-sm font-bold text-white">Input</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload a video, image, or provide text/voice.
                  </p>
                </div>
              </div>

              {/* Input Card Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/[0.06] mb-5">
                <button
                  type="button"
                  onClick={() => setActiveInputTab("upload_video")}
                  className={`py-2 px-2 rounded-lg text-[11px] font-medium transition-all text-center truncate ${
                    activeInputTab === "upload_video"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Upload Video
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab("use_image")}
                  className={`py-2 px-2 rounded-lg text-[11px] font-medium transition-all text-center truncate ${
                    activeInputTab === "use_image"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Use Image
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab("record_voice")}
                  className={`py-2 px-2 rounded-lg text-[11px] font-medium transition-all text-center truncate ${
                    activeInputTab === "record_voice"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Record Voice
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab("type_text")}
                  className={`py-2 px-2 rounded-lg text-[11px] font-medium transition-all text-center truncate ${
                    activeInputTab === "type_text"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Type Text
                </button>
              </div>

              {/* SECTION 9: VIDEO UPLOAD UI */}
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
                      className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                        isDraggingVideo
                          ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                          : "border-white/10 hover:border-violet-500/40 bg-white/[0.02]"
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
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/30 flex items-center justify-center mb-3">
                        <Upload className="h-6 w-6 text-cyan-400" />
                      </div>
                      <p className="text-xs font-semibold text-white">
                        Drag & drop a video file here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">or click to upload</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-400">
                          MP4, MOV, AVI, WebM
                        </span>
                        <span className="text-[10px] text-slate-500">• Max 50MB</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl p-3 bg-white/[0.04] border border-white/[0.1] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
                          <FileVideo className="h-5 w-5 text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">
                            {videoFile.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {videoMetadata?.size || "24.5 MB"} • {videoMetadata?.duration || "00:28"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeVideoFile}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove video"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 10: IMAGE INPUT */}
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
                      className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                        isDraggingImage
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-white/10 hover:border-violet-500/40 bg-white/[0.02]"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="h-10 w-10 rounded-xl bg-violet-600/20 flex items-center justify-center mb-2">
                        <ImageIcon className="h-5 w-5 text-violet-400" />
                      </div>
                      <p className="text-xs font-semibold text-white">Upload Person Image</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Upload a clear image of the person
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2">JPG • PNG • WEBP</p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950/60 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreviewUrl || ""}
                          alt="Person Preview"
                          className="h-12 w-12 rounded-xl object-cover ring-1 ring-violet-500/40"
                        />
                        <div>
                          <p className="text-xs font-medium text-white truncate max-w-[180px]">
                            {imageFile.name}
                          </p>
                          <p className="text-[10px] text-cyan-400">Portrait Image Ready</p>
                        </div>
                      </div>
                      <button
                        onClick={removeImageFile}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Voice Source Options below image */}
                  <div className="pt-2 border-t border-white/[0.08]">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Voice Source
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "original", label: "Original Speaker Voice" },
                        { id: "profile", label: "Voice Profile" },
                        { id: "upload", label: "Upload Voice" },
                        { id: "record", label: "Record Voice" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setVoiceSourceOption(item.id as any);
                            if (item.id === "record") setActiveInputTab("record_voice");
                          }}
                          className={`p-2.5 rounded-xl text-[11px] font-medium text-left border transition-all ${
                            voiceSourceOption === item.id
                              ? "bg-violet-600/20 border-violet-500/50 text-cyan-300"
                              : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 11: TEXT INPUT */}
              {activeInputTab === "type_text" && (
                <div className="flex flex-col gap-2.5">
                  <div className="relative">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={5}
                      placeholder="Type what you want the person to say..."
                      className="w-full p-3.5 rounded-xl text-xs bg-slate-950/70 border border-white/[0.1] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <div className="flex items-center gap-3">
                      <span>
                        Words:{" "}
                        <strong className="text-slate-200">
                          {textInput.trim() ? textInput.trim().split(/\s+/).length : 0}
                        </strong>
                      </span>
                      <span>
                        Characters:{" "}
                        <strong className="text-slate-200">{textInput.length}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTextInput("")}
                        className="px-2 py-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const clipboard = await navigator.clipboard.readText();
                          setTextInput((prev) => prev + clipboard);
                        }}
                        className="px-2 py-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        Paste
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(textInput)}
                        className="px-2 py-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 12: VOICE RECORDING */}
              {activeInputTab === "record_voice" && (
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/50 border border-white/[0.06] text-center">
                  {/* Large Microphone Button */}
                  <div className="relative mb-4">
                    {recordingState === "recording" && (
                      <span className="absolute -inset-2 rounded-full bg-red-500/20 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (recordingState === "ready" || recordingState === "recorded") {
                          startRecording();
                        } else if (recordingState === "recording") {
                          stopRecording();
                        }
                      }}
                      className={`relative h-20 w-20 rounded-full flex items-center justify-center shadow-xl transition-all ${
                        recordingState === "recording"
                          ? "bg-red-500 text-white shadow-red-500/40 scale-105"
                          : recordingState === "paused"
                          ? "bg-amber-500 text-white shadow-amber-500/40"
                          : "bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-indigo-500/30 hover:scale-105"
                      }`}
                    >
                      <Mic className="h-8 w-8" />
                    </button>
                  </div>

                  {/* Timer & Status */}
                  <div className="mb-4">
                    <span className="text-xl font-mono font-bold text-white tracking-wider">
                      {formatTimer(recordingTime)}
                    </span>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">
                      {recordingState === "recording"
                        ? "Recording Audio..."
                        : recordingState === "paused"
                        ? "Recording Paused"
                        : recordingState === "recorded"
                        ? "Voice Recorded Ready"
                        : "Ready to Record"}
                    </p>
                  </div>

                  {/* Waveform Visualization */}
                  <div className="flex items-center justify-center gap-1.5 h-8 mb-5">
                    {[16, 28, 12, 34, 20, 36, 14, 26, 32, 18, 30, 22].map((height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${
                          recordingState === "recording"
                            ? "bg-cyan-400 wave-bar"
                            : "bg-slate-700 h-2"
                        }`}
                        style={{
                          height: recordingState === "recording" ? `${height}px` : "6px",
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Recording Control Buttons */}
                  <div className="flex items-center gap-2">
                    {recordingState === "ready" && (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-4 py-2 rounded-xl text-xs font-semibold btn-gradient-primary"
                      >
                        Start Recording
                      </button>
                    )}

                    {recordingState === "recording" && (
                      <>
                        <button
                          type="button"
                          onClick={pauseRecording}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                        >
                          Pause
                        </button>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white"
                        >
                          Stop
                        </button>
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {recordingState === "paused" && (
                      <>
                        <button
                          type="button"
                          onClick={resumeRecording}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-violet-600 text-white"
                        >
                          Resume
                        </button>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-500 text-white"
                        >
                          Stop
                        </button>
                      </>
                    )}

                    {recordingState === "recorded" && (
                      <div className="flex items-center gap-2">
                        {voicePreviewUrl && (
                          <audio controls src={voicePreviewUrl} className="h-8 max-w-[200px]" />
                        )}
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete voice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInputTab("use_image");
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        >
                          Use Voice
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 13: TRANSLATION SETTINGS */}
            <div className="saas-card p-6 border border-white/[0.08]">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600/30 text-violet-300 text-[11px] font-bold">
                  2
                </span>
                <h2 className="text-sm font-bold text-white">Translation Settings</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Choose languages and voice options.
              </p>

              {/* Language Selection Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                    Source Language
                  </label>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/70 border border-white/[0.1] text-slate-100 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="auto">Auto Detect</option>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={`src-${lang.code}`} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                    Target Language
                  </label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/70 border border-white/[0.1] text-slate-100 focus:outline-none focus:border-violet-500/50"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={`tgt-${lang.code}`} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 14: VOICE SETTINGS */}
              <div className="pt-3 border-t border-white/[0.08] space-y-3">
                <label className="block text-[11px] font-medium text-slate-300">
                  Voice Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoiceOption("original")}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      voiceOption === "original"
                        ? "bg-violet-600/20 border-violet-500/50 text-cyan-300"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Original Speaker Voice</span>
                      <Info className="h-3 w-3 text-cyan-400 shrink-0" />
                    </div>
                    <span className="text-[9px] text-cyan-300 font-bold block mt-1">
                      (Recommended)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceOption("profile")}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      voiceOption === "profile"
                        ? "bg-violet-600/20 border-violet-500/50 text-cyan-300"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-semibold block">Voice Profile</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {voiceProfiles.length} available
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceOption("natural")}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      voiceOption === "natural"
                        ? "bg-violet-600/20 border-violet-500/50 text-cyan-300"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-semibold block">AI Natural Voice</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Studio Neural</span>
                  </button>
                </div>

                {/* If Voice Profile selected, show dropdown */}
                {voiceOption === "profile" && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Select Voice Profile
                    </label>
                    <select
                      value={selectedVoiceProfileId}
                      onChange={(e) => setSelectedVoiceProfileId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/70 border border-white/[0.1] text-slate-100"
                    >
                      {voiceProfiles.map((vp) => (
                        <option key={vp.id} value={vp.id}>
                          {vp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Preservation Checkbox with Tooltip */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-950/20 border border-violet-500/20">
                  <input
                    type="checkbox"
                    id="preserve-voice"
                    checked={preserveOriginalVoice}
                    onChange={(e) => setPreserveOriginalVoice(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-violet-600 focus:ring-violet-500"
                  />
                  <div className="text-xs">
                    <label
                      htmlFor="preserve-voice"
                      className="font-medium text-white cursor-pointer select-none"
                    >
                      Preserve original speaker&apos;s voice
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Use the authorized speaker&apos;s voice characteristics for the translated speech.
                    </p>
                  </div>
                </div>

                {/* Speaker Consent Checkbox */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                  <input
                    type="checkbox"
                    id="consent-confirm"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-cyan-500 focus:ring-cyan-400"
                  />
                  <label
                    htmlFor="consent-confirm"
                    className="text-[11px] text-slate-300 cursor-pointer select-none"
                  >
                    I confirm that I have explicit authorization and consent to synthesize this speaker&apos;s voice and visual likeness.
                  </label>
                </div>

                {/* SECTION 15: VOICE SPEED */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-300">
                      Voice Speed
                    </label>
                    <span className="text-[11px] font-semibold text-cyan-400">
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
                  <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-slate-950/60 border border-white/[0.06]">
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
                        className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          voiceSpeed === item.val
                            ? "bg-violet-600 text-white font-bold shadow-sm"
                            : "text-slate-400 hover:text-white"
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
          {/* RIGHT COLUMN: 60% (lg:col-span-7) - PREVIEW & OUTPUT */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* SECTION 16 & 17: PREVIEW & OUTPUT */}
            <div className="saas-card p-6 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600/30 text-violet-300 text-[11px] font-bold">
                      3
                    </span>
                    <h2 className="text-sm font-bold text-white">Preview & Output</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Original and translated video will appear here.
                  </p>
                </div>
              </div>

              {/* DUAL VIDEO CARDS SIDE-BY-SIDE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* LEFT: Original Video */}
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950/70 flex flex-col">
                  <div className="p-2.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <span className="text-xs font-semibold text-slate-200">Original Video</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Detected: {detectedLanguage ? getLanguageByCode(detectedLanguage)?.name : "Tamil"}
                    </span>
                  </div>

                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {videoPreviewUrl ? (
                      <video
                        ref={originalVideoRef}
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-full object-contain"
                        onPlay={() => setIsOrigPlaying(true)}
                        onPause={() => setIsOrigPlaying(false)}
                      />
                    ) : imagePreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreviewUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-6 text-slate-600">
                        <FileVideo className="h-10 w-10 mb-2 opacity-50" />
                        <span className="text-xs font-medium">No original video uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Translated Video */}
                <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/70 flex flex-col shadow-lg shadow-cyan-500/5">
                  <div className="p-2.5 border-b border-white/10 flex items-center justify-between bg-cyan-950/20">
                    <span className="text-xs font-semibold text-cyan-300">Translated Video</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
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
                        className="w-full h-full object-contain"
                        onPlay={() => setIsTransPlaying(true)}
                        onPause={() => setIsTransPlaying(false)}
                      />
                    ) : isProcessing ? (
                      <div className="flex flex-col items-center justify-center text-center p-6 text-cyan-300 animate-pulse">
                        <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
                        <span className="text-xs font-semibold">Generating your translated video...</span>
                        <span className="text-[10px] text-slate-400 mt-1">{progressPercent}% complete</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-6 text-slate-600">
                        <Video className="h-10 w-10 mb-2 opacity-50" />
                        <span className="text-xs font-medium">Translated output will display here</span>
                      </div>
                    )}
                  </div>

                  {finalVideoUrl && (
                    <div className="p-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">MP4 • 720p H.264</span>
                      <a
                        href={finalVideoUrl}
                        download={`translated-${targetLanguage}.mp4`}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 18 & 19: OUTPUT TABS */}
              <div className="border-t border-white/[0.08] pt-4">
                <div className="flex items-center gap-2 mb-4 border-b border-white/[0.08] pb-2">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        activeOutputTab === tab.id
                          ? "bg-violet-600/30 text-cyan-300 border border-violet-500/40 font-semibold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab: Transcript & Translation Side-by-Side */}
                {activeOutputTab === "transcript" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* LEFT: Original Transcript */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.08]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300">
                          Original Transcript ({detectedLanguage ? getLanguageByCode(detectedLanguage)?.name : "Tamil"})
                        </span>
                        {transcriptText && (
                          <button
                            onClick={() => copyText(transcriptText)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Copy transcript"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[60px]">
                        {transcriptText || "நான் இன்று கல்லூரிக்கு செல்கிறேன்."}
                      </p>
                    </div>

                    {/* RIGHT: Translated Text */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-cyan-300">
                          Translated Text ({getLanguageByCode(targetLanguage)?.name || "English"})
                        </span>
                        {translatedText && (
                          <button
                            onClick={() => copyText(translatedText)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Copy translation"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans min-h-[60px]">
                        {translatedText || "I am going to college today."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab: Translation Only */}
                {activeOutputTab === "translation" && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.08]">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {translatedText || "I am going to college today."}
                    </p>
                  </div>
                )}

                {/* Tab: Subtitles */}
                {activeOutputTab === "subtitles" && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.08] font-mono text-xs text-slate-300 space-y-2">
                    <p className="text-slate-500">1</p>
                    <p className="text-cyan-400">00:00:00,500 --&gt; 00:00:02,800</p>
                    <p>{translatedText || "I am going to college today."}</p>
                  </div>
                )}

                {/* Tab: Details */}
                {activeOutputTab === "details" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.08]">
                      <span className="text-[10px] text-slate-400 block">Video Codec</span>
                      <span className="font-semibold text-slate-200">H.264 (AVC)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.08]">
                      <span className="text-[10px] text-slate-400 block">Audio Codec</span>
                      <span className="font-semibold text-slate-200">AAC (Stereo 192k)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.08]">
                      <span className="text-[10px] text-slate-400 block">Sample Rate</span>
                      <span className="font-semibold text-slate-200">44,100 Hz</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.08]">
                      <span className="text-[10px] text-slate-400 block">Sync Model</span>
                      <span className="font-semibold text-cyan-400">Voxora Visual-Sync</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 20: PROCESSING STATUS CARD (FULL-WIDTH AT BOTTOM) */}
        <div className="saas-card p-6 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Processing Status</h3>
            </div>
            {isProcessing && (
              <span className="text-xs font-semibold text-cyan-400">{progressPercent}%</span>
            )}
          </div>

          {/* Stepper Timeline with 9 Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {stepsTimeline.map((step, idx) => {
              const Icon = step.icon;
              const status = getStepStatus(step.key, idx);

              return (
                <div
                  key={step.key}
                  className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                    status === "completed"
                      ? "bg-violet-950/30 border-violet-500/40 text-violet-200"
                      : status === "in_progress"
                      ? "bg-cyan-950/30 border-cyan-400/60 text-cyan-200 ring-2 ring-cyan-400/20"
                      : "bg-white/[0.02] border-white/[0.05] text-slate-500"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${
                      status === "completed"
                        ? "bg-violet-600 text-white"
                        : status === "in_progress"
                        ? "bg-cyan-500 text-slate-950 animate-bounce"
                        : "bg-white/[0.05] text-slate-600"
                    }`}
                  >
                    {status === "completed" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold truncate w-full mb-1">
                    {step.label}
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold ${
                      status === "completed"
                        ? "text-violet-400"
                        : status === "in_progress"
                        ? "text-cyan-400"
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

        {/* SECTION 21: MAIN ACTION BUTTON ROW */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400">
            Output is digitally labeled with <code className="text-cyan-400">AI-generated voice &amp; video</code> for transparency.
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 btn-gradient-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

        {/* SECTION 22, 23, 24: SUPPLEMENTARY WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* SECTION 22: RECENT PROJECTS WIDGET */}
          <div className="saas-card p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Projects
              </h4>
              <a href="/projects" className="text-[11px] text-cyan-400 hover:underline">
                View All
              </a>
            </div>
            <div className="space-y-2.5">
              {recentProjects.map((p) => (
                <a
                  key={p.id}
                  href={`/projects`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] border border-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 shrink-0">
                      <FileVideo className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {p.srcLang} → {p.tgtLang} • {p.duration}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* SECTION 23: QUICK TIPS CARD */}
          <div className="saas-card p-5 border border-white/[0.08]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Quick Tips
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              {[
                "Upload a clear video with a visible face.",
                "Select source and target languages.",
                "Select the original or authorized voice profile.",
                "Click Translate & Generate.",
                "Download your translated video.",
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="flex h-4 w-4 rounded-full bg-violet-600/40 text-cyan-300 text-[10px] font-bold items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-300 leading-snug">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 24: SUPPORTED LANGUAGES CARD */}
          <div className="saas-card p-5 border border-white/[0.08]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Supported Languages
            </h4>
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
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:border-violet-500/40 hover:text-white transition-colors"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS MODAL */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg saas-card p-6 border border-violet-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-600/20 text-cyan-400">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">How AI Video Translation Works</h3>
                  <p className="text-xs text-slate-400">Autonomous Multimodal Pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 my-4 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <strong className="text-cyan-300 block mb-0.5">1. Multimodal Audio Extraction</strong>
                Your speaking video is ingested and the raw speech track is extracted at 16kHz studio fidelity.
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <strong className="text-violet-300 block mb-0.5">2. High-Accuracy Transcription & Translation</strong>
                Whisper transcribes speech into Unicode text, detects the language, and translates to your chosen target language.
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <strong className="text-cyan-300 block mb-0.5">3. Same-Speaker Voice Synthesis</strong>
                The translated text is spoken using authorized timbre and voice characteristics matching the original speaker.
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <strong className="text-violet-300 block mb-0.5">4. Lip-Synchronization & MP4 Rendering</strong>
                The original video visuals are matched with the translated speech track and exported into standard H.264 MP4.
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold btn-gradient-primary"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
