"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { getLanguageByCode } from "@/lib/languages";
import {
  FolderGit2,
  Search,
  Trash2,
  Copy,
  Edit2,
  ExternalLink,
  Clock,
  Mic,
  Languages,
  Keyboard,
  FileAudio,
  X,
  Video,
  Sparkles,
  Plus,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  transcripts?: { originalText: string }[];
  translations?: { translatedText: string }[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL("/api/projects", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (selectedType !== "all") url.searchParams.set("type", selectedType);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this project?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        await fetchProjects();
      }
    } catch (err) {
      console.error("Duplicate failed", err);
    }
  };

  const handleSaveRename = async () => {
    if (!editingProject || !newTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? { ...p, title: newTitle.trim() } : p))
        );
        setEditingProject(null);
      }
    } catch (err) {
      console.error("Rename failed", err);
    }
  };

  return (
    <AppLayout>
      <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#F4F7FC] min-h-screen text-[#17233C] flex flex-col gap-8">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-2xl bg-[#08162B] border border-white/10 p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#5B35F5]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#35D6FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#35D6FF] uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#35D6FF]" />
              <span>Workspace Archives</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white">
                All Projects
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Projects &amp; History
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Browse, reopen, duplicate, and manage all your voice transcripts, video translations, and audio sessions.
            </p>
          </div>

          <Link
            href="/workspace"
            className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#5B35F5] via-[#268CFF] to-[#35D6FF] hover:scale-[1.02] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#5B35F5]/30 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Session</span>
          </Link>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="rounded-2xl bg-white p-4 border border-[#D9E2F0] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#61708A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] text-xs placeholder:text-[#61708A] focus:outline-none focus:border-[#5B35F5] focus:ring-1 focus:ring-[#5B35F5] transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto p-1 rounded-xl bg-[#F4F7FC] border border-[#D9E2F0]">
            {[
              { id: "all", label: "All" },
              { id: "video", label: "Video", icon: Video },
              { id: "voice", label: "Voice", icon: Mic },
              { id: "translation", label: "Translation", icon: Languages },
              { id: "text", label: "Text", icon: Keyboard },
              { id: "upload", label: "Audio/Video", icon: FileAudio },
            ].map((f) => {
              const Icon = f.icon;
              const active = selectedType === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedType(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm font-bold"
                      : "text-[#61708A] hover:text-[#17233C]"
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROJECTS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-6 border border-[#D9E2F0] animate-pulse h-48 shadow-sm"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center border border-[#D9E2F0] shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B35F5]/10 mx-auto mb-3 text-[#5B35F5]">
              <FolderGit2 className="h-7 w-7 text-[#5B35F5]" />
            </div>
            <h3 className="text-base font-bold text-[#17233C] mb-1">
              No matching projects found
            </h3>
            <p className="text-xs text-[#61708A] max-w-sm mx-auto mb-6">
              Create a new voice recording, video translation, or text session in the workspace.
            </p>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-xs font-bold text-white shadow-md shadow-[#5B35F5]/25 transition-all"
            >
              <Mic className="h-4 w-4" />
              <span>Launch Studio</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => {
              const src = getLanguageByCode(project.sourceLanguage);
              const tgt = getLanguageByCode(project.targetLanguage);

              return (
                <div
                  key={project.id}
                  className="rounded-2xl bg-white p-6 border border-[#D9E2F0] hover:border-[#5B35F5]/50 hover:shadow-md transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    {/* Title and options */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-[#17233C] group-hover:text-[#5B35F5] transition-colors line-clamp-1">
                        {project.title}
                      </h3>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setNewTitle(project.title);
                          }}
                          className="p-1 rounded-lg text-[#61708A] hover:text-[#17233C] hover:bg-[#F4F7FC] transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(project.id)}
                          className="p-1 rounded-lg text-[#61708A] hover:text-[#5B35F5] hover:bg-[#5B35F5]/10 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
                          className="p-1 rounded-lg text-[#61708A] hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Language flow */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#17233C] mb-3">
                      <span>{src.name}</span>
                      <span className="text-[#5B35F5] font-bold">→</span>
                      <span className="text-[#5B35F5] font-bold">{tgt.name}</span>
                    </div>

                    {/* Excerpt if present */}
                    {project.transcripts?.[0]?.originalText && (
                      <p className="text-xs text-[#61708A] line-clamp-2 italic mb-4 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#D9E2F0]">
                        &quot;{project.transcripts[0].originalText}&quot;
                      </p>
                    )}
                  </div>

                  {/* Footer with date and Open button */}
                  <div className="flex items-center justify-between border-t border-[#D9E2F0] pt-3 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#61708A]">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <Link
                      href={project.type === "video" ? "/video" : `/workspace?projectId=${project.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5B35F5]/10 hover:bg-[#5B35F5]/20 text-[#5B35F5] text-xs font-bold transition-colors"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RENAME MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-[#D9E2F0] shadow-2xl text-[#17233C]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D9E2F0]">
              <h3 className="text-sm font-bold text-[#17233C]">Rename Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-[#61708A] hover:text-[#17233C]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] text-sm focus:outline-none focus:border-[#5B35F5] mb-4"
              placeholder="Project Title"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#61708A] hover:text-[#17233C]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white font-bold text-xs shadow-md shadow-[#5B35F5]/25 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
