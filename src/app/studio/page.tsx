"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StudioAudioPlayer } from "@/components/audio/StudioAudioPlayer";
import {
  AudioWaveform,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Volume2,
  Sparkles,
  Upload,
  Mic,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Languages,
} from "lucide-react";

interface VoiceProfile {
  id: string;
  name: string;
  providerVoiceId?: string;
  sampleAudioUrl?: string;
  consentConfirmed: boolean;
  consentTimestamp: string;
  createdAt: string;
}

export default function VoiceStudioPage() {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states for creating voice profile
  const [profileName, setProfileName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Audio testing state
  const [activeTestingAudio, setActiveTestingAudio] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const loadVoices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/voices");
      if (res.ok) {
        const data = await res.json();
        setVoices(data.voices || []);
      }
    } catch (err) {
      console.error("Failed to load voices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoices();
  }, []);

  const handleCreateVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!profileName.trim()) {
      setFormError("Please enter a name for this voice profile.");
      return;
    }

    if (!sampleFile) {
      setFormError("Please upload an audio sample of the voice.");
      return;
    }

    if (!consentChecked) {
      setFormError("You must explicitly verify speaker authorization before proceeding.");
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", profileName.trim());
      formData.append("consentConfirmed", "true");
      formData.append("sampleFile", sampleFile);

      const res = await fetch("/api/voices", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create voice profile");
      }

      setModalOpen(false);
      setProfileName("");
      setConsentChecked(false);
      setSampleFile(null);
      await loadVoices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Creation failed";
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVoice = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this voice profile?")) return;
    try {
      const res = await fetch(`/api/voices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setVoices((prev) => prev.filter((v) => v.id !== id));
        if (activeTestingAudio) setActiveTestingAudio(null);
      }
    } catch (err) {
      console.error("Failed to delete voice", err);
    }
  };

  const handleTestVoice = (voice: VoiceProfile) => {
    if (voice.sampleAudioUrl) {
      setActiveTestingAudio({
        url: voice.sampleAudioUrl,
        title: `${voice.name} — Reference Sample & Timbre Profile`,
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
              <AudioWaveform className="h-3.5 w-3.5" />
              <span>Voice Studio & Acoustic Profiling</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Authorized Voice Profiles
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Create, preserve, and manage authorized speaker voice models with verified consent records for same-speaker multilingual translations.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-medium text-xs sm:text-sm shadow-xl shadow-purple-600/20 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Voice Profile</span>
          </button>
        </div>

        {/* VOICE SAFETY POLICY BANNER (Section 2) */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 mb-8 flex flex-col md:flex-row items-center gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white mb-1">
              Strict Speaker Consent & Ethical AI Policy
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Voice cloning requires permission from the speaker. Only upload or clone a voice that you own or have explicit authorization to use. Every profile preserves a tamper-proof consent record, and generated speech is transparently marked with the &quot;AI-generated voice&quot; watermark.
            </p>
          </div>
        </div>

        {/* Active Audio Player if testing a voice */}
        {activeTestingAudio && (
          <div className="mb-8">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
              Auditioning Profile
            </h3>
            <StudioAudioPlayer
              src={activeTestingAudio.url}
              title={activeTestingAudio.title}
              isClonedVoice={true}
            />
          </div>
        )}

        {/* Voice Profiles Grid */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>Your Voice Profiles</span>
            <span className="text-xs font-normal text-slate-400">
              ({voices.length} {voices.length === 1 ? "profile" : "profiles"})
            </span>
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl glass-panel p-5 border border-white/5 animate-pulse h-40"
                />
              ))}
            </div>
          ) : voices.length === 0 ? (
            <div className="rounded-2xl glass-panel p-10 text-center border border-white/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 mx-auto mb-3 text-slate-400">
                <AudioWaveform className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                No voice profiles yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                Create a voice profile with an authorized audio sample to generate multilingual translations in your own voice.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Voice Profile</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  className="rounded-2xl glass-panel p-6 border border-white/10 glass-panel-hover flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <AudioWaveform className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white truncate max-w-[170px]">
                            {voice.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Created {new Date(voice.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVoice(voice.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete voice profile"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Status & Consent Verification Badges */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium text-[11px]">
                          Consent Confirmed & Logged
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span>Ready for Same-Speaker Translations</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <button
                      onClick={() => handleTestVoice(voice)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-slate-200" />
                      <span>Test Voice</span>
                    </button>

                    <a
                      href={`/workspace?voiceProfileId=${voice.id}`}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      Use in Studio →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SAME-SPEAKER TRANSLATION SHOWCASE (Section 18) */}
        <div className="rounded-2xl glass-panel p-8 border border-white/10 relative overflow-hidden">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
              Architecture Highlight
            </span>
            <h3 className="text-xl font-bold text-white mb-2">
              Same-Speaker Multilingual Translation
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When you record in an Indian or European language (e.g., Tamil, Hindi, Spanish), the pipeline transcribes the speech, translates it into the target language, and synthesizes the translated speech preserving your authorized vocal identity and speaking timbre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                1. Input Voice (Tamil)
              </span>
              <p className="text-sm font-medium text-slate-200">
                &quot;நான் இன்று கல்லூரிக்கு செல்கிறேன்.&quot;
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
              <span className="text-[10px] font-bold uppercase text-indigo-400 block mb-1">
                2. Contextual Translation
              </span>
              <p className="text-sm font-medium text-slate-200">
                &quot;I am going to college today.&quot;
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
              <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">
                3. Preserved Voice Output
              </span>
              <p className="text-xs text-purple-200">
                Synthesized in English with speaker&apos;s timbre & pitch profile.
              </p>
              <div className="mt-2 text-[10px] text-purple-300 flex items-center gap-1 font-semibold">
                <ShieldAlert className="h-3 w-3" />
                <span>AI-generated voice</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE VOICE PROFILE MODAL WITH CONSENT CONFIRMATION (Sections 2 & 17) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 border border-white/15 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <AudioWaveform className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create Voice Profile
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acoustic profile for same-speaker translation
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVoice} className="space-y-5">
              {/* Profile Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Voice Profile Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. My Voice, Studio Narrator, Alex"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              {/* Audio Sample Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Voice Sample (Audio File or Recording)
                </label>
                <div className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSampleFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="sampleFileInput"
                  />
                  <label
                    htmlFor="sampleFileInput"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <Upload className="h-6 w-6 text-purple-400 mb-2" />
                    <span className="text-xs text-white font-medium">
                      {sampleFile ? sampleFile.name : "Click to upload voice sample"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      WAV, MP3, or M4A (10 to 60 seconds recommended)
                    </span>
                  </label>
                </div>
              </div>

              {/* MANDATORY VOICE SAFETY CONSENT CHECKBOX (Section 2 & Section 17) */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-200 leading-relaxed font-medium">
                    &quot;Voice cloning requires permission from the speaker. Only upload or clone a voice that you own or have explicit authorization to use.&quot;
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-purple-500/20">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-purple-400 bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-200 select-none">
                    I confirm that I own this voice or have permission from the speaker to create this voice profile.
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || !consentChecked || !sampleFile || !profileName}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
                >
                  {creating ? (
                    <span>Analyzing & Creating...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Create Authorized Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
