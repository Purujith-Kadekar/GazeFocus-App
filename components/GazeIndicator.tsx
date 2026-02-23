"use client";

import { Eye, EyeOff, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GazeStatus } from "@/types";

interface GazeIndicatorProps {
  status: GazeStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  GazeStatus,
  { icon: React.ElementType; label: string; colorClass: string; pulse?: boolean }
> = {
  active: {
    icon: Eye,
    label: "Gaze active — looking at screen",
    colorClass: "text-accent",
    pulse: false,
  },
  away: {
    icon: EyeOff,
    label: "Gaze away — video paused",
    colorClass: "text-warn animate-pulse",
    pulse: true,
  },
  paused: {
    icon: EyeOff,
    label: "Video paused by gaze",
    colorClass: "text-danger",
    pulse: false,
  },
  disabled: {
    icon: EyeOff,
    label: "Gaze tracking disabled",
    colorClass: "text-text-muted",
    pulse: false,
  },
  "no-camera": {
    icon: WifiOff,
    label: "No webcam found — gaze tracking unavailable",
    colorClass: "text-text-muted",
    pulse: false,
  },
  loading: {
    icon: Loader2,
    label: "Loading gaze model…",
    colorClass: "text-text-secondary animate-spin",
    pulse: false,
  },
};

export function GazeIndicator({ status, className }: GazeIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={cn("relative flex items-center", className)}
      title={config.label}
      aria-label={config.label}
    >
      {/* Animated ring for active gaze */}
      {status === "active" && (
        <span
          className="absolute inset-0 rounded-full border border-accent/30 animate-ping"
          aria-hidden="true"
        />
      )}
      <Icon
        size={16}
        className={cn("relative z-10 transition-colors", config.colorClass)}
      />
    </div>
  );
}

/**
 * Larger version for onboarding / settings
 */
export function GazeStatusBadge({ status }: { status: GazeStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const bgClass: Record<GazeStatus, string> = {
    active: "bg-accent/10 border-accent/30 text-accent",
    away: "bg-warn/10 border-warn/30 text-warn",
    paused: "bg-danger/10 border-danger/30 text-danger",
    disabled: "bg-surface-3 border-border text-text-muted",
    "no-camera": "bg-surface-3 border-border text-text-muted",
    loading: "bg-surface-3 border-border text-text-secondary",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-display tracking-wider uppercase",
        bgClass[status]
      )}
      aria-label={config.label}
    >
      <Icon
        size={12}
        className={cn(status === "loading" && "animate-spin")}
      />
      <span>{config.label}</span>
    </div>
  );
}
