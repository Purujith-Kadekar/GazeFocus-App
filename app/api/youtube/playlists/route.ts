import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { YTPlaylist } from "@/types";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * GET /api/youtube/playlists
 *
 * Fetches all playlists for the authenticated user:
 * 1. User's channel related playlists (Liked Videos, Uploads)
 * 2. User's own created playlists (mine=true)
 *
 * Uses the user's access token (not API key) to access private playlists.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = { Authorization: `Bearer ${session.accessToken}` };

  try {
    const playlists: YTPlaylist[] = [];

    // ── Step 1: Get channel's special playlists (Liked Videos, Uploads) ──
    try {
      const channelParams = new URLSearchParams({
        part: "contentDetails",
        mine: "true",
      });
      const channelRes = await fetch(`${YT_BASE}/channels?${channelParams}`, {
        headers,
        cache: "no-store",
      });

      if (channelRes.ok) {
        const channelData = await channelRes.json();
        const relatedPlaylists = channelData.items?.[0]?.contentDetails?.relatedPlaylists;

        if (relatedPlaylists) {
          // Add Liked Videos playlist
          if (relatedPlaylists.likes) {
            playlists.push({
              id: relatedPlaylists.likes,
              title: "❤️ Liked Videos",
              description: "Videos you've liked on YouTube",
              thumbnails: {},
              itemCount: 0,
              channelTitle: "",
              privacy: "private",
              isSpecial: true,
            });
          }
        }
      }
    } catch {
      // Non-critical: continue without special playlists
      console.warn("[API/playlists] Could not fetch channel info");
    }

    // ── Step 2: Paginate through user-created playlists ──
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        part: "snippet,contentDetails,status",
        mine: "true",
        maxResults: "50",
      });
      if (pageToken) params.set("pageToken", pageToken);

      const res = await fetch(`${YT_BASE}/playlists?${params}`, {
        headers,
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
    console.error("[API/playlists] Error details:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
