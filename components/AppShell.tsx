"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { VideoPlayer } from "./VideoPlayer";
import { SearchPanel } from "./SearchPanel";
import { SettingsPanel } from "./SettingsPanel";
import { PlaylistDetail } from "./PlaylistDetail";
import { OnboardingModal } from "./OnboardingModal";
import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";
import { PlayCircle, Search, Settings, LogOut, Eye } from "lucide-react";
import type { YTPlaylist } from "@/types";

type NavView = "player" | "search" | "settings";

export function AppShell() {
  const { data: session } = useSession();
  const { activeView, setActiveView } = useStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<YTPlaylist | null>(null);

  const handleOpenPlaylist = (playlist: YTPlaylist) => {
    setSelectedPlaylist(playlist);
    setActiveView("playlist");
  };

  const navItems: { id: NavView; icon: React.ElementType; label: string }[] = [
    { id: "player", icon: PlayCircle, label: "Player" },
    { id: "search", icon: Search, label: "Search" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      <OnboardingModal />

      <div className="flex h-screen w-screen overflow-hidden bg-surface">
        {/* ─── Left: Narrow icon nav ─────────────────────────────────────── */}
        <nav
          className="flex flex-col items-center gap-1 py-4 px-2 bg-surface-1 border-r border-border w-14 shrink-0"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <div className="mb-4 w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Eye size={16} className="text-accent" />
          </div>

          <div className="flex-1 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                    (activeView === item.id || (item.id === "player" && activeView === "playlist"))
                      ? "bg-accent/15 text-accent border border-accent/20"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
                  )}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>

          {/* User avatar + sign out */}
          <div className="mt-auto flex flex-col items-center gap-2">
            {session?.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="w-8 h-8 rounded-full border border-border"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              aria-label="Sign out"
              title="Sign out"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-surface-2 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </nav>

        {/* ─── Middle: Playlist sidebar (always visible) ─── */}
        <Sidebar onSelectPlaylist={handleOpenPlaylist} />

        {/* ─── Right: Main content area — all panels stay mounted ──── */}
        <main className="flex-1 min-w-0 h-full relative">
          <div className={activeView === "player" ? "h-full" : "hidden"}>
            <VideoPlayer className="h-full" />
          </div>
          <div className={activeView === "search" ? "h-full" : "hidden"}>
            <SearchPanel />
          </div>
          <div className={activeView === "settings" ? "h-full" : "hidden"}>
            <SettingsPanel />
          </div>
          {activeView === "playlist" && selectedPlaylist && (
            <div className="h-full">
              <PlaylistDetail playlist={selectedPlaylist} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
