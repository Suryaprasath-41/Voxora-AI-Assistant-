"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { AudioWaveform, ShieldCheck, Sparkles, ArrowRight, UserCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleGoogleLogin = () => {
    setLoading(true);
    signIn("google", { callbackUrl });
  };

  const handleDemoLogin = () => {
    setDemoLoading(true);
    signIn("demo-login", {
      email: "creator@voxora.ai",
      name: "Alex Vance",
      callbackUrl,
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#080c14]">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/20 to-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Brand logo header */}
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
            <AudioWaveform className="h-6 w-6 text-cyan-400" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-white">
            VOXORA<span className="text-cyan-400 font-extrabold ml-1">AI</span>
          </span>
          <p className="text-[10px] tracking-wider text-slate-400 uppercase font-medium">
            Speak. Translate. Create.
          </p>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl glass-panel p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in to access your multilingual voice studio, projects, and voice profiles.
          </p>
        </div>

        <div className="space-y-4">
          {/* Continue with Google (Primary Button) */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading || demoLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-slate-100 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 transition-all shadow-lg hover:shadow-cyan-500/10 active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
            <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          {/* Quick Demo Sign In for instant testing */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f172a] px-3 text-slate-400">or instant preview</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            <span>{demoLoading ? "Logging in..." : "Continue as Demo User"}</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        {/* Security and privacy reassurance */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Never stores passwords. OAuth secured session.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Automatic project sync & authorized voice safety guarantee.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
