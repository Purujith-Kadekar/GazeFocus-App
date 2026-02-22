import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * DELETE /api/youtube/remove-playlist-item
 *
 * Removes a video from a playlist.
 * Accepts: { playlistItemId: string }
 */
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playlistItemId = searchParams.get("playlistItemId");

    if (!playlistItemId) {
        return NextResponse.json({ error: "playlistItemId required" }, { status: 400 });
    }

    try {
        const res = await fetch(`${YT_BASE}/playlistItems?id=${playlistItemId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || "Failed to remove playlist item");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[API/remove-playlist-item] Error:", err);
        return NextResponse.json(
            { error: "Failed to remove item", details: String(err) },
            { status: 500 }
        );
    }
}
