"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  ShieldAlert,
  Sparkles,
  FastForward,
} from "lucide-react";

interface StudioAudioPlayerProps {
  src: string;
  title?: string;
  isClonedVoice?: boolean;
  onEnded?: () => void;
}

export function StudioAudioPlayer({
  src,
  title = "Synthesized Voice Output",
  isClonedVoice = false,
  onEnded,
}: StudioAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  // Draw simulated waveform bars on canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barCount = 64;
    const barWidth = 3;
    const gap = (width - barCount * barWidth) / (barCount - 1);
    const progress = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap);
      // Normalized wave pattern
      const angle = (i / barCount) * Math.PI * 4;
      const waveHeight = (Math.sin(angle) * 0.35 + 0.45) * height * (0.4 + (i % 3) * 0.2);
      const y = (height - waveHeight) / 2;

      const isPlayed = i / barCount <= progress;

      if (isPlayed) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#06b6d4");
        gradient.addColorStop(1, "#6366f1");
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, waveHeight, 2);
      ctx.fill();
    }
  }, [currentTime, duration]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onAudioEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onAudioEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onAudioEnded);
    };
  }, [onEnded]);

  // Update src safely
  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setIsSpeedOpen(false);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `voxora-audio-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full rounded-2xl glass-panel p-4 sm:p-5 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Top Header / Badges */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 truncate">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-cyan-400 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-white truncate">{title}</span>
        </div>

        {/* Safety watermark label (Section 2) */}
        {isClonedVoice ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-bold text-purple-300">
            <ShieldAlert className="h-3 w-3 text-purple-400" />
            <span>AI-generated voice</span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
            Neural Studio Output
          </div>
        )}
      </div>

      {/* Waveform Canvas */}
      <div className="relative w-full h-12 bg-slate-950/60 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center mb-3">
        <canvas
          ref={canvasRef}
          width={500}
          height={48}
          className="w-full h-full cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            if (audioRef.current && duration > 0) {
              audioRef.current.currentTime = pct * duration;
            }
          }}
        />
      </div>

      {/* Progress slider and time */}
      <div className="space-y-1 mb-3">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
        {/* Left: Play/Pause */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/25 transition-transform active:scale-95"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Volume Slider */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
        </div>

        {/* Right: Playback Speed & Download Button */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setIsSpeedOpen(!isSpeedOpen)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-200 flex items-center gap-1 transition-colors"
              title="Playback speed"
            >
              <FastForward className="h-3 w-3 text-cyan-400" />
              <span>{playbackRate}x</span>
            </button>

            {isSpeedOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-20 rounded-xl glass-panel p-1 shadow-xl z-20 border border-white/15">
                {speedOptions.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changeSpeed(rate)}
                    className={`w-full text-center px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                      playbackRate === rate
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download Button (Section 15 & 22) */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all shadow-sm"
            title="Download MP3"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
