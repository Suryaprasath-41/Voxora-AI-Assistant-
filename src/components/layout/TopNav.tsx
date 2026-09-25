"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  AudioWaveform,
  LogOut,
  Menu,
  CheckCircle2,
  Video,
} from "lucide-react";

interface TopNavProps {
  onToggleMobileMenu?: () => void;
}

export function TopNav({ onToggleMobileMenu }: TopNavProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const sampleNotifications = [
    {
      id: "1",
      title: "Video translation complete",
      desc: "Your Tamil to English video is ready for download.",
      time: "2m ago",
      icon: Video,
      color: "text-cyan-400 bg-cyan-500/10",
    },
    {
      id: "2",
      title: "Voice profile verified",
      desc: "Authorized timbre analysis complete with 99.4% similarity.",
      time: "1h ago",
      icon: CheckCircle2,
      color: "text-violet-400 bg-violet-500/10",
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full h-16 border-b border-white/[0.08] bg-[#090d16]/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, videos, or translations..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white/[0.04] border border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 ml-4">
        {/* Dark/Light Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title={isDarkMode ? "Dark mode active" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Moon className="h-4 w-4 text-violet-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl saas-card p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 border border-white/10">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-xs font-semibold text-white">Notifications</span>
                <span className="text-[10px] text-cyan-400 font-medium">2 unread</span>
              </div>
              <div className="space-y-2">
                {sampleNotifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div
                      key={notif.id}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${notif.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{notif.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{notif.desc}</p>
                        <span className="text-[10px] text-slate-500">{notif.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Auth */}
        {session?.user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] transition-colors"
              aria-label="User account menu"
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-7 w-7 rounded-lg object-cover ring-1 ring-violet-500/40"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-xs font-bold text-white">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left pr-1 max-w-[120px]">
                <span className="text-xs font-medium text-slate-200 truncate">
                  {session.user.name || "Creator"}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {session.user.email}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl saas-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 border border-white/15">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {session.user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {session.user.email}
                  </p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <User className="h-4 w-4 text-cyan-400" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Settings className="h-4 w-4 text-violet-400" />
                  Settings
                </Link>
                <Link
                  href="/studio"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <AudioWaveform className="h-4 w-4 text-indigo-400" />
                  Voice Profiles
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold btn-gradient-primary"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
