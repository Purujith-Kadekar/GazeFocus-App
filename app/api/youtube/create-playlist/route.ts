import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * POST /api/youtube/create-playlist
 * Body: { title: string, description?: string, privacy?: "public" | "private" | "unlisted" }
 *
 * Creates a new playlist on the user's YouTube channel.
 */
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, description = "", privacy = "private" } = await req.json();

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const res = await fetch(`${YT_BASE}/playlists?part=snippet,status`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                snippet: {
                    title: title.trim(),
                    description,
                },
                status: {
                    privacyStatus: privacy,
                },
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "Failed to create playlist");
        }

        const data = await res.json();

        return NextResponse.json({
            playlist: {
                id: data.id,
                title: data.snippet.title,
                description: data.snippet.description,
                thumbnails: data.snippet.thumbnails ?? {},
                itemCount: 0,
                channelTitle: data.snippet.channelTitle,
                privacy: data.status.privacyStatus,
            },
        });
    } catch (err) {
        console.error("[API/create-playlist]", err);
        return NextResponse.json(
            { error: "Failed to create playlist" },
            { status: 500 }
        );
    }
}
