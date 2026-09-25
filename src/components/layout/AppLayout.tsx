"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { X } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  variant?: "dark" | "light-workspace";
  contentClassName?: string;
  maxWidth?: string;
}

export function AppLayout({
  children,
  variant = "dark",
  contentClassName = "",
  maxWidth = "max-w-7xl",
}: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isLight = variant === "light-workspace";

  return (
    <div
      className={`flex min-h-screen ${
        isLight ? "bg-[#08162B] text-[#17233C]" : "bg-[#060911] text-slate-100"
      }`}
    >
      {/* Desktop Sidebar (Fixed left ~210px) */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col z-50 h-full w-[260px] bg-[#08162B] border-r border-white/10 shadow-2xl">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          isLight ? "bg-[#F4F7FC]" : "bg-[#060911]"
        }`}
      >
        <TopNav onToggleMobileMenu={() => setMobileSidebarOpen(true)} />
        <main
          className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-6 w-full mx-auto ${maxWidth} ${contentClassName}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

