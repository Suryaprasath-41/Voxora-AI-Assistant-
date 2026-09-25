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

  useEffect(() => {
    let ignore = false;
    if (status === "authenticated") {
      fetch("/api/projects?limit=6")
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (!ignore) {
            setProjects(data.projects || []);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load projects", err);
          if (!ignore) setLoading(false);
        });
    }
    return () => {
      ignore = true;
    };
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

  const userName = session?.user?.name || "Maddy";

  return (
    <AppLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#F4F7FC] min-h-screen text-[#17233C] flex flex-col gap-8">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-2xl bg-[#08162B] border border-white/10 p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Glowing gradient background accents */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#5B35F5]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#35D6FF]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Left: Title & Subtitle */}
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#35D6FF] uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#35D6FF]" />
              <span>AI Multilingual Voice Studio</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white">
                Pro
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Welcome back, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Record, transcribe, translate, and synthesize lifelike speech and video across 30+ languages.
            </p>
          </div>

          {/* Right: Waveforms & CTA */}
          <div className="relative z-10 flex items-center gap-4 shrink-0">
            {/* Waveform graphic */}
            <div className="hidden lg:flex items-center gap-1 h-8 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              {[14, 28, 20, 32, 16, 24, 18, 30, 12, 26, 18, 22].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-[#5B35F5] to-[#35D6FF] rounded-full animate-pulse"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>

            <Link
              href="/workspace?tab=voice"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#5B35F5] via-[#268CFF] to-[#35D6FF] hover:scale-[1.02] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#5B35F5]/30 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Studio Session</span>
            </Link>
          </div>
        </div>

        {/* 4 LARGE QUICK ACTION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Record Voice */}
          <Link
            href="/workspace?tab=voice"
            className="group relative rounded-2xl bg-white p-6 border border-[#D9E2F0] hover:border-[#5B35F5] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between h-48 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5B35F5]/10 text-[#5B35F5] group-hover:scale-105 transition-transform">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17233C] group-hover:text-[#5B35F5] transition-colors flex items-center justify-between">
                <span>Record Voice</span>
                <ChevronRight className="h-4 w-4 text-[#61708A] group-hover:text-[#5B35F5] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-[#61708A] mt-1 leading-relaxed">
                Upload or record speech directly with live audio waveform.
              </p>
            </div>
          </Link>

          {/* Card 2: Translate */}
          <Link
            href="/workspace?tab=text"
            className="group relative rounded-2xl bg-white p-6 border border-[#D9E2F0] hover:border-[#268CFF] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between h-48 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#268CFF]/10 text-[#268CFF] group-hover:scale-105 transition-transform">
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17233C] group-hover:text-[#268CFF] transition-colors flex items-center justify-between">
                <span>Translate</span>
                <ChevronRight className="h-4 w-4 text-[#61708A] group-hover:text-[#268CFF] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-[#61708A] mt-1 leading-relaxed">
                Translate text or speech preserving tone and context.
              </p>
            </div>
          </Link>

          {/* Card 3: Type Text */}
          <Link
            href="/workspace?tab=text"
            className="group relative rounded-2xl bg-white p-6 border border-[#D9E2F0] hover:border-[#5B35F5] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between h-48 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5B35F5]/10 text-[#5B35F5] group-hover:scale-105 transition-transform">
              <Keyboard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17233C] group-hover:text-[#5B35F5] transition-colors flex items-center justify-between">
                <span>Type Text</span>
                <ChevronRight className="h-4 w-4 text-[#61708A] group-hover:text-[#5B35F5] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-[#61708A] mt-1 leading-relaxed">
                Write text, translate, and synthesize natural speech.
              </p>
            </div>
          </Link>

          {/* Card 4: Voice Studio */}
          <Link
            href="/studio"
            className="group relative rounded-2xl bg-white p-6 border border-[#D9E2F0] hover:border-emerald-500 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between h-48 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-transform">
              <AudioWaveform className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17233C] group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                <span>Voice Studio</span>
                <ChevronRight className="h-4 w-4 text-[#61708A] group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-[#61708A] mt-1 leading-relaxed">
                Create and manage authorized voice profiles with consent.
              </p>
            </div>
          </Link>
        </div>

        {/* AI VIDEO TRANSLATOR BANNER */}
        <div className="rounded-2xl bg-[#08162B] border border-white/10 p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#35D6FF]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#5B35F5] to-[#268CFF] text-white shadow-md shadow-[#5B35F5]/30">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white">
                  Featured
                </span>
                <span className="text-sm font-bold text-white">AI Video Translator</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Translate speaking videos or generate realistic talking person videos in 30+ languages with synchronized lip movement and authorized same-speaker voice preservation.
              </p>
            </div>
          </div>

          <Link
            href="/video"
            className="shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35F5] via-[#268CFF] to-[#35D6FF] hover:scale-[1.02] text-white font-bold text-xs shadow-md shadow-[#5B35F5]/25 transition-all relative z-10"
          >
            <span>Launch Video Translator</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* RECENT PROJECTS LIST */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B35F5]/10 text-[#5B35F5] text-xs font-bold">
                <FolderGit2 className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-bold text-[#17233C]">Recent Projects</h2>
            </div>
            <Link
              href="/projects"
              className="text-xs font-bold text-[#5B35F5] hover:underline flex items-center gap-1 transition-colors"
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
                  className="rounded-2xl bg-white p-5 border border-[#D9E2F0] animate-pulse h-36 shadow-sm"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center border border-[#D9E2F0] shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B35F5]/10 mx-auto mb-3 text-[#5B35F5]">
                <FolderGit2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-[#17233C] mb-1">
                No projects yet
              </h3>
              <p className="text-xs text-[#61708A] max-w-sm mx-auto mb-4">
                Start by recording your voice, typing a sentence, or uploading a video file.
              </p>
              <Link
                href="/workspace?tab=voice"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-xs font-bold text-white shadow-md shadow-[#5B35F5]/25 transition-all"
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
                    className="rounded-2xl bg-white p-5 border border-[#D9E2F0] hover:border-[#5B35F5]/50 hover:shadow-md transition-all flex flex-col justify-between relative group shadow-sm"
                  >
                    <div>
                      {/* Title and delete */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-[#17233C] group-hover:text-[#5B35F5] transition-colors line-clamp-1">
                          {project.title}
                        </h4>
                        <button
                          onClick={(e) => handleDelete(project.id, e)}
                          disabled={deletingId === project.id}
                          className="p-1.5 rounded-lg text-[#61708A] hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Language pair */}
                      <div className="flex items-center gap-2 text-xs text-[#61708A] mb-3">
                        <span className="font-semibold text-[#17233C]">
                          {src.name}
                        </span>
                        <span>→</span>
                        <span className="font-bold text-[#5B35F5]">
                          {tgt.name}
                        </span>
                      </div>

                      {/* Type and status badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F4F7FC] text-[#17233C] border border-[#D9E2F0] font-semibold flex items-center gap-1">
                          <Mic className="h-2.5 w-2.5 text-[#5B35F5]" />
                          <span className="capitalize">{project.type} Translation</span>
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-2.5 w-2.5 text-amber-600" />
                          )}
                          <span>{project.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom date and open button */}
                    <div className="flex items-center justify-between border-t border-[#D9E2F0] pt-3 mt-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#61708A]">
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
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#5B35F5] hover:underline"
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
