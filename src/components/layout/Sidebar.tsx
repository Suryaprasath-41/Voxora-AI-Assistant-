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
  Crown,
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
      <aside className="w-[210px] shrink-0 h-screen sticky top-0 flex flex-col justify-between border-r border-white/[0.08] bg-[#08162B] p-3.5 select-none z-40">
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2.5 px-1.5 py-1 rounded-xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5B35F5] via-[#268CFF] to-[#35D6FF] p-[1.5px] shadow-lg shadow-[#5B35F5]/25 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-[#08162B]">
                <AudioWaveform className="h-4 w-4 text-[#35D6FF] animate-pulse" />
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold tracking-tight text-white font-sans">
                  VOXORA
                </span>
                <span className="text-[10px] font-black px-1 py-0.2 rounded bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-sm">
                  AI
                </span>
              </div>
              <p className="text-[9px] tracking-wider text-slate-400 font-medium truncate mt-0.5">
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
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    item.isActive
                      ? "bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-md shadow-[#5B35F5]/30 ring-1 ring-white/20 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        item.isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span className="truncate text-[11.5px]">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full ${
                        item.isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#5B35F5]/20 text-[#35D6FF] border border-[#5B35F5]/30"
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

        {/* Bottom Section: Storage & Upgrade to Pro */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.08]">
          {/* Storage Usage Card */}
          <div className="rounded-xl p-2.5 bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <HardDrive className="h-3 w-3 text-[#35D6FF]" />
                Storage Usage
              </span>
              <span className="text-[9px] text-slate-400 font-medium">2.4 GB / 10 GB</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5B35F5] to-[#268CFF] rounded-full"
                style={{ width: "24%" }}
              />
            </div>
          </div>

          {/* Upgrade to Pro Card */}
          <div className="rounded-xl p-2.5 bg-gradient-to-br from-[#121c3b] to-[#0a1426] border border-[#5B35F5]/30 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
              <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>Upgrade to Pro</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug mb-2">
              Get higher limits, faster processing and more features.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-[#5B35F5] to-[#268CFF] hover:from-[#6b47ff] hover:to-[#3896ff] text-white shadow-md shadow-[#5B35F5]/25 transition-all active:scale-[0.98]"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </aside>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#08162B] p-6 rounded-2xl border border-[#5B35F5]/30 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#5B35F5]/20 text-[#35D6FF]">
                  <Crown className="h-5 w-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Voxora Pro Plan</h3>
                  <p className="text-xs text-slate-400">Unlock maximum limits & speed</p>
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
                <span className="text-[#35D6FF] font-bold">✓</span> Real-time lip-synchronization at 60fps
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#35D6FF] font-bold">✓</span> Unlimited high-fidelity voice profiles
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#35D6FF] font-bold">✓</span> 100 GB Cloud Storage included
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#35D6FF] font-bold">✓</span> Priority rendering queue & 4K video exports
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#5B35F5] to-[#268CFF] text-white shadow-md shadow-[#5B35F5]/30"
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
    <Suspense fallback={<div className="w-[210px] shrink-0 h-screen bg-[#08162B]" />}>
      <SidebarInner {...props} />
    </Suspense>
  );
}
