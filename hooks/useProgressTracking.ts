import { useEffect, useRef, useCallback } from "react";
import type { YTVideo } from "@/types";

interface UseProgressTrackingProps {
  video: YTVideo | null;
  playlistId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export function useProgressTracking({
  video,
  playlistId,
  currentTime,
  duration,
  isPlaying,
}: UseProgressTrackingProps) {
  const lastSavedRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const updateProgress = useCallback(async () => {
    if (!video || !playlistId || currentTime === 0 || duration === 0) return;

    try {
      const res = await fetch("/api/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          playlistId: playlistId,
          secondsWatched: Math.floor(currentTime),
          durationSeconds: Math.floor(duration),
        }),
      });

      if (!res.ok) throw new Error("Failed to update progress");

      lastSavedRef.current = currentTime;
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }, [video, playlistId, currentTime, duration]);

  useEffect(() => {
    if (!isPlaying || !video || !playlistId) {
      clearTimeout(updateTimeoutRef.current);
      return;
    }

    const timeDiff = Math.abs(currentTime - lastSavedRef.current);

    if (timeDiff > 5) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(updateProgress, 2000);
    }

    return () => clearTimeout(updateTimeoutRef.current);
  }, [currentTime, isPlaying, video, playlistId, updateProgress]);

  useEffect(() => {
    return () => clearTimeout(updateTimeoutRef.current);
  }, []);
}
