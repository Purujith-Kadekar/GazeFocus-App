import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!;

/**
 * GET /api/youtube/playlist-info?playlistId=X
 *
 * Fetches details about a specific playlist (can be from any channel).
 * Used for importing external playlists by URL.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get("playlistId");

    if (!playlistId) {
        return NextResponse.json({ error: "playlistId required" }, { status: 400 });
    }

    try {
        const params = new URLSearchParams({
            part: "snippet,contentDetails,status",
            id: playlistId,
            key: API_KEY,
        });

        const res = await fetch(`${YT_BASE}/playlists?${params}`, {
            cache: "no-store",
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "Failed to fetch playlist");
        }

        const data = await res.json();
        const item = data.items?.[0];

        if (!item) {
            return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
        }

        return NextResponse.json({
            playlist: {
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnails: item.snippet.thumbnails ?? {},
                itemCount: item.contentDetails?.itemCount ?? 0,
                channelTitle: item.snippet.channelTitle,
                privacy: item.status?.privacyStatus ?? "public",
            },
        });
    } catch (err) {
        console.error("[API/playlist-info]", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
