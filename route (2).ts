import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseDuration } from "@/lib/youtube";
import type { YTVideo } from "@/types";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!;

/**
 * GET /api/youtube/playlist-items?playlistId=X&pageToken=X
 *
 * Fetches videos in a playlist, enriched with duration from videos endpoint.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("playlistId");
  const pageToken = searchParams.get("pageToken");

  if (!playlistId) {
    return NextResponse.json({ error: "playlistId required" }, { status: 400 });
  }

  try {
    // Step 1: Fetch playlist items
    const itemParams = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "25",
      key: API_KEY,
    });
    if (pageToken) itemParams.set("pageToken", pageToken);

    const itemsRes = await fetch(
      `${YT_BASE}/playlistItems?${itemParams}`,
      {
        headers: session.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {},
      }
    );
    const itemsData = await itemsRes.json();

    if (!itemsRes.ok) {
      throw new Error(itemsData.error?.message || "Failed to fetch items");
    }

    const items = itemsData.items ?? [];
    const videoIds = items
      .map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId)
      .filter(Boolean)
      .join(",");

    if (!videoIds) {
      return NextResponse.json({ videos: [], nextPageToken: itemsData.nextPageToken });
    }

    // Step 2: Fetch video details for duration
    const videoParams = new URLSearchParams({
      part: "snippet,contentDetails",
      id: videoIds,
      key: API_KEY,
    });

    const videosRes = await fetch(`${YT_BASE}/videos?${videoParams}`);
    const videosData = await videosRes.json();

    const videoMap = new Map<string, { durationSeconds: number; publishedAt: string }>();
    for (const v of videosData.items ?? []) {
      videoMap.set(v.id, {
        durationSeconds: parseDuration(v.contentDetails?.duration ?? "PT0S"),
        publishedAt: v.snippet?.publishedAt ?? "",
      });
    }

    // Step 3: Merge
    const videos: YTVideo[] = items
      .filter((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId)
      .map((i: {
        contentDetails: { videoId: string };
        snippet: {
          title: string;
          description: string;
          thumbnails: Record<string, unknown>;
          videoOwnerChannelTitle: string;
          publishedAt: string;
        };
        id: string;
      }) => {
        const vid = i.contentDetails.videoId;
        const details = videoMap.get(vid) ?? { durationSeconds: 0, publishedAt: "" };
        return {
          id: vid,
          title: i.snippet.title,
          description: i.snippet.description,
          thumbnails: i.snippet.thumbnails,
          channelTitle: i.snippet.videoOwnerChannelTitle ?? "",
          publishedAt: details.publishedAt,
          duration: "",
          durationSeconds: details.durationSeconds,
          playlistItemId: i.id,
        };
      });

    return NextResponse.json({
      videos,
      nextPageToken: itemsData.nextPageToken ?? null,
    });
  } catch (err) {
    console.error("[API/playlist-items]", err);
    return NextResponse.json(
      { error: "Failed to fetch playlist items" },
      { status: 500 }
    );
  }
}
