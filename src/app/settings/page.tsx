"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import {
  Settings,
  User,
  Sliders,
  HardDrive,
  Shield,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<"account" | "preferences" | "storage" | "privacy">("account");
  const [name, setName] = useState("");
  const [defaultSourceLanguage, setDefaultSourceLanguage] = useState("auto");
  const [defaultTargetLanguage, setDefaultTargetLanguage] = useState("en");
  const [defaultVoice, setDefaultVoice] = useState("natural-female");
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0");

  const [storageData, setStorageData] = useState<{
    totalMb: string;
    fileCount: number;
    projectsCount: number;
    voiceProfilesCount: number;
  }>({
    totalMb: "0.00",
    fileCount: 0,
    projectsCount: 0,
    voiceProfilesCount: 0,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || "");
        }
        if (data.preferences) {
          setDefaultSourceLanguage(data.preferences.defaultSourceLanguage || "auto");
          setDefaultTargetLanguage(data.preferences.defaultTargetLanguage || "en");
          setDefaultVoice(data.preferences.defaultVoice || "natural-female");
          setPlaybackSpeed(String(data.preferences.playbackSpeed || "1.0"));
        }
        if (data.storage) {
          setStorageData(data.storage);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          preferences: {
            defaultSourceLanguage,
            defaultTargetLanguage,
            defaultVoice,
            playbackSpeed: parseFloat(playbackSpeed) || 1.0,
          },
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      }
    } catch (err) {
      console.error("Delete account failed", err);
      setDeletingAccount(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Settings className="h-3.5 w-3.5" />
            <span>Preferences & Data Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Studio Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure your AI studio profile, translation preferences, storage, and privacy controls.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 mb-8 pb-1">
          {[
            { id: "account", label: "Account Profile", icon: User },
            { id: "preferences", label: "Studio Defaults", icon: Sliders },
            { id: "storage", label: "Storage & Assets", icon: HardDrive },
            { id: "privacy", label: "Privacy & Consent", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? "bg-white/10 text-cyan-400 border border-white/10 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Account */}
        {activeTab === "account" && (
          <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white mb-4">Account Information</h3>

            <div className="flex items-center gap-4 pb-6 border-b border-white/10">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={name || "User"}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-cyan-400/50"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white">{name || "Voxora User"}</p>
                <p className="text-xs text-slate-400">{session?.user?.email || "Google Authenticated"}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  OAuth Verified Session
                </span>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-sm cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Managed by your Google Authentication provider
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Account"}</span>
              </button>
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Changes saved successfully</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Studio Defaults */}
        {activeTab === "preferences" && (
          <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white mb-2">Translation & Synthesis Defaults</h3>
            <p className="text-xs text-slate-400 mb-6">
              Set default source and target languages, voice models, and speech speeds for faster workflows.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Default Source Language
                </label>
                <select
                  value={defaultSourceLanguage}
                  onChange={(e) => setDefaultSourceLanguage(e.target.value)}
                  className="w-full bg-white/5 text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:outline-none focus:border-cyan-400 appearance-none"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Default Target Language
                </label>
                <select
                  value={defaultTargetLanguage}
                  onChange={(e) => setDefaultTargetLanguage(e.target.value)}
                  className="w-full bg-white/5 text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:outline-none focus:border-cyan-400 appearance-none"
                >
                  {SUPPORTED_LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Default Voice Style
                </label>
                <select
                  value={defaultVoice}
                  onChange={(e) => setDefaultVoice(e.target.value)}
                  className="w-full bg-white/5 text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:outline-none focus:border-cyan-400 appearance-none"
                >
                  <option value="natural-female" className="bg-slate-900">Aria (Natural Conversational)</option>
                  <option value="natural-male" className="bg-slate-900">Marcus (Professional)</option>
                  <option value="friendly-female" className="bg-slate-900">Maya (Friendly & Warm)</option>
                  <option value="narrator-male" className="bg-slate-900">David (Narrator)</option>
                  <option value="assistant-female" className="bg-slate-900">Nova (Crisp Assistant)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Default Playback Speed
                </label>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(e.target.value)}
                  className="w-full bg-white/5 text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:outline-none focus:border-cyan-400 appearance-none"
                >
                  <option value="0.75" className="bg-slate-900">0.75x</option>
                  <option value="1.0" className="bg-slate-900">1.0x (Standard)</option>
                  <option value="1.25" className="bg-slate-900">1.25x</option>
                  <option value="1.5" className="bg-slate-900">1.5x</option>
                  <option value="2.0" className="bg-slate-900">2.0x</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Preferences"}</span>
              </button>
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Preferences saved</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Storage */}
        {activeTab === "storage" && (
          <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white mb-2">Storage Usage & Assets</h3>
            <p className="text-xs text-slate-400 mb-6">
              Track allocated disk and object storage for uploaded audio, video extractions, and synthesized speech files.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Total Storage Used</span>
                <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                  {storageData.totalMb} MB
                </span>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Audio & Speech Files</span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {storageData.fileCount}
                </span>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Saved Projects</span>
                <span className="text-2xl font-extrabold text-indigo-400 font-mono">
                  {storageData.projectsCount}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-slate-400 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                All audio binaries are isolated in secure object storage with cryptographically randomized paths.
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Privacy & Account Deletion (Sections 25 & 44) */}
        {activeTab === "privacy" && (
          <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white mb-2">Privacy & Consent Records</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              You own all your generated transcripts, translations, and voice assets. VOXORA AI enforces strict speaker authorization and provides full right-to-erasure compliance.
            </p>

            <div className="rounded-xl border border-white/10 p-5 bg-white/[0.02] space-y-3 mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Voice Safety Consent Logs</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All voice profiles in your account include cryptographically logged consent confirmations. When you delete a voice profile or project, the corresponding audio files and database records are permanently deleted.
              </p>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Danger Zone: Permanent Account Deletion</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    Permanently delete your user account, all projects, voice profiles, uploaded audio recordings, and synthesized speech files. This action cannot be undone.
                  </p>
                </div>

                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shrink-0"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-red-500/30 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Delete User Account?</h3>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              This will permanently delete your profile, all project histories, voice samples, and generated speech files. Are you sure you wish to proceed?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {deletingAccount ? "Deleting Everything..." : "Yes, Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
