"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useStore } from "@/stores/useStore";
import { fetchMyPlaylists, fetchPlaylistVideos, formatDuration } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import type { YTPlaylist, YTVideo } from "@/types";
import {
  ChevronRight,
  ChevronDown,
  Lock,
  Globe,
  PlayCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export function Sidebar() {
  const { currentVideo, setCurrentVideo, setCurrentPlaylistId, playlistRefreshTrigger } = useStore();

  const [playlists, setPlaylists] = useState<YTPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<Record<string, YTVideo[]>>({});
  const [loadingVideos, setLoadingVideos] = useState<string | null>(null);

  const loadPlaylists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyPlaylists();
      setPlaylists(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, [playlistRefreshTrigger]);

  const handleTogglePlaylist = async (playlist: YTPlaylist) => {
    if (expandedPlaylistId === playlist.id) {
      setExpandedPlaylistId(null);
      return;
    }
    setExpandedPlaylistId(playlist.id);
    setCurrentPlaylistId(playlist.id);

    if (!playlistVideos[playlist.id]) {
      setLoadingVideos(playlist.id);
      try {
        const { videos } = await fetchPlaylistVideos(playlist.id);
        setPlaylistVideos((prev) => ({ ...prev, [playlist.id]: videos }));
      } catch {
        // ignore
      } finally {
        setLoadingVideos(null);
      }
    }
  };

  const handleRefreshPlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingVideos(playlistId);
    try {
      const { videos } = await fetchPlaylistVideos(playlistId);
      setPlaylistVideos((prev) => ({ ...prev, [playlistId]: videos }));
    } catch {
      // ignore
    } finally {
      setLoadingVideos(null);
    }
  };

  return (
    <aside className="flex flex-col h-full bg-surface-1 border-r border-border w-72 shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display text-xs tracking-widest uppercase text-text-muted">
            Your YouTube Library
          </h2>
          <p className="text-text-muted text-xs mt-0.5">Synced from your account</p>
        </div>
        <button
          onClick={loadPlaylists}
          disabled={loading}
          className="text-text-muted hover:text-text-secondary transition-colors"
          title="Refresh playlists"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center space-y-3">
            <p className="text-danger text-xs font-display">{error}</p>
            <button
              onClick={loadPlaylists}
              className="text-xs text-text-secondary hover:text-text-primary underline"
            >
              Try again
            </button>
          </div>
        ) : playlists.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-text-muted text-xs font-display">No playlists found</p>
          </div>
        ) : (
          <div className="py-2">
            {playlists.map((playlist) => (
              <div key={playlist.id}>
                {/* Playlist row */}
                <button
                  onClick={() => handleTogglePlaylist(playlist)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 transition-colors group",
                    expandedPlaylistId === playlist.id && "bg-surface-2"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-7 rounded overflow-hidden bg-surface-3 shrink-0">
                    {playlist.thumbnails.default?.url && (
                      <Image
                        src={playlist.thumbnails.default.url}
                        alt=""
                        width={40}
                        height={28}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-xs font-display truncate leading-tight">
                      {playlist.title}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
                      {playlist.itemCount} videos •{" "}
                      {playlist.privacy === "private" ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Lock size={9} /> private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5">
                          <Globe size={9} /> public
                        </span>
                      )}
                    </p>
                  </div>

                  {expandedPlaylistId === playlist.id ? (
                    <ChevronDown size={14} className="text-text-muted shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-text-muted shrink-0" />
                  )}
                </button>

                {/* Video list */}
                {expandedPlaylistId === playlist.id && (
                  <div className="bg-surface">
                    {/* Refresh bar */}
                    <div className="flex items-center justify-end px-4 py-1 border-b border-border/50">
                      <button
                        onClick={(e) => handleRefreshPlaylist(playlist.id, e)}
                        className="flex items-center gap-1 text-text-muted hover:text-text-secondary text-xs"
                      >
                        <RefreshCw size={10} />
                        Sync
                      </button>
                    </div>

                    {loadingVideos === playlist.id ? (
                      <div className="flex justify-center py-4">
                        <Loader2 size={16} className="animate-spin text-text-muted" />
                      </div>
                    ) : (playlistVideos[playlist.id] ?? []).length === 0 ? (
                      <p className="text-text-muted text-xs text-center py-4">
                        No videos in this playlist
                      </p>
                    ) : (
                      (playlistVideos[playlist.id] ?? []).map((video) => (
                        <button
                          key={video.id}
                          onClick={() => setCurrentVideo(video)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-2 transition-colors",
                            currentVideo?.id === video.id &&
                            "bg-accent/5 border-l-2 border-accent"
                          )}
                        >
                          <div className="relative w-14 h-8 rounded overflow-hidden bg-surface-3 shrink-0">
                            {video.thumbnails.default?.url && (
                              <Image
                                src={video.thumbnails.default.url}
                                alt=""
                                width={56}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {currentVideo?.id === video.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <PlayCircle size={14} className="text-accent" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-text-primary text-xs leading-snug line-clamp-2">
                              {video.title}
                            </p>
                            <p className="text-text-muted text-xs mt-0.5">
                              {formatDuration(video.durationSeconds)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
