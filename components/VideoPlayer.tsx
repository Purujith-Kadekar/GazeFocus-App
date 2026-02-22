"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { useStore } from "@/stores/useStore";
import { useGazeDetection } from "@/hooks/useGazeDetection";
import { useInactivityAlert } from "@/hooks/useInactivityAlert";
import { GazeIndicator } from "./GazeIndicator";
import { BreakOverlay } from "./BreakOverlay";
import { InactivityAlert } from "./InactivityAlert";
import { formatDuration } from "@/lib/youtube";
import { Eye, EyeOff, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  className?: string;
}

export function VideoPlayer({ className }: VideoPlayerProps) {
  const {
    currentVideo,
    isPlaying,
    isOnBreak,
    settings,
    setIsPlaying,
    setCurrentTime,
    triggerBreak,
    endBreak,
    checkMilestone,
    updateMilestones,
    milestones,
  } = useStore();

  const playerRef = useRef<YouTubePlayer | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [inactivityPaused, setInactivityPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Gaze Callbacks ────────────────────────────────────────────────────────

  const handleGazeAway = useCallback(() => {
    if (playerRef.current && isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  }, [isPlaying, setIsPlaying]);

  const handleGazeReturn = useCallback(() => {
    if (playerRef.current && !isOnBreak && !inactivityPaused) {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [isOnBreak, inactivityPaused, setIsPlaying]);

  // ─── Inactivity Callbacks ──────────────────────────────────────────────────

  const handleInactive = useCallback(() => {
    setInactivityPaused(true);
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const handleReturn = useCallback(() => {
    setInactivityPaused(false);
  }, []);

  // ─── Gaze Hook ─────────────────────────────────────────────────────────────

  const { gazeStatus } = useGazeDetection({
    videoRef: webcamRef,
    onGazeAway: handleGazeAway,
    onGazeReturn: handleGazeReturn,
    enabled: settings.gazeEnabled && !!currentVideo,
  });

  // ─── Inactivity Hook ───────────────────────────────────────────────────────

  useInactivityAlert({
    onInactive: handleInactive,
    onReturn: handleReturn,
  });

  // ─── YouTube Player Events ─────────────────────────────────────────────────

  const onPlayerReady = useCallback(
    (event: YouTubeEvent) => {
      playerRef.current = event.target;
      if (currentVideo) {
        updateMilestones(currentVideo.durationSeconds);
      }
    },
    [currentVideo, updateMilestones]
  );

  const onStateChange = useCallback(
    (event: YouTubeEvent) => {
      const state = event.data;
      // YouTube Player States: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
      setIsPlaying(state === 1);
    },
    [setIsPlaying]
  );

  // ─── Time Tracking & Milestone Checks ─────────────────────────────────────

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(async () => {
      if (!playerRef.current) return;
      try {
        const time = await playerRef.current.getCurrentTime();
        setCurrentTime(time);

        // Check if we've hit a milestone
        const shouldBreak = checkMilestone(time);
        if (shouldBreak) {
          playerRef.current.pauseVideo();
          triggerBreak();
        }
      } catch {
        // Player not ready
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime, checkMilestone, triggerBreak]);

  // ─── Auto-hide controls ────────────────────────────────────────────────────

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // ─── Break End Handler ─────────────────────────────────────────────────────

  const handleBreakEnd = useCallback(() => {
    endBreak();
    if (playerRef.current) {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [endBreak, setIsPlaying]);

  if (!currentVideo) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full text-text-secondary",
          className
        )}
      >
        <div className="text-center space-y-3">
          <div className="text-6xl opacity-20">▶</div>
          <p className="font-display text-sm tracking-widest uppercase">
            Select a video to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative flex flex-col h-full bg-surface", className)}
      onMouseMove={resetControlsTimer}
    >
      {/* Hidden webcam for gaze tracking */}
      <video
        ref={webcamRef}
        autoPlay
        muted
        playsInline
        className="absolute opacity-0 pointer-events-none w-1 h-1"
        aria-hidden="true"
      />

      {/* YouTube iframe */}
      <div className="relative flex-1 bg-black">
        <YouTube
          videoId={currentVideo.id}
          className="w-full h-full"
          iframeClassName="w-full h-full"
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1, // Keep if you want auto-play
              rel: 0, // Hide related videos (good for anti-distraction)
              modestbranding: 1, // Optional: Minimal branding
              fs: 1, // Allow fullscreen
              enablejsapi: 1, // REQUIRED: Enables JS API for pause/resume
              origin: typeof window !== "undefined" ? window.location.origin : "", // REQUIRED: Matches your domain (localhost or Vercel)
              playsinline: 1, // Add this: Better for mobile/inline playback
            },
          }}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
        />

        {/* Break overlay */}
        {isOnBreak && (
          <BreakOverlay
            milestones={milestones}
            onBreakEnd={handleBreakEnd}
          />
        )}

        {/* Inactivity overlay */}
        {inactivityPaused && (
          <InactivityAlert onDismiss={() => {
            setInactivityPaused(false);
            if (playerRef.current) {
              playerRef.current.playVideo();
              setIsPlaying(true);
            }
          }} />
        )}
      </div>

      {/* Video info bar */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 bg-surface-1 border-t border-border transition-opacity duration-300",
          !showControls && isPlaying && "opacity-0"
        )}
      >
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-display truncate">
            {currentVideo.title}
          </p>
          <p className="text-text-secondary text-xs mt-0.5">
            {currentVideo.channelTitle} • {formatDuration(currentVideo.durationSeconds)}
          </p>
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* Gaze status indicator */}
          <GazeIndicator status={gazeStatus} />

          {/* Milestone progress dots */}
          <div className="flex gap-1.5" aria-label="Break milestones">
            {milestones.map((m) => (
              <div
                key={m.percent}
                title={`${m.percent}% milestone${m.triggered ? " (completed)" : ""}`}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  m.triggered
                    ? "bg-accent"
                    : "bg-surface-4 border border-border"
                )}
              />
            ))}
          </div>

          <button
            onClick={() => playerRef.current?.getIframe().requestFullscreen()}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>

          {/* Toggle gaze */}
          <button
            onClick={() =>
              useStore.getState().updateSettings({
                gazeEnabled: !settings.gazeEnabled,
              })
            }
            className={cn(
              "transition-colors",
              settings.gazeEnabled
                ? "text-accent hover:text-accent-dim"
                : "text-text-muted hover:text-text-secondary"
            )}
            aria-label={settings.gazeEnabled ? "Disable gaze tracking" : "Enable gaze tracking"}
          >
            {settings.gazeEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
