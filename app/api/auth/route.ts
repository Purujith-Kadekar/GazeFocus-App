import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { YTPlaylist } from "@/types";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

export const dynamic = "force-dynamic";

/**
 * GET /api/youtube/playlists
 *
 * Fetches ALL playlists from the user's YouTube account:
 * - Watch Later (special playlist ID: WL)
 * - Liked Videos (special playlist ID: LL)
 * - All user-created playlists
 * - All saved/followed playlists
 *
 * Uses youtube scope (read+write) so we can also modify playlists.
 */
export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists: YTPlaylist[] = [];

    // ── Step 1: Fetch special playlists (Watch Later + Liked Videos) ──────────
    // These are returned via the channels endpoint contentDetails
    const channelRes = await fetch(
      `${YT_BASE}/channels?part=contentDetails&mine=true`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      }
    );
    const channelData = await channelRes.json();
    const relatedPlaylists =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists ?? {};

    const specialIds: Record<string, string> = {};
    if (relatedPlaylists.watchLater) specialIds["WL"] = relatedPlaylists.watchLater;
    if (relatedPlaylists.likes) specialIds["LL"] = relatedPlaylists.likes;

    // Fetch details for special playlists
    if (Object.keys(specialIds).length > 0) {
      const ids = Object.values(specialIds).join(",");
      const specialRes = await fetch(
        `${YT_BASE}/playlists?part=snippet,contentDetails,status&id=${ids}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          cache: "no-store",
        }
      );
      const specialData = await specialRes.json();

      for (const item of specialData.items ?? []) {
        // Label Watch Later and Liked Videos clearly
        let title = item.snippet.title;
        if (item.id === relatedPlaylists.watchLater) title = "⏱ Watch Later";
        if (item.id === relatedPlaylists.likes) title = "👍 Liked Videos";

        playlists.push({
          id: item.id,
          title,
          description: item.snippet.description,
          thumbnails: item.snippet.thumbnails,
          itemCount: item.contentDetails?.itemCount ?? 0,
          channelTitle: item.snippet.channelTitle,
          privacy: item.status?.privacyStatus ?? "private",
          isSpecial: true,
        });
      }
    }

    // ── Step 2: Fetch all user playlists (paginated) ──────────────────────────
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        part: "snippet,contentDetails,status",
        mine: "true",
        maxResults: "50",
      });
      if (pageToken) params.set("pageToken", pageToken);

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
        // Skip if already added as special playlist
        if (playlists.some((p) => p.id === item.id)) continue;

        playlists.push({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnails: item.snippet.thumbnails,
          itemCount: item.contentDetails?.itemCount ?? 0,
          channelTitle: item.snippet.channelTitle,
          privacy: item.status?.privacyStatus ?? "public",
          isSpecial: false,
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    return NextResponse.json({ playlists });
  } catch (err) {
    console.error("[API/playlists] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch playlists", details: String(err) },
      { status: 500 }
    );
  }
}
