"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { VideoPlayer } from "./VideoPlayer";
import { SearchPanel } from "./SearchPanel";
import { SettingsPanel } from "./SettingsPanel";
import { OnboardingModal } from "./OnboardingModal";
import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";
import { PlayCircle, Search, Settings, LogOut, Eye } from "lucide-react";

type NavView = "player" | "search" | "settings";

export function AppShell() {
  const { data: session } = useSession();
  const { activeView, setActiveView, sidebarWidth, setSidebarWidth } = useStore();
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        window.requestAnimationFrame(() => {
          // 56px is the width of the left icon nav
          const newWidth = e.clientX - 56;
          if (newWidth > 200 && newWidth < 800) {
            setSidebarWidth(newWidth);
          }
        });
      }
    },
    [isResizing, setSidebarWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const navItems: { id: NavView; icon: React.ElementType; label: string }[] = [
    { id: "player", icon: PlayCircle, label: "Player" },
    { id: "search", icon: Search, label: "Search" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      <OnboardingModal />

      {/* Resize Overlay: prevents mouse loss over iframes while dragging */}
      {isResizing && (
        <div
          className="fixed inset-0 z-[9999] cursor-col-resize select-none"
          onMouseMove={(e) => resize(e.nativeEvent)}
          onMouseUp={stopResizing}
        />
      )}

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
                    activeView === item.id
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
        <div
          style={{ width: sidebarWidth }}
          className="relative flex h-full border-r border-border/50"
        >
          <Sidebar />
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className={cn(
              "absolute top-0 right-[-2px] w-[5px] h-full cursor-col-resize z-50 group transition-all",
              isResizing ? "opacity-100" : "opacity-0 hover:opacity-100"
            )}
          >
            <div className="w-full h-full bg-accent/30 backdrop-blur-sm" />
          </div>
        </div>

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
        </main>
      </div>
    </>
  );
}
