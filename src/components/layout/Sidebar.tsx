"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AudioWaveform,
  LayoutDashboard,
  Mic,
  Languages,
  Volume2,
  Video,
  FolderGit2,
  Settings,
  Sparkles,
  Zap,
  HardDrive,
} from "lucide-react";
import { useState, Suspense } from "react";

interface SidebarProps {
  onNavigate?: () => void;
}

function SidebarInner({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/workspace?tab=voice",
      label: "Voice Assistant",
      icon: Mic,
      isActive: pathname === "/workspace" && (!currentTab || currentTab === "voice"),
    },
    {
      href: "/workspace?tab=text",
      label: "Translator",
      icon: Languages,
      isActive: pathname === "/workspace" && currentTab === "text",
    },
    {
      href: "/workspace?tab=upload",
      label: "Text to Speech",
      icon: Volume2,
      isActive: pathname === "/workspace" && currentTab === "upload",
    },
    {
      href: "/video",
      label: "AI Video Translator",
      icon: Video,
      isActive: pathname === "/video",
      badge: "Beta",
    },
    {
      href: "/projects",
      label: "Projects",
      icon: FolderGit2,
      isActive: pathname === "/projects",
    },
    {
      href: "/studio",
      label: "Voice Profiles",
      icon: AudioWaveform,
      isActive: pathname === "/studio",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
  ];

  return (
    <>
      <aside className="w-[245px] shrink-0 h-screen sticky top-0 flex flex-col justify-between border-r border-white/[0.08] bg-[#090d16]/95 backdrop-blur-2xl p-4 select-none z-40">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#080c14]">
                <AudioWaveform className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white font-sans">
                  VOXORA
                </span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-sm">
                  AI
                </span>
              </div>
              <p className="text-[10px] tracking-wider text-slate-400 font-medium truncate mt-0.5">
                Speak. Translate. Create.
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    item.isActive
                      ? "bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-md shadow-violet-500/20 ring-1 ring-violet-400/40 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        item.isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ${
                        item.isActive
                          ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/30"
                          : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Storage & Upgrade */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.08]">
          {/* Storage Usage Card */}
          <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <HardDrive className="h-3 w-3 text-cyan-400" />
                Storage Usage
              </span>
              <span className="text-[10px] text-slate-400">2.4 / 10 GB</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 rounded-full"
                style={{ width: "24%" }}
              />
            </div>
          </div>

          {/* Upgrade Card */}
          <div className="rounded-xl p-3 bg-gradient-to-br from-violet-950/40 via-indigo-950/30 to-slate-900/60 border border-violet-500/20 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-violet-600/10 rounded-full blur-xl group-hover:bg-violet-600/20 transition-all pointer-events-none" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
              <Zap className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />
              <span>Unlock Advanced Features</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mb-2.5">
              High-resolution 4K lip sync, unlimited voice profiles & fast queue.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20 transition-all active:scale-[0.98]"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </aside>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md saas-card p-6 border border-violet-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-600/20 text-cyan-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Voxora Pro Plan</h3>
                  <p className="text-xs text-slate-400">Unlimited Studio Capabilities</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 my-4">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">✓</span> Real-time Lip-Sync with 60fps smoothing
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">✓</span> Authorized voice cloning with zero-latency
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">✓</span> 100 GB Cloud Storage included
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">✓</span> Commercial license & watermark removal
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold btn-gradient-primary"
              >
                Start 14-Day Free Trial
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<div className="w-[245px] shrink-0 h-screen bg-[#090d16]" />}>
      <SidebarInner {...props} />
    </Suspense>
  );
}
