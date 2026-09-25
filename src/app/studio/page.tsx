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
  Sparkles,
  Upload,
  AlertCircle,
  X,
  Play,
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

  const refreshVoices = async () => {
    try {
      const res = await fetch("/api/voices");
      if (res.ok) {
        const data = await res.json();
        setVoices(data.voices || []);
      }
    } catch (err) {
      console.error("Failed to load voices", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/voices")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!ignore) {
          setVoices(data.voices || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load voices", err);
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
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
      await refreshVoices();
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
      <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#F4F7FC] min-h-screen text-[#17233C] flex flex-col gap-8">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-2xl bg-[#08162B] border border-white/10 p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#5B35F5]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#35D6FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#35D6FF] uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#35D6FF]" />
              <span>Voice Studio &amp; Acoustic Profiling</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white">
                Authorized
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Voice Profiles &amp; Cloning
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Create, preserve, and manage authorized speaker voice models with verified consent records for same-speaker multilingual translations.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#5B35F5] via-[#268CFF] to-[#35D6FF] hover:scale-[1.02] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#5B35F5]/30 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Voice Profile</span>
          </button>
        </div>

        {/* VOICE SAFETY POLICY BANNER */}
        <div className="rounded-2xl border border-[#5B35F5]/20 bg-white p-5 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5B35F5]/10 text-[#5B35F5]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#17233C] mb-1">
              Strict Speaker Consent &amp; Ethical AI Policy
            </h3>
            <p className="text-xs text-[#61708A] leading-relaxed">
              Voice cloning requires permission from the speaker. Only upload or clone a voice that you own or have explicit authorization to use. Every profile preserves a tamper-proof consent record, and generated speech is transparently marked with the &quot;AI-generated voice&quot; watermark.
            </p>
          </div>
        </div>

        {/* Active Audio Player if testing a voice */}
        {activeTestingAudio && (
          <div className="bg-white rounded-2xl p-5 border border-[#D9E2F0] shadow-sm">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#5B35F5] mb-3">
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B35F5]/10 text-[#5B35F5] text-xs font-bold">
                <AudioWaveform className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-bold text-[#17233C]">Your Voice Profiles</h2>
            </div>
            <span className="text-xs font-semibold text-[#61708A]">
              {voices.length} {voices.length === 1 ? "profile" : "profiles"} available
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white p-5 border border-[#D9E2F0] animate-pulse h-44 shadow-sm"
                />
              ))}
            </div>
          ) : voices.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center border border-[#D9E2F0] shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B35F5]/10 mx-auto mb-3 text-[#5B35F5]">
                <AudioWaveform className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-[#17233C] mb-1">
                No voice profiles yet
              </h3>
              <p className="text-xs text-[#61708A] max-w-sm mx-auto mb-6">
                Create a voice profile with an authorized audio sample to generate multilingual translations in your own voice.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-xs font-bold text-white shadow-md shadow-[#5B35F5]/25 transition-all"
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
                  className="rounded-2xl bg-white p-6 border border-[#D9E2F0] hover:border-[#5B35F5]/50 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B35F5]/10 text-[#5B35F5]">
                          <AudioWaveform className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#17233C] truncate max-w-[170px]">
                            {voice.name}
                          </h4>
                          <span className="text-[10px] text-[#61708A]">
                            Created {new Date(voice.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVoice(voice.id)}
                        className="p-1.5 rounded-lg text-[#61708A] hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete voice profile"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Status & Consent Verification Badges */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span className="font-semibold text-[11px]">
                          Consent Confirmed &amp; Logged
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5B35F5] bg-[#5B35F5]/10 px-2.5 py-1 rounded-lg border border-[#5B35F5]/20 font-semibold">
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span>Ready for Same-Speaker Translations</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-[#D9E2F0] pt-4">
                    <button
                      onClick={() => handleTestVoice(voice)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] hover:bg-[#F1F5F9] text-[#17233C] text-xs font-semibold transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-[#17233C]" />
                      <span>Test Voice</span>
                    </button>

                    <a
                      href={`/workspace?voiceProfileId=${voice.id}`}
                      className="text-xs font-bold text-[#5B35F5] hover:underline"
                    >
                      Use in Studio →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SAME-SPEAKER TRANSLATION SHOWCASE */}
        <div className="rounded-2xl bg-white p-7 border border-[#D9E2F0] shadow-sm">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-bold text-[#5B35F5] uppercase tracking-wider block mb-1">
              Architecture Highlight
            </span>
            <h3 className="text-lg font-bold text-[#17233C] mb-1">
              Same-Speaker Multilingual Translation
            </h3>
            <p className="text-xs sm:text-sm text-[#61708A] leading-relaxed">
              When you record in an Indian or European language (e.g., Tamil, Hindi, Spanish), the pipeline transcribes the speech, translates it into the target language, and synthesizes the translated speech preserving your authorized vocal identity and speaking timbre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0]">
              <span className="text-[10px] font-bold uppercase text-[#61708A] block mb-1">
                1. Input Voice (Tamil)
              </span>
              <p className="text-sm font-semibold text-[#17233C]">
                &quot;நான் இன்று கல்லூரிக்கு செல்கிறேன்.&quot;
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#268CFF]/30">
              <span className="text-[10px] font-bold uppercase text-[#268CFF] block mb-1">
                2. Contextual Translation
              </span>
              <p className="text-sm font-semibold text-[#17233C]">
                &quot;I am going to college today.&quot;
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#5B35F5]/5 border border-[#5B35F5]/20">
              <span className="text-[10px] font-bold uppercase text-[#5B35F5] block mb-1">
                3. Preserved Voice Output
              </span>
              <p className="text-xs text-[#17233C]">
                Synthesized in English with speaker&apos;s timbre &amp; pitch profile.
              </p>
              <div className="mt-2 text-[10px] text-[#5B35F5] flex items-center gap-1 font-bold">
                <ShieldAlert className="h-3 w-3" />
                <span>AI-generated voice</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE VOICE PROFILE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 border border-[#D9E2F0] shadow-2xl text-[#17233C]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D9E2F0]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#5B35F5]/10 text-[#5B35F5]">
                  <AudioWaveform className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-[#17233C]">
                  Create Authorized Voice Profile
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#61708A] hover:text-[#17233C]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Maddy's Primary Voice"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E2F0] text-[#17233C] text-xs focus:outline-none focus:border-[#5B35F5]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Audio Sample File
                </label>
                <div className="relative border-2 border-dashed border-[#D9E2F0] hover:border-[#5B35F5] rounded-xl p-5 text-center bg-[#F8FAFC]">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSampleFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  <Upload className="h-6 w-6 text-[#5B35F5] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#17233C]">
                    {sampleFile ? sampleFile.name : "Upload 30-60s speaking audio"}
                  </p>
                  <p className="text-[10px] text-[#61708A] mt-0.5">WAV, MP3, M4A, WebM (Max 25MB)</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#5B35F5]/5 border border-[#5B35F5]/20 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-[#D9E2F0] text-[#5B35F5] focus:ring-[#5B35F5]"
                  required
                />
                <label htmlFor="consent" className="text-xs text-[#17233C] leading-snug cursor-pointer select-none">
                  <span className="font-bold block mb-0.5">Explicit Authorization Confirmation</span>
                  I confirm that I am the speaker or have explicit authorized permission to clone this voice.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9E2F0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#61708A] hover:text-[#17233C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white font-bold text-xs shadow-md shadow-[#5B35F5]/25 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Creating Profile..." : "Create Voice Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
