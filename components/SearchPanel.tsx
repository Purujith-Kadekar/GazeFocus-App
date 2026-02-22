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
  Play,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";

export function SearchPanel() {
  const { setCurrentVideo, setActiveView, triggerPlaylistRefresh } = useStore();
  const { formattedTime, warningLevel, isLocked, isActive, startLeash, resetLeash } =
    useSearchLeash();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<YTPlaylist[]>([]);
  const [showAddModal, setShowAddModal] = useState<SearchResult | null>(null);
  const [addedMap, setAddedMap] = useState<Record<string, string>>({});  // videoId -> playlistTitle
  const inputRef = useRef<HTMLInputElement>(null);

  // Load YouTube playlists for "add to playlist" modal
  useEffect(() => {
    fetchMyPlaylists().then(setPlaylists).catch(() => { });
  }, []);

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

  const handleAddToPlaylist = async (video: SearchResult, playlist: YTPlaylist) => {
    try {
      await addVideoToPlaylist(video.id, playlist.id);
      setAddedMap((prev) => ({ ...prev, [video.id]: playlist.title }));
      triggerPlaylistRefresh();
      setShowAddModal(null);
    } catch {
      alert("Failed to add to playlist. Try again.");
    }
  };

  const handleWatchNow = (video: SearchResult) => {
    setCurrentVideo({ ...video, playlistItemId: undefined });
    setActiveView("player");
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-surface-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-sm tracking-widest uppercase text-text-primary">
              Focused Search
            </h2>
            <p className="text-text-muted text-xs mt-0.5">
              Watch or add to your YouTube playlists
            </p>
          </div>

          {/* Timer */}
          {isActive && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-display text-sm tabular-nums transition-colors",
                warningLevel === "critical"
                  ? "bg-danger/10 border-danger/30 text-danger animate-pulse"
                  : warningLevel === "warning"
                    ? "bg-warn/10 border-warn/30 text-warn"
                    : "bg-surface-2 border-border text-text-secondary"
              )}
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
            <p className="text-warn text-xs">5 minutes left — wrap up your search!</p>
          </div>
        )}
        {warningLevel === "critical" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg mb-3 animate-fade-in">
            <AlertTriangle size={14} className="text-danger shrink-0" />
            <p className="text-danger text-xs">Under a minute left — stop doomscrolling!</p>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder="Search YouTube…"
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
            className="px-4 py-2 bg-accent text-surface font-display text-xs tracking-wider uppercase rounded-lg hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
              Your search session has ended. Go back to your playlists.
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
                Search for videos to watch or add to your YouTube playlists
              </p>
            </div>
          )}

          <div className="divide-y divide-border">
            {results.map((video) => (
              <SearchResultCard
                key={video.id}
                video={video}
                addedToPlaylist={addedMap[video.id]}
                onAddToPlaylist={() => setShowAddModal(video)}
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
  addedToPlaylist,
  onAddToPlaylist,
  onWatchNow,
}: {
  video: SearchResult;
  addedToPlaylist?: string;
  onAddToPlaylist: () => void;
  onWatchNow: () => void;
}) {
  const thumb = video.thumbnails.medium?.url ?? video.thumbnails.default?.url;

  return (
    <div className="flex gap-4 px-6 py-4 hover:bg-surface-1 transition-colors group">
      {/* Thumbnail */}
      <div className="relative w-36 h-20 rounded-lg overflow-hidden bg-surface-3 shrink-0">
        {thumb && <Image src={thumb} alt="" fill className="object-cover" />}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
          <Play size={20} className="text-white" />
        </div>
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onWatchNow}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-accent text-surface text-xs rounded-md transition-colors font-display tracking-wider hover:bg-accent-dim"
          >
            <Play size={11} />
            Watch now
          </button>

          <button
            onClick={onAddToPlaylist}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors font-display tracking-wider",
              addedToPlaylist
                ? "bg-accent/10 text-accent cursor-default"
                : "bg-surface-3 hover:bg-surface-4 text-text-secondary"
            )}
          >
            {addedToPlaylist ? <CheckCircle size={11} /> : <Plus size={11} />}
            {addedToPlaylist ? `Added to ${addedToPlaylist}` : "Add to playlist"}
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
  onAdd: (video: SearchResult, playlist: YTPlaylist) => void;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState<string | null>(null);

  const handleAdd = async (playlist: YTPlaylist) => {
    setAdding(playlist.id);
    await onAdd(video, playlist);
    setAdding(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-surface-1 border border-border rounded-xl w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-display text-sm tracking-wider uppercase text-text-primary">
              Add to YouTube Playlist
            </h3>
            <p className="text-text-muted text-xs mt-0.5">Changes sync to your account</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={16} />
          </button>
        </div>

        {/* Video title */}
        <div className="px-5 py-3 border-b border-border">
          <p className="text-text-secondary text-xs line-clamp-2">{video.title}</p>
        </div>

        {/* Playlist list — including Watch Later */}
        <div className="max-h-64 overflow-y-auto py-2">
          {playlists.length === 0 ? (
            <div className="flex justify-center py-6">
              <Loader2 size={16} className="animate-spin text-text-muted" />
            </div>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAdd(playlist)}
                disabled={adding === playlist.id}
                className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-surface-2 transition-colors text-left disabled:opacity-60"
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
                  <Loader2 size={12} className="animate-spin text-text-muted shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
