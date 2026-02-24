"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { useStore } from "@/stores/useStore";
import { useGazeDetection } from "@/hooks/useGazeDetection";
import { useInactivityAlert } from "@/hooks/useInactivityAlert";
import { BreakOverlay } from "./BreakOverlay";
import { InactivityAlert } from "./InactivityAlert";
import { 
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  className?: string;
}

export function VideoPlayer({ className }: VideoPlayerProps) {
  const {
    currentVideo,
    setActiveView,
    activePlaylistVideos,
    setCurrentVideo,
    isPlaying,
    isOnBreak,
    settings,
    setIsPlaying,
    setCurrentTime,
    setDuration,
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

  useGazeDetection({
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

      if (currentVideo) {
        updateMilestones(duration || currentVideo.durationSeconds);
      }
    },
    [currentVideo, updateMilestones, setDuration]
  );

  const onStateChange = useCallback(
    (event: YouTubeEvent) => {
      const state = event.data;
      // 1 = playing, 2 = paused
      setIsPlaying(state === 1);
      if (state === 1) {
        const dur = event.target.getDuration();
        if (dur) setDuration(dur);
      }
    },
    [setIsPlaying, setDuration]
  );

  // ─── Time Tracking ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(async () => {
      if (!playerRef.current) return;
      try {
        const time = await playerRef.current.getCurrentTime();
        setCurrentTime(time);
        const shouldBreak = checkMilestone(time);
        if (shouldBreak) {
          playerRef.current.pauseVideo();
          triggerBreak();
        }
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime, checkMilestone, triggerBreak]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

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
    }
  }, [currentVideo, activePlaylistVideos, setCurrentVideo]);

  const handleClosePlayer = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    setCurrentVideo(null);
    setIsPlaying(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!currentVideo) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full text-muted", className)}>
        <div className="text-center space-y-4">
          <p className="font-display font-medium text-lg text-foreground">
            No video selected
          </p>
          <p className="text-sm opacity-60">Select a video from your library to focus</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black h-full overflow-hidden flex flex-col font-sans select-none", className)}
    >
      {/* Hidden webcam for gaze tracking */}
      <video
        ref={webcamRef}
        autoPlay
        muted
        playsInline
        className="absolute opacity-0 pointer-events-none w-px h-px" 
        aria-hidden="true"
      />

      {/* Top Bar for Navigation */}
      <div className="absolute top-0 left-0 right-0 z-30 h-16 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => setActiveView("player")} 
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 group pointer-events-auto"
        >
          <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-sm">
             <ChevronLeft size={20} />
          </div>
        </button>

        <button 
           onClick={handleClosePlayer}
           className="text-white/60 hover:text-red-400 transition-colors p-2 font-medium text-xs tracking-wider uppercase pointer-events-auto"
        >
           Close Player
        </button>
      </div>

      {/* Main Video Layer - Default YouTube Player */}
      <div className="flex-1 bg-black">
        <YouTube
          videoId={currentVideo.id}
          className="w-full h-full"
          iframeClassName="w-full h-full"
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 1, // Enable default YouTube controls
              rel: 0,
              modestbranding: 1,
              fs: 1, // Enable fullscreen button
              cc_load_policy: 1,
              playsinline: 1,
            },
          }}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          onEnd={handleNextVideo}
        />
      </div>

      {/* Overlays: Break & Inactivity (Higher Z) */}
      {isOnBreak && <BreakOverlay milestones={milestones} onBreakEnd={handleBreakEnd} />}
      {inactivityPaused && <InactivityAlert onDismiss={() => { setInactivityPaused(false); playerRef.current?.playVideo(); }} />}
    </div>
  );
}
