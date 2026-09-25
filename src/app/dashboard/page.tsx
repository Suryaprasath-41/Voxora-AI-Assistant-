"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Mic,
  Globe2,
  Keyboard,
  AudioWaveform,
  Plus,
  ArrowRight,
  FolderGit2,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Video,
} from "lucide-react";
import { getLanguageByCode } from "@/lib/languages";

interface ProjectItem {
  id: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects?limit=5");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadProjects();
    }
  }, [status]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this project?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeletingId(null);
    }
  };

  const userName = session?.user?.name || "Creator";

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Multilingual Voice Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Record, transcribe, translate, and synthesize lifelike speech across 30+ languages.
            </p>
          </div>

          <Link
            href="/workspace?tab=voice"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Studio Session</span>
          </Link>
        </div>

        {/* 4 Large Quick Action Cards (Section 49) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {/* Card 1: Record Voice */}
          <Link
            href="/workspace?tab=voice"
            className="group relative rounded-2xl glass-panel p-6 border border-white/10 glass-panel-hover overflow-hidden flex flex-col justify-between h-48"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Mic className="h-20 w-20 text-cyan-400" />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                <span>Record Voice</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Upload or record speech directly with live audio waveform.
              </p>
            </div>
          </Link>

          {/* Card 2: Translate */}
          <Link
            href="/workspace?tab=text"
            className="group relative rounded-2xl glass-panel p-6 border border-white/10 glass-panel-hover overflow-hidden flex flex-col justify-between h-48"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe2 className="h-20 w-20 text-indigo-400" />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                <span>Translate</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Translate text or speech preserving tone and context.
              </p>
            </div>
          </Link>

          {/* Card 3: Type Text */}
          <Link
            href="/workspace?tab=text"
            className="group relative rounded-2xl glass-panel p-6 border border-white/10 glass-panel-hover overflow-hidden flex flex-col justify-between h-48"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Keyboard className="h-20 w-20 text-purple-400" />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Keyboard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                <span>Type Text</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Write text, translate, and synthesize natural speech.
              </p>
            </div>
          </Link>

          {/* Card 4: Voice Studio */}
          <Link
            href="/studio"
            className="group relative rounded-2xl glass-panel p-6 border border-white/10 glass-panel-hover overflow-hidden flex flex-col justify-between h-48"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AudioWaveform className="h-20 w-20 text-emerald-400" />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <AudioWaveform className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                <span>Voice Studio</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Create and manage authorized voice profiles with consent.
              </p>
            </div>
          </Link>
        </div>

        {/* NEW MAIN FEATURE BANNER: AI VIDEO TRANSLATOR */}
        <div className="rounded-2xl glass-panel p-6 border border-cyan-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-cyan-950/40 mb-12 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  New Feature
                </span>
                <span className="text-xs font-bold text-white">AI Video Translator</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Translate speaking videos or generate realistic talking person videos in 30+ languages with synchronized lip movement and authorized same-speaker voice preservation.
              </p>
            </div>
          </div>

          <Link
            href="/video"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition-all"
          >
            <span>Launch Video Translator</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* RECENT PROJECTS LIST (Section 7 & Section 50) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Recent Projects</h2>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View All Projects</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl glass-panel p-5 border border-white/5 animate-pulse h-36"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl glass-panel p-8 text-center border border-white/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 mx-auto mb-3 text-slate-400">
                <FolderGit2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                No projects yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Start by recording your voice, typing a sentence, or uploading an audio file.
              </p>
              <Link
                href="/workspace?tab=voice"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                <Mic className="h-3.5 w-3.5" />
                <span>Create First Project</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const src = getLanguageByCode(project.sourceLanguage);
                const tgt = getLanguageByCode(project.targetLanguage);
                const isCompleted = project.status === "COMPLETED";

                return (
                  <div
                    key={project.id}
                    className="rounded-2xl glass-panel p-5 border border-white/10 glass-panel-hover flex flex-col justify-between relative group"
                  >
                    <div>
                      {/* Title and delete */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {project.title}
                        </h4>
                        <button
                          onClick={(e) => handleDelete(project.id, e)}
                          disabled={deletingId === project.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Language pair */}
                      <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
                        <span className="font-medium text-slate-200">
                          {src.name}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="font-medium text-cyan-400">
                          {tgt.name}
                        </span>
                      </div>

                      {/* Type and status badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                          <Mic className="h-2.5 w-2.5 text-cyan-400" />
                          <span className="capitalize">{project.type} Translation</span>
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <AlertCircle className="h-2.5 w-2.5" />
                          )}
                          <span>{project.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom date and open button */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(project.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <Link
                        href={`/workspace?projectId=${project.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        <span>Open</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
