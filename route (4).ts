import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * POST /api/youtube/add-to-playlist
 * Body: { videoId: string, playlistId: string }
 *
 * Adds a video to one of the user's playlists using their OAuth access token.
 * Requires youtube scope (already requested during login).
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { videoId, playlistId } = await req.json();

    if (!videoId || !playlistId) {
      return NextResponse.json(
        { error: "videoId and playlistId required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${YT_BASE}/playlistItems?part=snippet`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId,
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Failed to add video");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API/add-to-playlist]", err);
    return NextResponse.json(
      { error: "Failed to add video to playlist" },
      { status: 500 }
    );
  }
}
