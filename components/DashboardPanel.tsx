"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart3, Clock, CheckCircle2, Video, TrendingUp, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PlaylistStats {
  id: string;
  name: string;
  totalVideos: number;
  watchedVideos: number;
  completionPercent: number;
  totalWatchTime: number;
}

interface DashboardStats {
  totalPlaylists: number;
  completedPlaylists: number;
  totalVideosWatched: number;
  totalWatchTime: number;
  playlistStats: PlaylistStats[];
}

export function DashboardPanel() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPlaylists: 0,
    completedPlaylists: 0,
    totalVideosWatched: 0,
    totalWatchTime: 0,
    playlistStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const { data: playlistProgress, error: err1 } = await supabase
        .from("playlist_progress")
        .select(`
          id,
          playlist_id,
          watched_videos,
          total_videos,
          completion_percent,
          total_watch_time_seconds
        `)
        .eq("user_id", user.id);

      if (err1) throw err1;

      const { data: playlists, error: err2 } = await supabase
        .from("user_playlists")
        .select("id, name")
        .eq("user_id", user.id);

      if (err2) throw err2;

      const playlistMap = new Map(playlists?.map(p => [p.id, p.name]) || []);

      const playlistStats: PlaylistStats[] = (playlistProgress || []).map(pp => ({
        id: pp.playlist_id,
        name: playlistMap.get(pp.playlist_id) || "Unknown",
        totalVideos: pp.total_videos || 0,
        watchedVideos: pp.watched_videos || 0,
        completionPercent: pp.completion_percent || 0,
        totalWatchTime: pp.total_watch_time_seconds || 0,
      }));

      const totalVideosWatched = playlistStats.reduce((sum, p) => sum + p.watchedVideos, 0);
      const totalWatchTime = playlistStats.reduce((sum, p) => sum + p.totalWatchTime, 0);
      const completedPlaylists = playlistStats.filter(p => p.completionPercent >= 100).length;

      setStats({
        totalPlaylists: playlistStats.length,
        completedPlaylists,
        totalVideosWatched,
        totalWatchTime,
        playlistStats: playlistStats.sort((a, b) => b.completionPercent - a.completionPercent),
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return (
    <div className="flex flex-col h-full bg-surface-1">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={14} className="text-accent" />
          <h2 className="font-display text-xs tracking-widest uppercase text-text-muted">
            Dashboard
          </h2>
        </div>
        <p className="text-text-muted text-xs">Your learning progress</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="px-4 py-3 bg-danger/10 border-b border-danger/20 text-danger text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-3 bg-surface-2 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-xs">Playlists</span>
                  <Video size={12} className="text-accent" />
                </div>
                <p className="text-text-primary font-display text-lg">
                  {stats.totalPlaylists}
                </p>
              </div>

              <div className="px-3 py-3 bg-surface-2 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-xs">Completed</span>
                  <CheckCircle2 size={12} className="text-success" />
                </div>
                <p className="text-text-primary font-display text-lg">
                  {stats.completedPlaylists}
                </p>
              </div>

              <div className="px-3 py-3 bg-surface-2 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-xs">Videos</span>
                  <TrendingUp size={12} className="text-accent" />
                </div>
                <p className="text-text-primary font-display text-lg">
                  {stats.totalVideosWatched}
                </p>
              </div>

              <div className="px-3 py-3 bg-surface-2 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-xs">Watch Time</span>
                  <Clock size={12} className="text-warning" />
                </div>
                <p className="text-text-primary font-display text-lg">
                  {Math.floor(stats.totalWatchTime / 3600)}h
                </p>
              </div>
            </div>

            {/* Playlists Progress */}
            {stats.playlistStats.length > 0 && (
              <div className="space-y-2">
                <p className="text-text-muted text-xs font-display px-1">Playlist Progress</p>
                <div className="space-y-2">
                  {stats.playlistStats.map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between px-2">
                        <p className="text-text-primary text-xs truncate">{p.name}</p>
                        <p className="text-text-muted text-xs shrink-0 ml-2">
                          {p.watchedVideos}/{p.totalVideos}
                        </p>
                      </div>
                      <div className="relative h-2 bg-surface-2 rounded-full overflow-hidden border border-border">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            p.completionPercent >= 100
                              ? "bg-success"
                              : p.completionPercent >= 75
                              ? "bg-accent"
                              : p.completionPercent >= 50
                              ? "bg-warning"
                              : "bg-info"
                          )}
                          style={{ width: `${Math.min(100, p.completionPercent)}%` }}
                        />
                      </div>
                      <p className="text-text-muted text-xs text-right">
                        {p.completionPercent}% • {formatTime(p.totalWatchTime)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.playlistStats.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <BarChart3 size={24} className="mx-auto text-text-muted/50" />
                <p className="text-text-muted text-xs">No playlists yet</p>
                <p className="text-text-muted text-xs text-sm leading-relaxed">
                  Your progress will appear here as you watch videos
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
