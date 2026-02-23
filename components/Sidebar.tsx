"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useStore } from "@/stores/useStore";
import { fetchMyPlaylists, fetchPlaylistVideos, createPlaylist, fetchPlaylistInfo, extractPlaylistId, formatDuration } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import type { YTPlaylist, YTVideo } from "@/types";
import {
  ChevronRight,
  ChevronDown,
  PlayCircle,
  Loader2,
  RefreshCw,
  Plus,
  X,
  Link,
  Trash2,
} from "lucide-react";
import { deletePlaylist, removePlaylistItem } from "@/lib/youtube";

const IMPORTED_KEY = "gazefocus-imported-playlists";

export function Sidebar() {
  const {
    currentVideo,
    setCurrentVideo,
    setCurrentPlaylistId,
    playlistRefreshTrigger,
    setActivePlaylistVideos
  } = useStore();

  const [playlists, setPlaylists] = useState<YTPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<Record<string, YTVideo[]>>({});
  const [loadingVideos, setLoadingVideos] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Load saved imported playlist IDs from localStorage
  const getImportedIds = useCallback((): string[] => {
    try {
      if (typeof window === "undefined") return [];
      return JSON.parse(localStorage.getItem(IMPORTED_KEY) || "[]");
    } catch {
      return [];
    }
  }, []);

  const saveImportedId = (id: string) => {
    const ids = getImportedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(IMPORTED_KEY, JSON.stringify(ids));
    }
  };

  const removeImportedId = (id: string) => {
    const ids = getImportedIds().filter((i) => i !== id);
    localStorage.setItem(IMPORTED_KEY, JSON.stringify(ids));
  };

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch user's own playlists from YouTube
      const ownPlaylists = await fetchMyPlaylists();

      // Fetch imported external playlists
      const importedIds = getImportedIds();
      const importedPlaylists: YTPlaylist[] = [];
      for (const id of importedIds) {
        try {
          const pl = await fetchPlaylistInfo(id);
          importedPlaylists.push(pl);
        } catch {
          // Skip invalid/deleted playlists
        }
      }

      setPlaylists([...ownPlaylists, ...importedPlaylists]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }, [getImportedIds]);

  useEffect(() => {
    loadPlaylists();
  }, [playlistRefreshTrigger, loadPlaylists]);

  const loadFullPlaylist = useCallback(async (playlistId: string) => {
    setLoadingVideos(playlistId);
    try {
      let allVideos: YTVideo[] = [];
      let pageToken: string | undefined = undefined;

      // Keep fetching until no more pages
      do {
        const result: { videos: YTVideo[]; nextPageToken?: string } = await fetchPlaylistVideos(playlistId, pageToken);
        allVideos = [...allVideos, ...result.videos];
        pageToken = result.nextPageToken;

        // Safety cap to avoid infinite loops or memory issues for massive playlists (> 500)
        if (allVideos.length > 500) break;
      } while (pageToken);

      setPlaylistVideos((prev) => ({ ...prev, [playlistId]: allVideos }));
      // Update store for Next Video logic
      setActivePlaylistVideos(allVideos);
    } catch (e) {
      console.error("Failed to load full playlist:", e);
    } finally {
      setLoadingVideos(null);
    }
  }, [setActivePlaylistVideos]);

  const handleTogglePlaylist = (playlist: YTPlaylist) => {
    const isExpanding = expandedPlaylistId !== playlist.id;
    setExpandedPlaylistId(isExpanding ? playlist.id : null);
    setCurrentPlaylistId(playlist.id);

    if (isExpanding) {
      if (!playlistVideos[playlist.id]) {
        loadFullPlaylist(playlist.id);
      } else {
        setActivePlaylistVideos(playlistVideos[playlist.id]);
      }
    }
  };

  const handleDeletePlaylist = async (id: string, isImported: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
      if (isImported) {
        removeImportedId(id);
      } else {
        await deletePlaylist(id);
      }
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      if (expandedPlaylistId === id) setExpandedPlaylistId(null);
    } catch {
      alert("Failed to delete playlist. It might be a system playlist.");
    }
  };

  const handleRemoveVideo = async (playlistId: string, playlistItemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this video from the playlist?")) return;

    try {
      await removePlaylistItem(playlistItemId);
      setPlaylistVideos((prev) => {
        const updated = (prev[playlistId] ?? []).filter(v => v.playlistItemId !== playlistItemId);
        setActivePlaylistVideos(updated);
        return { ...prev, [playlistId]: updated };
      });
    } catch {
      alert("Failed to remove video.");
    }
  };

  const handleRefreshPlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    loadFullPlaylist(playlistId);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || creating) return;
    setCreating(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim(), "private");
      setPlaylists((prev) => [newPlaylist, ...prev]);
      setNewPlaylistName("");
      setShowCreateForm(false);
    } catch {
      alert("Failed to create playlist. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleImportPlaylist = async () => {
    if (!importUrl.trim() || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const playlistId = extractPlaylistId(importUrl.trim());
      if (!playlistId) {
        setImportError("Invalid URL. Paste a YouTube playlist URL.");
        return;
      }
      // Check if already exists
      if (playlists.some((p) => p.id === playlistId)) {
        setImportError("Playlist already added.");
        return;
      }
      const pl = await fetchPlaylistInfo(playlistId);
      saveImportedId(playlistId);
      setPlaylists((prev) => [...prev, pl]);
      setImportUrl("");
      setShowImportForm(false);
    } catch {
      setImportError("Could not find playlist. Check the URL.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <aside className="flex flex-col h-full w-full bg-surface-1 shrink-0 select-none">
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

      {/* Create Playlist */}
      <div className="px-4 py-2 border-b border-border">
        {showCreateForm ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
              placeholder="Playlist name…"
              className="flex-1 px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent/50"
              autoFocus
            />
            <button
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim() || creating}
              className="text-accent hover:text-accent-dim disabled:opacity-40 transition-colors"
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setNewPlaylistName(""); }}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 text-text-muted hover:text-accent text-xs font-display tracking-wider transition-colors"
          >
            <Plus size={12} />
            Create playlist
          </button>
        )}
      </div>

      {/* Import Playlist by URL */}
      <div className="px-4 py-2 border-b border-border">
        {showImportForm ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => { setImportUrl(e.target.value); setImportError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleImportPlaylist()}
                placeholder="Paste YouTube playlist URL…"
                className="flex-1 px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent/50"
                autoFocus
              />
              <button
                onClick={handleImportPlaylist}
                disabled={!importUrl.trim() || importing}
                className="text-accent hover:text-accent-dim disabled:opacity-40 transition-colors"
              >
                {importing ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
              </button>
              <button
                onClick={() => { setShowImportForm(false); setImportUrl(""); setImportError(null); }}
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            {importError && (
              <p className="text-danger text-xs">{importError}</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowImportForm(true)}
            className="flex items-center gap-1.5 text-text-muted hover:text-accent text-xs font-display tracking-wider transition-colors"
          >
            <Link size={12} />
            Import playlist by URL
          </button>
        )}
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
          <div className="px-4 py-6 text-center space-y-2">
            <p className="text-text-muted text-xs font-display">No playlists found</p>
            <p className="text-text-muted text-xs leading-relaxed">
              Create a playlist above to get started! Videos you add will sync to your YouTube account.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {playlists.map((playlist) => (
              <div key={playlist.id}>
                {/* Playlist row */}
                <button
                  onClick={() => handleTogglePlaylist(playlist)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2 transition-colors group"
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
                    <p className="text-text-muted text-xs mt-0.5 truncate">
                      {playlist.itemCount} videos
                    </p>
                  </div>

                  {!playlist.isSpecial && (
                    <button
                      onClick={(e) => handleDeletePlaylist(playlist.id, getImportedIds().includes(playlist.id), e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-danger translation-all rounded-md hover:bg-surface-3 mr-1"
                      title="Delete playlist"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}

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
                        <div key={video.playlistItemId || video.id} className="relative group/video">
                          <button
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

                          {video.playlistItemId && !playlist.isSpecial && (
                            <button
                              onClick={(e) => handleRemoveVideo(playlist.id, video.playlistItemId!, e)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/video:opacity-100 p-1 text-text-muted hover:text-danger rounded hover:bg-surface-3 transition-opacity"
                              title="Remove from playlist"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
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
