"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  FileAudio,
  FileVideo,
  Play,
  Pause,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export function FileUploader({
  onFileSelected,
  selectedFile,
  onClear,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDuration, setFileDuration] = useState<number | null>(null);

  const MAX_SIZE_MB = 50;
  const ALLOWED_EXTS = [
    "mp3",
    "wav",
    "m4a",
    "aac",
    "flac",
    "ogg",
    "webm",
    "mp4",
  ];

  const validateAndSetFile = (file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTS.includes(ext)) {
      setError(
        "This audio format is not supported. Please upload MP3, WAV, M4A, AAC, FLAC, OGG, MP4, or WebM."
      );
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Your file exceeds the maximum allowed size of ${MAX_SIZE_MB}MB.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Read audio duration
    const tempAudio = new Audio();
    tempAudio.src = url;
    tempAudio.onloadedmetadata = () => {
      setFileDuration(tempAudio.duration);
    };

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const togglePreviewPlay = () => {
    if (!audioPreviewRef.current) return;
    if (isPlaying) {
      audioPreviewRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPreviewRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (secs: number | null) => {
    if (!secs || isNaN(secs)) return "--:--";
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const isVideo = selectedFile?.type.includes("video") || selectedFile?.name.endsWith(".mp4");

  return (
    <div className="w-full flex flex-col items-center">
      {error && (
        <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragOver
              ? "border-cyan-400 bg-cyan-500/10 scale-[0.99]"
              : "border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.webm,.mp4"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
            <UploadCloud className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-slate-400 text-center max-w-xs mb-3">
            Supports MP3, WAV, M4A, AAC, FLAC, OGG, WebM, and MP4 video (up to 50MB)
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Automatic speech extraction for video</span>
          </div>
        </div>
      ) : (
        /* Selected file card (Section 10: Filename, Duration, File size, Play, Remove) */
        <div className="w-full rounded-2xl glass-panel p-5 border border-white/15 shadow-xl">
          {previewUrl && (
            <audio
              ref={audioPreviewRef}
              src={previewUrl}
              onEnded={() => setIsPlaying(false)}
            />
          )}

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {isVideo ? (
                  <FileVideo className="h-5 w-5 text-purple-400" />
                ) : (
                  <FileAudio className="h-5 w-5 text-cyan-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-xs">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span>Duration: {formatDuration(fileDuration)}</span>
                  {isVideo && (
                    <>
                      <span>•</span>
                      <span className="text-purple-300">Video Speech Extractor</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (audioPreviewRef.current) audioPreviewRef.current.pause();
                setIsPlaying(false);
                setPreviewUrl(null);
                setFileDuration(null);
                onClear();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Simple waveform bar representation */}
          <div className="h-10 bg-slate-950/60 rounded-xl px-3 flex items-center justify-center gap-1 border border-white/5 mb-4">
            {[6, 12, 24, 40, 60, 80, 50, 30, 45, 75, 90, 65, 40, 25, 50, 70, 85, 45, 20, 10].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full ${
                  isPlaying ? "bg-cyan-400 wave-bar" : "bg-white/20"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={togglePreviewPlay}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-medium transition-colors"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              <span>{isPlaying ? "Pause Preview" : "Play Preview"}</span>
            </button>

            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Ready for Processing</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
