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
  BookmarkCheck,
  Clock,
} from "lucide-react";

export function Sidebar() {
  const { currentVideo, currentPlaylistId, setCurrentVideo, setCurrentPlaylistId, watchLater } =
    useStore();

  const [playlists, setPlaylists] = useState<YTPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<Record<string, YTVideo[]>>({});
  const [loadingVideos, setLoadingVideos] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"playlists" | "watchlater">("playlists");

  // ─── Load Playlists ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchMyPlaylists()
      .then(setPlaylists)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ─── Expand Playlist ─────────────────────────────────────────────────────────

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

  return (
    <aside className="flex flex-col h-full bg-surface-1 border-r border-border w-72 shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <h2 className="font-display text-xs tracking-widest uppercase text-text-muted mb-3">
          Library
        </h2>
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-2 rounded-lg">
          <button
            onClick={() => setActiveTab("playlists")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-display tracking-wider uppercase transition-all",
              activeTab === "playlists"
                ? "bg-surface-4 text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <BookmarkCheck size={12} />
            Playlists
          </button>
          <button
            onClick={() => setActiveTab("watchlater")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-display tracking-wider uppercase transition-all",
              activeTab === "watchlater"
                ? "bg-surface-4 text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <Clock size={12} />
            Later
            {watchLater.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-accent/20 text-accent rounded-full text-xs tabular-nums">
                {watchLater.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "playlists" ? (
          <PlaylistList
            playlists={playlists}
            loading={loading}
            error={error}
            expandedPlaylistId={expandedPlaylistId}
            playlistVideos={playlistVideos}
            loadingVideos={loadingVideos}
            currentVideo={currentVideo}
            onTogglePlaylist={handleTogglePlaylist}
            onSelectVideo={(video) => setCurrentVideo(video)}
          />
        ) : (
          <WatchLaterList />
        )}
      </div>
    </aside>
  );
}

// ─── Playlist List ─────────────────────────────────────────────────────────────

function PlaylistList({
  playlists,
  loading,
  error,
  expandedPlaylistId,
  playlistVideos,
  loadingVideos,
  currentVideo,
  onTogglePlaylist,
  onSelectVideo,
}: {
  playlists: YTPlaylist[];
  loading: boolean;
  error: string | null;
  expandedPlaylistId: string | null;
  playlistVideos: Record<string, YTVideo[]>;
  loadingVideos: string | null;
  currentVideo: YTVideo | null;
  onTogglePlaylist: (p: YTPlaylist) => void;
  onSelectVideo: (v: YTVideo) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-danger text-xs font-display">{error}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {playlists.map((playlist) => (
        <div key={playlist.id}>
          {/* Playlist header */}
          <button
            onClick={() => onTogglePlaylist(playlist)}
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
              <p className="text-text-muted text-xs mt-0.5">
                {playlist.itemCount} videos •{" "}
                {playlist.privacy === "private" ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Lock size={9} />
                    private
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5">
                    <Globe size={9} />
                    public
                  </span>
                )}
              </p>
            </div>

            {/* Chevron */}
            {expandedPlaylistId === playlist.id ? (
              <ChevronDown size={14} className="text-text-muted shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-text-muted shrink-0" />
            )}
          </button>

          {/* Video list */}
          {expandedPlaylistId === playlist.id && (
            <div className="bg-surface">
              {loadingVideos === playlist.id ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-text-muted" />
                </div>
              ) : (
                (playlistVideos[playlist.id] ?? []).map((video) => (
                  <button
                    key={video.id}
                    onClick={() => onSelectVideo(video)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-2 transition-colors",
                      currentVideo?.id === video.id && "bg-accent/5 border-l-2 border-accent"
                    )}
                  >
                    {/* Thumbnail */}
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

                    {/* Info */}
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
  );
}

// ─── Watch Later List ──────────────────────────────────────────────────────────

function WatchLaterList() {
  const { watchLater, removeFromWatchLater, setCurrentVideo } = useStore();

  if (watchLater.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Clock size={28} className="text-text-muted mb-3" />
        <p className="text-text-secondary text-xs font-display">
          No videos saved yet
        </p>
        <p className="text-text-muted text-xs mt-1">
          Add videos from search to watch later
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {watchLater.map((item) => (
        <div key={item.videoId} className="group relative flex items-center gap-3 px-4 py-2 hover:bg-surface-2 transition-colors">
          {/* Thumbnail */}
          <button
            onClick={() =>
              setCurrentVideo({
                id: item.videoId,
                title: item.title,
                channelTitle: item.channelTitle,
                description: "",
                thumbnails: { default: { url: item.thumbnailUrl, width: 120, height: 90 } },
                publishedAt: "",
                duration: "",
                durationSeconds: item.durationSeconds,
              })
            }
            className="shrink-0"
          >
            <div className="w-14 h-8 rounded overflow-hidden bg-surface-3">
              <Image
                src={item.thumbnailUrl}
                alt=""
                width={56}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-xs line-clamp-2 leading-snug">
              {item.title}
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              {item.channelTitle} • {formatDuration(item.durationSeconds)}
            </p>
          </div>

          {/* Remove button */}
          <button
            onClick={() => removeFromWatchLater(item.videoId)}
            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all text-xs shrink-0"
            aria-label="Remove from watch later"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
