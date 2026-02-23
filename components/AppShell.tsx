"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { VideoPlayer } from "./VideoPlayer";
import { SearchPanel } from "./SearchPanel";
import { SettingsPanel } from "./SettingsPanel";
import { OnboardingModal } from "./OnboardingModal";
import { DashboardPanel } from "./DashboardPanel";
import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { activeView, sidebarWidth, setSidebarWidth } = useStore();
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
          const newWidth = e.clientX;
          if (newWidth > 240 && newWidth < 600) {
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

  return (
    <>
      <OnboardingModal />

      {/* Resize Overlay */}
      {isResizing && (
        <div
          className="fixed inset-0 z-[9999] cursor-col-resize select-none"
          onMouseMove={(e) => resize(e.nativeEvent)}
          onMouseUp={stopResizing}
        />
      )}

      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* ─── Sidebar ─── */}
        <div
          style={{ width: sidebarWidth }}
          className="relative flex h-full shrink-0 group/sidebar"
        >
          <Sidebar />
          
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className={cn(
              "absolute top-0 right-0 w-[2px] h-full cursor-col-resize z-50 transition-colors duration-200",
              isResizing ? "bg-primary" : "bg-transparent group-hover/sidebar:bg-border hover:bg-primary"
            )}
          />
        </div>

        {/* ─── Main Content Area ─── */}
        <main className="flex-1 min-w-0 h-full relative bg-surface">
          <div className={cn("h-full transition-opacity duration-300", activeView === "player" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0")}>
            <VideoPlayer className="h-full" />
          </div>
          <div className={cn("h-full transition-opacity duration-300", activeView === "search" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0")}>
            <SearchPanel />
          </div>
          <div className={cn("h-full transition-opacity duration-300", activeView === "settings" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0")}>
            <SettingsPanel />
          </div>
          <div className={cn("h-full transition-opacity duration-300", activeView === "dashboard" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0")}>
            <DashboardPanel />
          </div>
        </main>
      </div>
    </>
  );
}
