import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import type { YTVideo } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const completionPercent = Math.round((currentTime / duration) * 100);

      await supabase
        .from("watch_progress")
        .upsert({
          user_id: user.id,
          playlist_id: playlistId,
          video_id: video.id,
          youtube_video_id: video.id,
          watched_seconds: Math.floor(currentTime),
          total_seconds: Math.floor(duration),
          completion_percent: completionPercent,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,video_id",
        });

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
