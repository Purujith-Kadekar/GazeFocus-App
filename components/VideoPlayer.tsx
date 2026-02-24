"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useStore } from "@/stores/useStore";
import { useGazeDetection } from "@/hooks/useGazeDetection";
import { useInactivityAlert } from "@/hooks/useInactivityAlert";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { BreakOverlay } from "./BreakOverlay";
import { InactivityAlert } from "./InactivityAlert";
import { CustomVideoPlayer } from "./CustomVideoPlayer";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  className?: string;
}

export function VideoPlayer({ className }: VideoPlayerProps) {
  const {
    currentVideo,
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

  const {
    currentTimeSeconds,
    durationSeconds,
    currentPlaylistId,
  } = useStore((state) => ({
    currentTimeSeconds: state.currentTimeSeconds,
    durationSeconds: state.durationSeconds,
    currentPlaylistId: state.currentPlaylistId,
  }));

  const containerRef = useRef<HTMLDivElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);

  const [inactivityPaused, setInactivityPaused] = useState(false);

  useProgressTracking({
    video: currentVideo,
    playlistId: currentPlaylistId,
    currentTime: currentTimeSeconds,
    duration: durationSeconds,
    isPlaying,
  });

  const handleGazeAway = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    }
  }, [isPlaying, setIsPlaying]);

  const handleGazeReturn = useCallback(() => {
    if (!isOnBreak && !inactivityPaused) {
      setIsPlaying(true);
    }
  }, [isOnBreak, inactivityPaused, setIsPlaying]);

  const handleInactive = useCallback(() => {
    setInactivityPaused(true);
    setIsPlaying(false);
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

  const handleNextVideo = useCallback(() => {
    if (!currentVideo || activePlaylistVideos.length === 0) return;
    const currentIndex = activePlaylistVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex !== -1 && currentIndex < activePlaylistVideos.length - 1) {
      setCurrentVideo(activePlaylistVideos[currentIndex + 1]);
    }
  }, [currentVideo, activePlaylistVideos, setCurrentVideo]);

  const handlePreviousVideo = useCallback(() => {
    if (!currentVideo || activePlaylistVideos.length === 0) return;
    const currentIndex = activePlaylistVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > 0) {
      setCurrentVideo(activePlaylistVideos[currentIndex - 1]);
    }
  }, [currentVideo, activePlaylistVideos, setCurrentVideo]);

  const handleBreakEnd = useCallback(() => {
    endBreak();
    setIsPlaying(true);
  }, [endBreak, setIsPlaying]);

  const handleClosePlayer = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    setCurrentVideo(null);
    setIsPlaying(false);
  };

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, [setCurrentTime]);

  const handlePlayerStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, [setIsPlaying]);

  useEffect(() => {
    if (currentVideo) {
      setDuration(currentVideo.durationSeconds);
      updateMilestones(currentVideo.durationSeconds);
    }
  }, [currentVideo, setDuration, updateMilestones]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(currentTimeSeconds + 0.5);
      const newTime = currentTimeSeconds + 0.5;
      if (newTime >= (currentVideo?.durationSeconds || 0)) {
        handleNextVideo();
      } else {
        const shouldBreak = checkMilestone(newTime);
        if (shouldBreak) {
          setIsPlaying(false);
          triggerBreak();
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, currentVideo, setCurrentTime, checkMilestone, triggerBreak, handleNextVideo, setIsPlaying, currentTimeSeconds]);

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
      <video
        ref={webcamRef}
        autoPlay
        muted
        playsInline
        className="absolute opacity-0 pointer-events-none w-px h-px"
        aria-hidden="true"
      />

      <CustomVideoPlayer
        videoId={currentVideo.id}
        title={currentVideo.title}
        onTimeUpdate={handleTimeUpdate}
        onStateChange={handlePlayerStateChange}
        onNext={handleNextVideo}
        onPrevious={handlePreviousVideo}
        onClose={handleClosePlayer}
      />

      {isOnBreak && <BreakOverlay milestones={milestones} onBreakEnd={handleBreakEnd} />}
      {inactivityPaused && <InactivityAlert onDismiss={() => { setInactivityPaused(false); setIsPlaying(true); }} />}
    </div>
  );
}
