"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useStore } from "@/stores/useStore";
import { useSearchLeash } from "@/hooks/useSearchLeash";
import { searchVideos, fetchMyPlaylists, addVideoToPlaylist, formatDuration } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import type { SearchResult, YTPlaylist } from "@/types";
import {
  Search,
  Timer,
  Lock,
  Plus,
  Clock,
  Play,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";

export function SearchPanel() {
  const { searchLeash, setCurrentVideo, addToWatchLater } = useStore();
  const { formattedTime, warningLevel, isLocked, isActive, startLeash, resetLeash } =
    useSearchLeash();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<YTPlaylist[]>([]);
  const [showAddModal, setShowAddModal] = useState<SearchResult | null>(null);
  const [addedVideoIds, setAddedVideoIds] = useState<Set<string>>(new Set());
  const [watchLaterIds, setWatchLaterIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Load playlists for "add to playlist" modal
  useEffect(() => {
    fetchMyPlaylists().then(setPlaylists).catch(() => {});
  }, []);

  // Start leash on first search interaction
  const handleFocus = () => {
    if (!isActive) startLeash();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLocked) return;
    if (!isActive) startLeash();

    setSearching(true);
    setSearchError(null);
    try {
      const { results } = await searchVideos(query.trim());
      setResults(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleAddToPlaylist = async (video: SearchResult, playlistId: string) => {
    try {
      await addVideoToPlaylist(video.id, playlistId);
      setAddedVideoIds((prev) => new Set([...prev, video.id]));
      setShowAddModal(null);
    } catch {
      alert("Failed to add to playlist. Try again.");
    }
  };

  const handleWatchLater = (video: SearchResult) => {
    const thumbnail = video.thumbnails.medium?.url ?? video.thumbnails.default?.url ?? "";
    addToWatchLater({
      videoId: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: thumbnail,
      durationSeconds: video.durationSeconds,
      addedAt: Date.now(),
    });
    setWatchLaterIds((prev) => new Set([...prev, video.id]));
  };

  const handleWatchNow = (video: SearchResult) => {
    setCurrentVideo({
      ...video,
      playlistItemId: undefined,
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header with timer */}
      <div className="px-6 py-4 border-b border-border bg-surface-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-sm tracking-widest uppercase text-text-primary">
              Focused Search
            </h2>
            <p className="text-text-muted text-xs mt-0.5">
              Add videos to playlists — no rabbit holes allowed
            </p>
          </div>

          {/* Leash Timer */}
          {isActive && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-display text-sm tabular-nums transition-colors",
                warningLevel === "critical"
                  ? "bg-danger/10 border-danger/30 text-danger"
                  : warningLevel === "warning"
                  ? "bg-warn/10 border-warn/30 text-warn"
                  : "bg-surface-2 border-border text-text-secondary"
              )}
              aria-label={`Search time remaining: ${formattedTime}`}
              aria-live="polite"
            >
              <Timer size={14} />
              {formattedTime}
            </div>
          )}
        </div>

        {/* Warning banners */}
        {warningLevel === "warning" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warn/10 border border-warn/20 rounded-lg mb-3 animate-fade-in">
            <AlertTriangle size={14} className="text-warn shrink-0" />
            <p className="text-warn text-xs">5 minutes left — still not finished searching? Wrap it up!</p>
          </div>
        )}
        {warningLevel === "critical" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg mb-3 animate-fade-in">
            <AlertTriangle size={14} className="text-danger shrink-0" />
            <p className="text-danger text-xs">Under a minute — time to stop doomscrolling!</p>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder="Search YouTube videos…"
              disabled={isLocked}
              className={cn(
                "w-full pl-9 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-text-primary text-sm placeholder:text-text-muted",
                "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors",
                isLocked && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>
          <button
            type="submit"
            disabled={isLocked || searching || !query.trim()}
            className={cn(
              "px-4 py-2 bg-accent text-surface font-display text-xs tracking-wider uppercase rounded-lg transition-colors",
              "hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : "Search"}
          </button>
        </form>
      </div>

      {/* Locked state */}
      {isLocked && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center">
            <Lock size={24} className="text-danger" />
          </div>
          <div>
            <h3 className="font-display text-lg text-text-primary mb-1">Search Locked</h3>
            <p className="text-text-secondary text-sm">
              Your 15-minute search session has ended. Return to your playlists.
            </p>
          </div>
          <button
            onClick={resetLeash}
            className="px-5 py-2 border border-border text-text-secondary text-sm font-display tracking-wider uppercase rounded-lg hover:bg-surface-2 transition-colors"
          >
            Reset (new session)
          </button>
        </div>
      )}

      {/* Results */}
      {!isLocked && (
        <div className="flex-1 overflow-y-auto">
          {searchError && (
            <div className="px-6 py-4 text-danger text-sm">{searchError}</div>
          )}

          {results.length === 0 && !searching && !searchError && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <Search size={32} className="text-text-muted/30" />
              <p className="text-text-muted text-sm font-display">
                {isActive ? "Enter a search query above" : "Search to add videos to your playlists"}
              </p>
            </div>
          )}

          <div className="divide-y divide-border">
            {results.map((video) => (
              <SearchResultCard
                key={video.id}
                video={video}
                isAdded={addedVideoIds.has(video.id)}
                isWatchLater={watchLaterIds.has(video.id)}
                onAddToPlaylist={() => setShowAddModal(video)}
                onWatchLater={() => handleWatchLater(video)}
                onWatchNow={() => handleWatchNow(video)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showAddModal && (
        <AddToPlaylistModal
          video={showAddModal}
          playlists={playlists}
          onAdd={handleAddToPlaylist}
          onClose={() => setShowAddModal(null)}
        />
      )}
    </div>
  );
}

// ─── Search Result Card ────────────────────────────────────────────────────────

function SearchResultCard({
  video,
  isAdded,
  isWatchLater,
  onAddToPlaylist,
  onWatchLater,
  onWatchNow,
}: {
  video: SearchResult;
  isAdded: boolean;
  isWatchLater: boolean;
  onAddToPlaylist: () => void;
  onWatchLater: () => void;
  onWatchNow: () => void;
}) {
  const thumb = video.thumbnails.medium?.url ?? video.thumbnails.default?.url;

  return (
    <div className="flex gap-4 px-6 py-4 hover:bg-surface-1 transition-colors group">
      {/* Thumbnail */}
      <div className="relative w-36 h-20 rounded-lg overflow-hidden bg-surface-3 shrink-0">
        {thumb && (
          <Image src={thumb} alt="" fill className="object-cover" />
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
          <Play size={20} className="text-white" />
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-white text-xs tabular-nums">
          {formatDuration(video.durationSeconds)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm line-clamp-2 leading-snug mb-1">
          {video.title}
        </p>
        <p className="text-text-muted text-xs mb-3">{video.channelTitle}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onWatchNow}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-3 hover:bg-surface-4 text-text-secondary text-xs rounded-md transition-colors font-display tracking-wider"
          >
            <Play size={11} />
            Watch now
          </button>

          <button
            onClick={onAddToPlaylist}
            disabled={isAdded}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors font-display tracking-wider",
              isAdded
                ? "bg-accent/10 text-accent cursor-default"
                : "bg-surface-3 hover:bg-surface-4 text-text-secondary"
            )}
          >
            {isAdded ? <CheckCircle size={11} /> : <Plus size={11} />}
            {isAdded ? "Added" : "Add to playlist"}
          </button>

          <button
            onClick={onWatchLater}
            disabled={isWatchLater}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors font-display tracking-wider",
              isWatchLater
                ? "bg-warn/10 text-warn cursor-default"
                : "bg-surface-3 hover:bg-surface-4 text-text-secondary"
            )}
          >
            {isWatchLater ? <CheckCircle size={11} /> : <Clock size={11} />}
            {isWatchLater ? "Saved" : "Watch later"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add to Playlist Modal ─────────────────────────────────────────────────────

function AddToPlaylistModal({
  video,
  playlists,
  onAdd,
  onClose,
}: {
  video: SearchResult;
  playlists: YTPlaylist[];
  onAdd: (video: SearchResult, playlistId: string) => void;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState<string | null>(null);

  const handleAdd = async (playlistId: string) => {
    setAdding(playlistId);
    await onAdd(video, playlistId);
    setAdding(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-surface-1 border border-border rounded-xl w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display text-sm tracking-wider uppercase text-text-primary">
            Add to Playlist
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={16} />
          </button>
        </div>

        {/* Video preview */}
        <div className="px-5 py-3 border-b border-border">
          <p className="text-text-secondary text-xs line-clamp-2">{video.title}</p>
        </div>

        {/* Playlist list */}
        <div className="max-h-60 overflow-y-auto py-2">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handleAdd(playlist.id)}
              disabled={adding === playlist.id}
              className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-surface-2 transition-colors text-left"
            >
              <div className="w-8 h-6 rounded overflow-hidden bg-surface-3 shrink-0">
                {playlist.thumbnails.default?.url && (
                  <Image
                    src={playlist.thumbnails.default.url}
                    alt=""
                    width={32}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-xs truncate">{playlist.title}</p>
                <p className="text-text-muted text-xs">{playlist.itemCount} videos</p>
              </div>
              {adding === playlist.id && (
                <Loader2 size={12} className="animate-spin text-text-muted" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
