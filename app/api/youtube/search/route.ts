import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseDuration } from "@/lib/youtube";
import type { SearchResult } from "@/types";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!;

/**
 * GET /api/youtube/search?q=query&pageToken=X
 *
 * Searches YouTube videos. Used only in restricted search mode.
 * Results are videos only (no channels, playlists) to keep focus.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const pageToken = searchParams.get("pageToken");

  if (!q) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    // Step 1: Search
    const searchP = new URLSearchParams({
      part: "snippet",
      q,
      type: "video",
      maxResults: "12",
      safeSearch: "none",
      key: API_KEY,
    });
    if (pageToken) searchP.set("pageToken", pageToken);

    const searchRes = await fetch(`${YT_BASE}/search?${searchP}`);
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      throw new Error(searchData.error?.message || "Search failed");
    }

    const items = searchData.items ?? [];
    const videoIds = items
      .map((i: { id?: { videoId?: string } }) => i.id?.videoId)
      .filter(Boolean)
      .join(",");

    if (!videoIds) {
      return NextResponse.json({ results: [], nextPageToken: null });
    }

    // Step 2: Fetch video durations + embeddable status
    const videoP = new URLSearchParams({
      part: "contentDetails,status",
      id: videoIds,
      key: API_KEY,
    });
    const videosRes = await fetch(`${YT_BASE}/videos?${videoP}`);
    const videosData = await videosRes.json();

    const videoInfoMap = new Map<string, { durationSeconds: number; embeddable: boolean }>();
    for (const v of videosData.items ?? []) {
      videoInfoMap.set(v.id, {
        durationSeconds: parseDuration(v.contentDetails?.duration ?? "PT0S"),
        embeddable: v.status?.embeddable ?? false,
      });
    }

    const results: SearchResult[] = items
      .filter((i: { id?: { videoId?: string } }) => {
        const vid = i.id?.videoId;
        if (!vid) return false;
        // Only include embeddable videos
        const info = videoInfoMap.get(vid);
        return info?.embeddable !== false;
      })
      .map((i: {
        id: { videoId: string };
        snippet: {
          title: string;
          description: string;
          thumbnails: Record<string, unknown>;
          channelTitle: string;
          publishedAt: string;
        };
      }) => ({
        id: i.id.videoId,
        title: i.snippet.title,
        description: i.snippet.description,
        thumbnails: i.snippet.thumbnails,
        channelTitle: i.snippet.channelTitle,
        publishedAt: i.snippet.publishedAt,
        duration: "",
        durationSeconds: videoInfoMap.get(i.id.videoId)?.durationSeconds ?? 0,
        isSearchResult: true as const,
      }));

    return NextResponse.json({
      results,
      nextPageToken: searchData.nextPageToken ?? null,
    });
  } catch (err) {
    console.error("[API/search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
