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
  const containerRef = useRef<HTMLDivElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [inactivityPaused, setInactivityPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("auto");
  const [showQualityMenu, setShowQualityMenu] = useState(false);

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

      // Quality
      const levels = event.target.getAvailableQualityLevels();
      setAvailableQualities(levels);

      // Try to force high quality
      if (levels.length > 0) {
        const highest = levels[0]; // Usually first is highest in YT API
        event.target.setPlaybackQuality(highest);
        setCurrentQuality(highest);
      } else {
        setCurrentQuality(event.target.getPlaybackQuality());
      }

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
      alert("End of playlist");
    }
  }, [currentVideo, activePlaylistVideos, setCurrentVideo]);

  const handlePrevVideo = useCallback(() => {
    if (!currentVideo || activePlaylistVideos.length === 0) return;
    const currentIndex = activePlaylistVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > 0) {
      setCurrentVideo(activePlaylistVideos[currentIndex - 1]);
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

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRateState(rate);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);
    if (playerRef.current) {
      playerRef.current.setPlaybackQuality(quality);
    }
    setShowQualityMenu(false);
  };

  const toggleCaptions = () => {
    if (!playerRef.current) return;
    const next = !captionsEnabled;
    setCaptionsEnabled(next);

    if (next) {
      playerRef.current.loadModule("captions");
      playerRef.current.setOption("captions", "track", { languageCode: "en" });
    } else {
      playerRef.current.unloadModule("captions");
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
      ref={containerRef}
      className={cn("relative flex flex-col h-full bg-surface overflow-hidden", className)}
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

      {/* Custom Control Overlays - Higher Z-index for Fullscreen */}
      <div
        className={cn(
          "absolute inset-0 z-50 flex flex-col transition-opacity duration-500",
          !showControls && isPlaying && "opacity-0 cursor-none"
        )}
      >
        {/* Top Header Bar */}
        <div className="h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-start justify-between px-6 pt-6 text-white">
          <button
            onClick={() => setActiveView("player")}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group/back"
            title="Back"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/back:bg-white/20 transition-colors text-white">
              <ArrowLeft size={16} />
            </div>
            <span className="text-xs font-display uppercase tracking-[0.2em] text-white">Library</span>
          </button>

          <div className="flex flex-col items-center max-w-[50%]">
            <span className="text-[10px] text-accent font-display uppercase tracking-[0.3em] mb-1">Now Playing</span>
            <h2 className="text-white text-sm font-display tracking-wide truncate w-full text-center">
              {currentVideo.title}
            </h2>
          </div>

          <button
            onClick={handleClosePlayer}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all text-white"
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
            <div className="group flex flex-col items-center gap-6 z-50">
              <div className="w-28 h-28 rounded-full bg-accent/10 backdrop-blur-2xl border border-accent/30 flex items-center justify-center text-white shadow-[0_0_100px_rgba(var(--accent-rgb),0.2)] group-hover:scale-105 group-hover:bg-accent/20 transition-all duration-700 animate-in fade-in zoom-in-90">
                <Play size={48} fill="currentColor" className="ml-2 text-accent" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-accent font-display text-xs uppercase tracking-[0.5em] opacity-80 group-hover:opacity-100 transition-opacity">
                  Video Paused
                </p>
                <p className="text-text-muted font-display text-[9px] uppercase tracking-[0.3em]">
                  Click to continue learning
                </p>
              </div>
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
              className="absolute inset-0 w-full h-1 bg-white/20 appearance-none cursor-pointer rounded-full accent-accent hover:h-1.5 transition-all outline-none"
            />
            <div
              className="h-1 bg-accent rounded-full pointer-events-none transition-all group-hover/seek:h-1.5"
              style={{ width: `${(currentTimeSeconds / (durationSeconds || currentVideo.durationSeconds || 1)) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-white text-sm">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-accent transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>

              {/* Prev */}
              <button
                onClick={handlePrevVideo}
                disabled={activePlaylistVideos.length === 0 || activePlaylistVideos.findIndex(v => v.id === currentVideo.id) === 0}
                className="text-white/70 hover:text-white transition-colors disabled:opacity-20"
                title="Previous Video"
              >
                <div className="rotate-180">
                  <SkipForward size={20} fill="currentColor" />
                </div>
              </button>

              {/* Next */}
              <button
                onClick={handleNextVideo}
                disabled={activePlaylistVideos.length === 0 || activePlaylistVideos.findIndex(v => v.id === currentVideo.id) === activePlaylistVideos.length - 1}
                className="text-white/70 hover:text-white transition-colors disabled:opacity-20"
                title="Next Video"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>

              {/* Time */}
              <div className="text-white/70 text-[11px] font-mono tracking-wider ml-2">
                {formatDuration(Math.floor(currentTimeSeconds))} / {formatDuration(Math.floor(durationSeconds || currentVideo.durationSeconds))}
              </div>
            </div>

            <div className="flex items-center gap-6 text-white">
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

                {/* Captions */}
                <button
                  onClick={toggleCaptions}
                  className={cn(
                    "flex items-center justify-center p-1 rounded transition-all",
                    captionsEnabled ? "text-accent bg-accent/10 border border-accent/20" : "text-white/50 hover:text-white"
                  )}
                  title="Captions"
                >
                  <span className="text-[10px] font-bold tracking-tighter border border-current px-0.5 rounded-sm">CC</span>
                </button>

                {/* Quality Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-[10px] uppercase font-display tracking-widest"
                    title="Video Quality"
                  >
                    <Settings size={14} className={cn("transition-transform", showQualityMenu && "rotate-90")} />
                    <span>{currentQuality.toUpperCase()}</span>
                  </button>

                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-4 w-32 bg-surface-1 border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-[100]">
                      <div className="p-2 border-b border-border bg-surface-2 text-[10px] text-text-muted uppercase font-display tracking-widest text-center">
                        Quality
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {availableQualities.map((q) => (
                          <button
                            key={q}
                            onClick={() => handleQualityChange(q)}
                            className={cn(
                              "w-full px-4 py-2 text-left text-[11px] hover:bg-surface-3 transition-colors uppercase font-display",
                              currentQuality === q ? "text-accent bg-accent/5" : "text-text-secondary"
                            )}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Speed Slider */}
                <div className="flex items-center gap-3 group/speed">
                  <span className="text-[10px] text-white/50 uppercase font-display tracking-widest group-hover/speed:text-accent transition-colors">Speed</span>
                  <input
                    type="range"
                    min={0.25}
                    max={2}
                    step={0.25}
                    value={playbackRate}
                    onChange={handleRateChange}
                    className="w-20 h-1 bg-white/20 appearance-none cursor-pointer rounded-full accent-accent"
                  />
                  <span className="text-[11px] font-mono text-white/90 w-12">{playbackRate.toFixed(2)}x</span>
                </div>

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

                {/* Maximize */}
                <button
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      containerRef.current?.requestFullscreen();
                    }
                  }}
                  className="text-white/50 hover:text-white transition-colors"
                  title="Fullscreen"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube iframe - Bottom Layer */}
      <div className="absolute inset-0 bg-black pointer-events-none overflow-hidden">
        {/* Adjusted centering to hide only the very edges while keeping captions clear */}
        <div className="absolute -left-[1px] -right-[1px] -top-[1px] -bottom-[40px] flex items-center justify-center">
          <YouTube
            videoId={currentVideo.id}
            className="w-full h-full"
            iframeClassName="w-full h-full"
            opts={{
              width: "100%",
              height: "100%",
              playerVars: {
                autoplay: 1,
                controls: 0,
                rel: 0,
                modestbranding: 1,
                fs: 0,
                cc_load_policy: 1,
                cc_lang_pref: "en",
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
        </div>

        {/* Global Pause Mask - 100% Opaque to block all YT UI */}
        <div
          className={cn(
            "absolute inset-0 z-[25] transition-all duration-700 pointer-events-auto",
            !isPlaying && !isOnBreak ? "bg-black opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={togglePlay}
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
