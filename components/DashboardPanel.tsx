"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useStore } from "@/stores/useStore";
import type { YTPlaylist } from "@/types";
import { CheckCircle2, NotebookPen, ListChecks, Loader2 } from "lucide-react";

interface DashboardData {
  importantNotes: {
    id: string;
    playlistId: string | null;
    videoId: string | null;
    timestampSeconds: number | null;
    content: string;
    createdAt: string;
  }[];
  finishedPlaylists: {
    id: string;
    playlistId: string;
    finishedAt: string;
  }[];
}

export function DashboardPanel() {
  useStore(); // keep store hydrated (for future extensions)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [playlistsById, setPlaylistsById] = useState<Record<string, YTPlaylist>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dashboardRes, playlistsRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/youtube/playlists"),
        ]);

        if (!dashboardRes.ok) {
          throw new Error("Failed to load dashboard");
        }

        const dashboardJson = await dashboardRes.json();
        const playlistsJson = playlistsRes.ok ? await playlistsRes.json() : { playlists: [] };

        setData(dashboardJson as DashboardData);

        const map: Record<string, YTPlaylist> = {};
        (playlistsJson.playlists as YTPlaylist[]).forEach((pl) => {
          map[pl.id] = pl;
        });
        setPlaylistsById(map);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl tracking-wider text-text-primary">
              Focus Dashboard
            </h1>
            <p className="text-text-muted text-sm mt-1">
              See which playlists you have finished and your most important notes.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-text-muted" size={20} />
          </div>
        )}

        {error && !loading && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {!loading && data && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Finished playlists */}
            <section className="bg-surface-1 border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-400" size={18} />
                </div>
                <div>
                  <h2 className="font-display text-sm uppercase tracking-widest text-text-secondary">
                    Finished Playlists
                  </h2>
                  <p className="text-text-muted text-xs">
                    Mark playlists as finished from the player or playlist menu.
                  </p>
                </div>
              </div>

              {data.finishedPlaylists.length === 0 && (
                <p className="text-text-muted text-xs mt-2">
                  No playlists marked as finished yet. Stay consistent and they will appear here.
                </p>
              )}

              <ul className="space-y-3">
                {data.finishedPlaylists.map((p) => {
                  const playlist = playlistsById[p.playlistId];
                  return (
                    <li
                      key={p.id}
                      className="flex items-start gap-3 rounded-lg border border-border/70 bg-surface-2 px-3 py-2"
                    >
                      <div className="mt-0.5">
                        <ListChecks className="text-emerald-400" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary font-medium truncate">
                          {playlist?.title ?? "Unknown playlist"}
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Finished{" "}
                          {format(new Date(p.finishedAt), "d MMM yyyy, HH:mm")}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Important notes */}
            <section className="bg-surface-1 border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <NotebookPen className="text-indigo-400" size={18} />
                </div>
                <div>
                  <h2 className="font-display text-sm uppercase tracking-widest text-text-secondary">
                    Important Notes
                  </h2>
                  <p className="text-text-muted text-xs">
                    Notes you have starred while watching videos.
                  </p>
                </div>
              </div>

              {data.importantNotes.length === 0 && (
                <p className="text-text-muted text-xs mt-2">
                  Star notes in the player to see a summary of key ideas here.
                </p>
              )}

              <ul className="space-y-3">
                {data.importantNotes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2 text-xs"
                  >
                    <p className="text-text-primary mb-1 line-clamp-3">
                      {n.content}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>
                        {n.timestampSeconds != null
                          ? `T+${Math.floor(n.timestampSeconds)}s`
                          : "Playlist note"}
                      </span>
                      <span>{format(new Date(n.createdAt), "d MMM yyyy")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

