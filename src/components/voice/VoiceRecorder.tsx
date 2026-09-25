"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  Volume2,
} from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, liveTranscript?: string) => void;
  sourceLanguage: string;
}

export function VoiceRecorder({
  onRecordingComplete,
  sourceLanguage,
}: VoiceRecorderProps) {
  const [recorderState, setRecorderState] = useState<
    "ready" | "recording" | "paused" | "completed"
  >("ready");
  const [duration, setDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<unknown>(null);

  // Clean up streams & audio context on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Format seconds into 00:00:00
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Live audio visualizer loop
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 36;
      const barWidth = 4;
      const gap = (canvas.width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * 2] || 0;
        const percent = value / 255;
        const height = Math.max(4, percent * canvas.height * 0.9);
        const x = i * (barWidth + gap);
        const y = (canvas.height - height) / 2;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#06b6d4");
        gradient.addColorStop(0.5, "#8b5cf6");
        gradient.addColorStop(1, "#6366f1");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 2);
        ctx.fill();
      }
    };

    render();
  }, []);

  // Start recording
  const startRecording = async () => {
    setPermissionError(null);
    setLiveTranscript("");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Web Audio API analyzer
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      drawVisualizer();

      // Browser Speech Recognition for real-time accuracy if available
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const recognizer = new (SpeechRecognition as any)();
          recognizer.continuous = true;
          recognizer.interimResults = true;
          if (sourceLanguage && sourceLanguage !== "auto") {
            recognizer.lang = sourceLanguage === "ta" ? "ta-IN" : sourceLanguage === "hi" ? "hi-IN" : sourceLanguage;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognizer.onresult = (event: any) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript + " ";
            }
            setLiveTranscript(transcript.trim());
          };
          recognizer.start();
          speechRecognitionRef.current = recognizer;
        } catch {
          // ignore optional recognizer error
        }
      }

      // MediaRecorder initialization
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        setRecorderState("completed");

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      recorder.start(250); // collect 250ms chunks
      setRecorderState("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setPermissionError(
        "Microphone access was denied. Please allow microphone access and try again."
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecorderState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      setRecorderState("recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (speechRecognitionRef.current && (speechRecognitionRef.current as any).stop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (speechRecognitionRef.current as any).stop();
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (speechRecognitionRef.current && (speechRecognitionRef.current as any).abort) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (speechRecognitionRef.current as any).abort();
    }

    setRecorderState("ready");
    setDuration(0);
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    setLiveTranscript("");
  };

  const handleUseRecording = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, liveTranscript);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      {/* Permission alert if denied */}
      {permissionError && (
        <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Recording States Display */}
      {recorderState === "ready" && (
        <div className="flex flex-col items-center py-6">
          <button
            onClick={startRecording}
            className="group relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-1 shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            title="Click to start recording"
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950/80 group-hover:bg-slate-900/60 transition-colors">
              <Mic className="h-12 w-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </button>
          <p className="mt-4 text-sm font-semibold text-white">
            Click to Start Recording
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Microphone ready. Speak clearly into your device in any language.
          </p>
        </div>
      )}

      {(recorderState === "recording" || recorderState === "paused") && (
        <div className="flex flex-col items-center w-full py-4">
          {/* Animated Waveform Visualizer Canvas */}
          <div className="w-full h-20 bg-slate-950/60 rounded-2xl border border-white/10 mb-4 overflow-hidden flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              width={380}
              height={70}
              className="w-full h-full"
            />
          </div>

          {/* Timer: 00:00:00 (Section 9) */}
          <div className="flex items-center gap-2 font-mono text-2xl font-bold text-white mb-2">
            <div
              className={`h-3 w-3 rounded-full ${
                recorderState === "recording"
                  ? "bg-red-500 animate-ping"
                  : "bg-amber-400"
              }`}
            />
            <span>{formatTime(duration)}</span>
          </div>

          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
            {recorderState === "recording" ? "Recording in progress..." : "Paused"}
          </span>

          {/* Live speech preview if supported */}
          {liveTranscript && (
            <div className="w-full p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 mb-6 text-left line-clamp-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">Live Detection:</span>
              &quot;{liveTranscript}&quot;
            </div>
          )}

          {/* Action Buttons (Section 9: Start, Pause, Resume, Stop, Cancel) */}
          <div className="flex items-center gap-3">
            {recorderState === "recording" ? (
              <button
                onClick={pauseRecording}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-semibold transition-all"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
              >
                <Play className="h-4 w-4" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-red-500/20 transition-all"
            >
              <Square className="h-4 w-4 fill-white" />
              <span>Stop</span>
            </button>

            <button
              onClick={cancelRecording}
              className="px-3 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {recorderState === "completed" && recordedAudioUrl && (
        <div className="flex flex-col items-center w-full py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Check className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            Voice Recording Captured
          </h4>
          <p className="text-xs text-slate-400 font-mono mb-4">
            Duration: {formatTime(duration)}
          </p>

          {/* Audio preview player */}
          <div className="w-full max-w-sm mb-6">
            <audio src={recordedAudioUrl} controls className="w-full h-10 rounded-lg" />
          </div>

          {/* Action buttons (Section 9: Play recording, Delete, Use recording) */}
          <div className="flex items-center gap-3">
            <button
              onClick={cancelRecording}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Record Again</span>
            </button>

            <button
              onClick={handleUseRecording}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-xl shadow-indigo-500/20 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Use Recording</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
