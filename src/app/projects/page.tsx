"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { getLanguageByCode } from "@/lib/languages";
import {
  FolderGit2,
  Search,
  Filter,
  Trash2,
  Copy,
  Edit2,
  ExternalLink,
  Clock,
  Mic,
  Languages,
  Keyboard,
  FileAudio,
  CheckCircle2,
  X,
  AlertCircle,
  Video,
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

  const fetchProjects = async () => {
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
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedType]);

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
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>Workspace Archives</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Projects & History
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Browse, reopen, duplicate, and manage all your voice transcripts and translations.
            </p>
          </div>

          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition-all shrink-0"
          >
            <Mic className="h-4 w-4" />
            <span>New Session</span>
          </Link>
        </div>

        {/* Filter and Search Bar (Section 23) */}
        <div className="rounded-2xl glass-panel p-4 border border-white/10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Filters: All, Voice, Translation, Text, Audio */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl glass-panel p-6 border border-white/5 animate-pulse h-48"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl glass-panel p-12 text-center border border-white/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 mx-auto mb-3 text-slate-400">
              <FolderGit2 className="h-7 w-7 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              No matching projects found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Create a new voice recording or text translation session in the workspace.
            </p>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
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
                  className="rounded-2xl glass-panel p-6 border border-white/10 glass-panel-hover flex flex-col justify-between group"
                >
                  <div>
                    {/* Title and options */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {project.title}
                      </h3>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setNewTitle(project.title);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(project.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Language flow */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-3">
                      <span>{src.name}</span>
                      <span className="text-cyan-400 font-bold">→</span>
                      <span className="text-cyan-300">{tgt.name}</span>
                    </div>

                    {/* Excerpt if present */}
                    {project.transcripts?.[0]?.originalText && (
                      <p className="text-xs text-slate-400 line-clamp-2 italic mb-4 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                        &quot;{project.transcripts[0].originalText}&quot;
                      </p>
                    )}
                  </div>

                  {/* Footer with date and Open button */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <Link
                      href={`/workspace?projectId=${project.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-semibold transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Rename Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 mb-4"
              placeholder="Project Title"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
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
