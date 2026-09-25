import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import {
  Mic,
  Globe2,
  Volume2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Layers,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-500/10 blur-[130px] -z-10 rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md text-xs font-semibold text-cyan-300 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>One voice. Every language.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
              Speak. Translate.{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Create.
              </span>
            </h1>

            {/* Description */}
            <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-300 mb-10 leading-relaxed font-normal">
              Turn your voice into text, translate it into any supported language, and create natural AI speech — all in one unified studio workspace.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
              <Link
                href="/workspace"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:from-indigo-600 hover:via-purple-700 hover:to-cyan-600 shadow-xl shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Start Creating</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all backdrop-blur-md"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </Link>
            </div>

            {/* Hero Studio Audio Visualizer Representation */}
            <div className="relative mx-auto max-w-4xl rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-3 w-3 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                    Live Acoustic Synthesis Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Tamil → English
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Neural Voice Preserved
                  </span>
                </div>
              </div>

              {/* Dynamic waveform representation */}
              <div className="h-28 flex items-center justify-center gap-1.5 px-4 bg-slate-950/60 rounded-xl border border-white/5">
                {[
                  8, 14, 28, 48, 70, 85, 96, 64, 40, 56, 80, 100, 72, 45, 60, 88,
                  94, 76, 52, 35, 65, 82, 90, 78, 55, 42, 60, 80, 95, 68, 44, 25,
                  18, 12, 22, 45, 68, 85, 70, 50, 32, 20, 14, 8,
                ].map((height, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${height}%`,
                      animationDelay: `${(i % 12) * 0.1}s`,
                    }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-cyan-400 wave-bar opacity-80"
                  />
                ))}
              </div>

              {/* Sample Translation Card In-Hero */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                    <span>Input (Tamil Spoken)</span>
                    <span className="text-emerald-400">98% Match</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">
                    &quot;நான் இன்று கல்லூரிக்கு செல்கிறேன்.&quot;
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-1 flex items-center justify-between">
                    <span>Synthesized Output (English AI Voice)</span>
                    <span className="text-purple-300">Timbre Cloned</span>
                  </div>
                  <p className="text-sm text-slate-100 font-medium">
                    &quot;I am going to college today.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION (Section 28) */}
        <section className="py-20 border-t border-white/5 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-2">
                Effortless Workflow
              </h2>
              <p className="text-3xl sm:text-4xl font-bold text-white">
                How VOXORA AI Works
              </p>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                Three seamless steps from spoken expression to natural multilingual speech.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative rounded-2xl glass-panel p-8 border border-white/10 group hover:border-cyan-500/40 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6 group-hover:scale-110 transition-transform">
                  <Mic className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
                  Step 01
                </span>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">
                  1. Speak or Type
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Record directly from your microphone with live waveform feedback, upload an audio or video file, or type directly in our modern editor.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl glass-panel p-8 border border-white/10 group hover:border-indigo-500/40 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6 group-hover:scale-110 transition-transform">
                  <Globe2 className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
                  Step 02
                </span>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">
                  2. Translate Intelligently
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Automatic language detection recognizes your dialect with high confidence. Contextual AI translates your words preserving tone, numbers, and names.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl glass-panel p-8 border border-white/10 group hover:border-purple-500/40 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-6 group-hover:scale-110 transition-transform">
                  <Volume2 className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-purple-400 tracking-wider uppercase">
                  Step 03
                </span>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">
                  3. Generate Natural Voice
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Select professional AI voices or use authorized voice preservation to speak the translated language with your own vocal identity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-2">
                Enterprise Capabilities
              </h2>
              <p className="text-3xl sm:text-4xl font-bold text-white">
                Engineered for Real-World Audio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl glass-panel p-6 border border-white/10 hover:border-white/20 transition-all">
                <Zap className="h-6 w-6 text-cyan-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  Multilingual Transcription
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accurate speech-to-text supporting Tamil, Hindi, Telugu, Malayalam, Spanish, French, German, Japanese, and 30+ global languages.
                </p>
              </div>

              <div className="rounded-2xl glass-panel p-6 border border-white/10 hover:border-white/20 transition-all">
                <Globe2 className="h-6 w-6 text-indigo-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  Contextual AI Translation
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Preserves paragraph formatting, tone, punctuation, and idioms instead of naive word-by-word replacements.
                </p>
              </div>

              <div className="rounded-2xl glass-panel p-6 border border-white/10 hover:border-white/20 transition-all">
                <Headphones className="h-6 w-6 text-purple-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  Natural Neural TTS
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Synthesize lifelike speech with pitch, tempo, and style controls (Natural, Professional, Friendly, Narrator, Assistant).
                </p>
              </div>

              <div className="rounded-2xl glass-panel p-6 border border-white/10 hover:border-white/20 transition-all">
                <ShieldCheck className="h-6 w-6 text-emerald-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  Authorized Voice Preservation
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Strict consent-verified voice profiling. Retains the speaker&apos;s timbre and characteristics in translated speech with AI safety watermark labels.
                </p>
              </div>

              <div className="rounded-2xl glass-panel p-6 border border-white/10 hover:border-white/20 transition-all">
                <Layers className="h-6 w-6 text-amber-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  Persistent Project History
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every recording, transcript, translation, and audio output is safely stored in your account for reopening, renaming, and exporting.
                </p>
              </div>

              <div className="rounded-2xl glass-panel p-6 border border-white/10 hover:border-white/20 transition-all">
                <Lock className="h-6 w-6 text-rose-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  Secure Google Authentication
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  OAuth session protection, encrypted storage paths, strict user authorization checks, and zero password exposure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* VOICE SAFETY BANNER SECTION (Section 2) */}
        <section className="py-12 border-t border-white/5 bg-gradient-to-r from-indigo-950/30 via-slate-950 to-purple-950/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-base font-bold text-white mb-1">
                  Responsible AI Voice Safety Policy
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Voice cloning requires permission from the speaker. Only upload or clone a voice that you own or have explicit authorization to use. All cloned voice outputs are transparently labeled with &quot;AI-generated voice&quot;.
                </p>
              </div>
              <Link
                href="/studio"
                className="shrink-0 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                Voice Studio
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">VOXORA AI</span>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-slate-400">Speak. Translate. Create.</span>
          </div>
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} VOXORA AI. Production Voice & Text Studio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
