import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { YTPlaylist } from "@/types";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * GET /api/youtube/playlists
 *
 * Fetches all playlists for the authenticated user:
 * 1. User's own created playlists (mine=true)
 * 2. Liked/saved playlists are included in the same endpoint
 *    (YouTube API returns all playlists the user has in their library)
 *
 * Uses the user's access token (not API key) to access private playlists.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists: YTPlaylist[] = [];
    let pageToken: string | undefined;

    // Paginate through all playlists
    do {
      const params = new URLSearchParams({
        part: "snippet,contentDetails,status",
        mine: "true",
        maxResults: "50",
      });
      if (pageToken) params.set("pageToken", pageToken);

      // Do NOT cache this fetch, as it uses user-specific Authorization header.
      // Caching by URL here causes one user's playlists to be shown to another, or 401s to be cached.
      const res = await fetch(`${YT_BASE}/playlists?${params}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "YouTube API error");
      }

      const data = await res.json();

      for (const item of data.items ?? []) {
        playlists.push({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnails: item.snippet.thumbnails,
          itemCount: item.contentDetails?.itemCount ?? 0,
          channelTitle: item.snippet.channelTitle,
          privacy: item.status?.privacyStatus ?? "public",
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    return NextResponse.json({ playlists });
  } catch (err) {
    console.error("[API/playlists]", err);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}
