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
import { Eye, EyeOff, Maximize2, ArrowLeft, X, SkipForward, Play, Pause, Volume2, VolumeX, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  className?: string;
}

export function VideoPlayer({ className }: VideoPlayerProps) {
  const {
    currentVideo,
    activeView,
    setActiveView,
    activePlaylistVideos,
    setCurrentVideo,
    isPlaying,
    isOnBreak,
    settings,
    setIsPlaying,
    currentTimeSeconds,
    setCurrentTime,
    durationSeconds,
    setDuration,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
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
      const duration = event.target.getDuration();
      setDuration(duration);
      event.target.setVolume(isMuted ? 0 : volume);
      if (currentVideo) {
        updateMilestones(duration || currentVideo.durationSeconds);
      }
    },
    [currentVideo, updateMilestones, setDuration, volume, isMuted]
  );

  const onStateChange = useCallback(
    (event: YouTubeEvent) => {
      const state = event.data;
      // YouTube Player States: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
      setIsPlaying(state === 1);
      if (state === 1) {
        const dur = event.target.getDuration();
        if (dur) setDuration(dur);
      }
    },
    [setIsPlaying, setDuration]
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
    }, 500);

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

  const handleNextVideo = useCallback(() => {
    if (!currentVideo || activePlaylistVideos.length === 0) return;
    const currentIndex = activePlaylistVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex !== -1 && currentIndex < activePlaylistVideos.length - 1) {
      setCurrentVideo(activePlaylistVideos[currentIndex + 1]);
    } else {
      // Loop back to start or just stop? Let's loop for now if user wants.
      // setCurrentVideo(activePlaylistVideos[0]);
      alert("End of playlist");
    }
  }, [currentVideo, activePlaylistVideos, setCurrentVideo]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (playerRef.current) {
      playerRef.current.setVolume(newMuted ? 0 : volume);
    }
  };

  const handleClosePlayer = () => {
    setCurrentVideo(null);
    setIsPlaying(false);
  };

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

      {/* Custom Control Overlays */}
      <div
        className={cn(
          "absolute inset-0 z-30 flex flex-col transition-opacity duration-500",
          !showControls && isPlaying && "opacity-0 cursor-none"
        )}
      >
        {/* Top Header Bar */}
        <div className="h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-start justify-between px-6 pt-6">
          <button
            onClick={() => setActiveView("player")} // Just hide controls? or search?
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group/back"
            title="Back"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/back:bg-white/20 transition-colors">
              <ArrowLeft size={16} />
            </div>
            <span className="text-xs font-display uppercase tracking-[0.2em]">Library</span>
          </button>

          <div className="flex flex-col items-center max-w-[50%]">
            <span className="text-[10px] text-accent font-display uppercase tracking-[0.3em] mb-1">Now Playing</span>
            <h2 className="text-white text-sm font-display tracking-wide truncate w-full text-center">
              {currentVideo.title}
            </h2>
          </div>

          <button
            onClick={handleClosePlayer}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all"
            title="Close video"
          >
            <X size={18} />
          </button>
        </div>

        {/* Middle: Play/Pause Big Overlay */}
        <div
          className="flex-1 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          {!isPlaying && !isOnBreak && (
            <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white animate-in fade-in zoom-in duration-300">
              <Play size={32} fill="currentColor" className="ml-1" />
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent space-y-4">
          {/* Progress Bar */}
          <div className="group/seek relative h-1.5 flex items-center">
            <input
              type="range"
              min={0}
              max={durationSeconds || currentVideo.durationSeconds || 100}
              step={1}
              value={currentTimeSeconds}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-1 bg-white/20 appearance-none cursor-pointer rounded-full accent-accent hover:h-1.5 transition-all"
            />
            <div
              className="h-1 bg-accent rounded-full pointer-events-none transition-all group-hover/seek:h-1.5"
              style={{ width: `${(currentTimeSeconds / (durationSeconds || currentVideo.durationSeconds || 1)) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-accent transition-colors"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>

              {/* Next */}
              <button
                onClick={handleNextVideo}
                disabled={activePlaylistVideos.length === 0}
                className="text-white/70 hover:text-white transition-colors disabled:opacity-30"
                title="Next Video"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-3 group/volume">
                <button onClick={toggleMute} className="text-white/70 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 appearance-none cursor-pointer rounded-full accent-white"
                />
              </div>

              {/* Time */}
              <div className="text-white/70 text-[11px] font-mono tracking-wider">
                {formatDuration(currentTimeSeconds)} / {formatDuration(durationSeconds || currentVideo.durationSeconds)}
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Milestone Dots */}
              <div className="flex gap-2">
                {milestones.map((m) => (
                  <div
                    key={m.percent}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-500",
                      m.triggered ? "bg-accent scale-125 shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" : "bg-white/20"
                    )}
                  />
                ))}
              </div>

              {/* Gaze Toggles */}
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                <button
                  onClick={() =>
                    useStore.getState().updateSettings({
                      gazeEnabled: !settings.gazeEnabled,
                    })
                  }
                  className={cn(
                    "transition-colors",
                    settings.gazeEnabled ? "text-accent" : "text-white/30 hover:text-white/50"
                  )}
                  title={settings.gazeEnabled ? "Gaze Tracking Active" : "Gaze Tracking Paused"}
                >
                  {settings.gazeEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>

                <button
                  onClick={() => playerRef.current?.getIframe().requestFullscreen()}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube iframe - Bottom Layer */}
      <div className="absolute inset-0 bg-black pointer-events-none">
        <YouTube
          videoId={currentVideo.id}
          className="w-full h-full"
          iframeClassName="w-full h-full scale-[1.01]" // Tiny zoom to hide some yt borders
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 0, // HIDE YOUTUBE CONTROLS
              rel: 0,
              modestbranding: 1,
              fs: 0, // Disable native FS
              iv_load_policy: 3, // Hide annotations
              autohide: 1,
              enablejsapi: 1,
              origin: typeof window !== "undefined" ? window.location.origin : "",
              playsinline: 1,
            },
          }}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          onEnd={handleNextVideo}
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

      {/* Bottom Info Status (Secondary controls/info) */}
      <div className="h-10 bg-surface-1 border-t border-border flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <GazeIndicator status={gazeStatus} />
          <span className="text-[10px] text-text-muted font-display uppercase tracking-wider">
            Gaze System {settings.gazeEnabled ? "Active" : "Paused"}
          </span>
        </div>
        <div className="text-[10px] text-text-muted font-display uppercase tracking-wider">
          {activePlaylistVideos.length > 0 ? `Playlist: ${activePlaylistVideos.length} Items` : "Single Video Mode"}
        </div>
      </div>
    </div>
  );
}
