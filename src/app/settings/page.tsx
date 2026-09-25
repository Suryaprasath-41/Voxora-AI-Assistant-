"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import {
  User,
  Sliders,
  HardDrive,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
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
      <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#F4F7FC] min-h-screen text-[#17233C] flex flex-col gap-8 max-w-5xl">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-2xl bg-[#08162B] border border-white/10 p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#5B35F5]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#35D6FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#35D6FF] uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#35D6FF]" />
              <span>Preferences &amp; Data Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Studio Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Configure your AI studio profile, translation preferences, speech speed defaults, and privacy controls.
            </p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#D9E2F0] shadow-sm">
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
                    ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm font-bold"
                    : "text-[#61708A] hover:text-[#17233C]"
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
          <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#D9E2F0] space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-[#17233C] mb-4">Account Information</h3>

            <div className="flex items-center gap-4 pb-6 border-b border-[#D9E2F0]">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={name || "User"}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#5B35F5]/40"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#5B35F5] to-[#268CFF] text-xl font-bold text-white shadow-sm">
                  {name ? name.charAt(0).toUpperCase() : "M"}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-[#17233C]">{name || "Maddy"}</p>
                <p className="text-xs text-[#61708A]">{session?.user?.email || "maddy@example.com"}</p>
                <span className="inline-block mt-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Verified Creator Session
                </span>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17233C] uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] text-sm focus:outline-none focus:border-[#5B35F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={session?.user?.email || "maddy@example.com"}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#61708A] text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3 border-t border-[#D9E2F0]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white font-bold text-xs shadow-md shadow-[#5B35F5]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Account"}</span>
              </button>
              {savedSuccess && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Preferences updated successfully
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Preferences */}
        {activeTab === "preferences" && (
          <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#D9E2F0] space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-[#17233C]">Studio &amp; Translation Defaults</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1.5">
                  Default Source Language
                </label>
                <select
                  value={defaultSourceLanguage}
                  onChange={(e) => setDefaultSourceLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] text-xs focus:outline-none focus:border-[#5B35F5]"
                >
                  <option value="auto">Auto Detect</option>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1.5">
                  Default Target Language
                </label>
                <select
                  value={defaultTargetLanguage}
                  onChange={(e) => setDefaultTargetLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] text-xs focus:outline-none focus:border-[#5B35F5]"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1.5">
                  Default AI Voice
                </label>
                <select
                  value={defaultVoice}
                  onChange={(e) => setDefaultVoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] text-xs focus:outline-none focus:border-[#5B35F5]"
                >
                  <option value="natural-female">Natural Female (Warm)</option>
                  <option value="natural-male">Natural Male (Deep)</option>
                  <option value="expressive-female">Expressive Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1.5">
                  Default Speech Speed (Default: 1.0x)
                </label>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] text-xs focus:outline-none focus:border-[#5B35F5]"
                >
                  <option value="0.75">0.75x — Slow &amp; Clear</option>
                  <option value="1.0">1.0x — Natural Speed (Default)</option>
                  <option value="1.25">1.25x — Dynamic</option>
                  <option value="1.5">1.5x — Fast</option>
                  <option value="2.0">2.0x — Double Speed</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3 border-t border-[#D9E2F0]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white font-bold text-xs shadow-md shadow-[#5B35F5]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Preferences"}</span>
              </button>
              {savedSuccess && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Preferences updated successfully
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Storage */}
        {activeTab === "storage" && (
          <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#D9E2F0] space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-[#17233C]">Storage &amp; Asset Footprint</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                <span className="text-xs text-[#61708A] block mb-1">Total Storage</span>
                <span className="text-xl font-bold text-[#17233C]">{storageData.totalMb} MB</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                <span className="text-xs text-[#61708A] block mb-1">Audio/Video Files</span>
                <span className="text-xl font-bold text-[#17233C]">{storageData.fileCount}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                <span className="text-xs text-[#61708A] block mb-1">Total Projects</span>
                <span className="text-xl font-bold text-[#17233C]">{storageData.projectsCount}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
                <span className="text-xs text-[#61708A] block mb-1">Voice Profiles</span>
                <span className="text-xl font-bold text-[#5B35F5]">{storageData.voiceProfilesCount}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
              <div className="flex items-center justify-between text-xs text-[#61708A] mb-2 font-medium">
                <span>Plan Quota Used</span>
                <span>{storageData.totalMb} MB / 10,240 MB (10 GB)</span>
              </div>
              <div className="w-full h-2 bg-[#D9E2F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5B35F5] to-[#268CFF] rounded-full"
                  style={{
                    width: `${Math.min(100, (parseFloat(storageData.totalMb) / 10240) * 100 || 2)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Privacy */}
        {activeTab === "privacy" && (
          <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#D9E2F0] space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-[#17233C]">Privacy, Consent &amp; Data Rights</h3>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-xs text-[#61708A] leading-relaxed space-y-2">
              <p>
                <strong className="text-[#17233C]">Cryptographic Consent Logging:</strong> Whenever you synthesize speech or create a voice profile, VOXORA AI creates a verifiable consent timestamp matching Indian IT Act and international voice privacy standards.
              </p>
              <p>
                <strong className="text-[#17233C]">AI Synthesis Transparency:</strong> All synthesized audio outputs are tagged with the digital &quot;AI-generated voice&quot; label for clear ethical transparency.
              </p>
            </div>

            <div className="pt-4 border-t border-red-200">
              <h4 className="text-sm font-bold text-red-600 mb-1">Danger Zone</h4>
              <p className="text-xs text-[#61708A] mb-4">
                Permanently delete your account, saved voice models, and all project recordings.
              </p>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Delete Account &amp; Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE ACCOUNT MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-[#D9E2F0] shadow-2xl text-[#17233C]">
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold">Delete Account Permanently</h3>
            </div>
            <p className="text-xs text-[#61708A] mb-6 leading-relaxed">
              This action cannot be undone. All your voice profiles, consent audit logs, generated audio, and project history will be permanently erased.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#61708A] hover:text-[#17233C]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                {deletingAccount ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
