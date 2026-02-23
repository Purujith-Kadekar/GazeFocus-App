"use client";

import { useEffect, useState, FormEvent } from "react";
import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";
import { NotebookPen, Star, StarOff, Trash2 } from "lucide-react";

interface Note {
  id: string;
  playlistId: string | null;
  videoId: string | null;
  timestampSeconds: number | null;
  content: string;
  isImportant: boolean;
  createdAt: string;
}

export function PlayerNotes() {
  const {
    currentVideo,
    currentPlaylistId,
    currentTimeSeconds,
  } = useStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [markImportant, setMarkImportant] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentVideo && !currentPlaylistId) {
      setNotes([]);
      return;
    }

    const load = async () => {
      const params = new URLSearchParams();
      if (currentPlaylistId) params.set("playlistId", currentPlaylistId);
      if (currentVideo) params.set("videoId", currentVideo.id);
      const res = await fetch(`/api/notes?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotes(data.notes as Note[]);
    };

    load();
  }, [currentVideo, currentPlaylistId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || (!currentVideo && !currentPlaylistId)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: currentPlaylistId,
          videoId: currentVideo?.id,
          timestampSeconds: currentVideo ? Math.floor(currentTimeSeconds) : null,
          content: text.trim(),
          isImportant: markImportant,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotes((prev) => [...prev, data.note as Note]);
        setText("");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleImportant = async (note: Note) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: note.id,
        playlistId: note.playlistId,
        videoId: note.videoId,
        timestampSeconds: note.timestampSeconds,
        content: note.content,
        isImportant: !note.isImportant,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? (data.note as Note) : n)));
    }
  };

  const deleteNote = async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  if (!currentVideo && !currentPlaylistId) {
    return null;
  }

  return (
    <div className="h-full w-80 bg-surface-1 border-l border-border text-xs flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-surface-2 flex items-center justify-center">
            <NotebookPen size={14} className="text-accent" />
          </div>
          <div>
            <p className="font-display text-[11px] tracking-widest uppercase text-text-secondary">
              Session Notes
            </p>
            <p className="text-[11px] text-text-muted line-clamp-1">
              {currentVideo?.title ?? "Playlist notes"}
            </p>
          </div>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {notes.length === 0 && (
          <p className="text-[11px] text-text-muted mt-2">
            Capture key ideas or questions. Use the star icon for important ones.
          </p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className={cn(
              "rounded-md border px-2 py-1.5 space-y-1 bg-surface-2",
              note.isImportant && "border-accent/60"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-text-muted">
                {note.timestampSeconds != null
                  ? `T+${Math.floor(note.timestampSeconds)}s`
                  : "Playlist"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="text-[11px] text-text-muted hover:text-accent"
                  onClick={() => toggleImportant(note)}
                  aria-label={note.isImportant ? "Unstar note" : "Star note"}
                >
                  {note.isImportant ? <Star size={12} className="fill-accent text-accent" /> : <StarOff size={12} />}
                </button>
                <button
                  className="text-[11px] text-text-muted hover:text-red-400"
                  onClick={() => deleteNote(note.id)}
                  aria-label="Delete note"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-text-primary whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
        ))}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="border-t border-border px-3 py-2 space-y-2">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-none rounded-md bg-surface-2 border border-border px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/40"
          placeholder="Write a quick note while you watch…"
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMarkImportant((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px]",
              markImportant
                ? "border-accent/60 text-accent bg-accent/10"
                : "border-border text-text-muted hover:border-accent/40 hover:text-accent"
            )}
          >
            <Star size={11} className={markImportant ? "fill-accent" : ""} />
            Important
          </button>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-3 py-1 rounded-md bg-accent text-[11px] font-display uppercase tracking-wider text-surface disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add note"}
          </button>
        </div>
      </form>
    </div>
  );
}

