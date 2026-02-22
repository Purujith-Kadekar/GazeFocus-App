/**
 * YouTube Data API v3 - Client-side wrappers
 * All calls go through our Next.js API routes (which hold the API key server-side)
 * The access token (for private playlists) comes from the Auth.js session.
 */

import type { YTPlaylist, YTVideo, SearchResult } from "@/types";

// ─── Duration Parser ───────────────────────────────────────────────────────────

/**
 * Parse ISO 8601 duration string to seconds
 * e.g. "PT1H25M30S" → 5130
 */
export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds to human-readable duration
 * e.g. 5130 → "1:25:30"
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── API Fetch Helper ──────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Playlist Functions ────────────────────────────────────────────────────────

/**
 * Fetch all playlists for the authenticated user
 * Includes both user-created and saved playlists
 */
export async function fetchMyPlaylists(): Promise<YTPlaylist[]> {
  const data = await apiFetch<{ playlists: YTPlaylist[] }>("/api/youtube/playlists");
  return data.playlists;
}

/**
 * Fetch videos in a specific playlist
 */
export async function fetchPlaylistVideos(
  playlistId: string,
  pageToken?: string
): Promise<{ videos: YTVideo[]; nextPageToken?: string }> {
  const params: Record<string, string> = { playlistId };
  if (pageToken) params.pageToken = pageToken;
  return apiFetch<{ videos: YTVideo[]; nextPageToken?: string }>(
    "/api/youtube/playlist-items",
    params
  );
}

/**
 * Fetch a single video's details (for duration etc.)
 */
export async function fetchVideoDetails(videoId: string): Promise<YTVideo> {
  const data = await apiFetch<{ video: YTVideo }>("/api/youtube/video", { videoId });
  return data.video;
}

/**
 * Search YouTube videos (used in restricted search mode)
 */
export async function searchVideos(
  query: string,
  pageToken?: string
): Promise<{ results: SearchResult[]; nextPageToken?: string }> {
  const params: Record<string, string> = { q: query };
  if (pageToken) params.pageToken = pageToken;
  return apiFetch<{ results: SearchResult[]; nextPageToken?: string }>(
    "/api/youtube/search",
    params
  );
}

/**
 * Add a video to a playlist (requires write scope — uses access token)
 */
export async function addVideoToPlaylist(
  videoId: string,
  playlistId: string
): Promise<void> {
  const res = await fetch("/api/youtube/add-to-playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId, playlistId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to add video to playlist");
  }
}

/**
 * Create a new playlist on the user's YouTube channel
 */
export async function createPlaylist(
  title: string,
  privacy: "public" | "private" | "unlisted" = "private"
): Promise<YTPlaylist> {
  const res = await fetch("/api/youtube/create-playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, privacy }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create playlist");
  }
  const data = await res.json();
  return data.playlist;
}

/**
 * Fetch info about any playlist by its ID (for importing external playlists)
 */
export async function fetchPlaylistInfo(playlistId: string): Promise<YTPlaylist> {
  const data = await apiFetch<{ playlist: YTPlaylist }>("/api/youtube/playlist-info", { playlistId });
  return data.playlist;
}

/**
 * Remove a video from a playlist
 */
export async function removePlaylistItem(playlistItemId: string): Promise<void> {
  const res = await fetch(`/api/youtube/remove-playlist-item?playlistItemId=${playlistItemId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to remove item");
  }
}

/**
 * Delete an entire playlist
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  const res = await fetch(`/api/youtube/delete-playlist?playlistId=${playlistId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete playlist");
  }
}

/**
 * Extract a playlist ID from a YouTube URL
 * Supports: youtube.com/playlist?list=X, youtu.be/..., etc.
 */
export function extractPlaylistId(input: string): string | null {
  // Direct playlist ID (starts with PL, OL, UU, LL, etc.)
  if (/^[A-Za-z0-9_-]{10,}$/.test(input.trim())) {
    return input.trim();
  }
  try {
    const url = new URL(input);
    return url.searchParams.get("list");
  } catch {
    return null;
  }
}
