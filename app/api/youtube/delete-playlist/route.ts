import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * DELETE /api/youtube/delete-playlist
 *
 * Deletes an entire playlist.
 * Accepts: { playlistId: string }
 */
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get("playlistId");

    if (!playlistId) {
        return NextResponse.json({ error: "playlistId required" }, { status: 400 });
    }

    try {
        const res = await fetch(`${YT_BASE}/playlists?id=${playlistId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || "Failed to delete playlist");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[API/delete-playlist] Error:", err);
        return NextResponse.json(
            { error: "Failed to delete playlist", details: String(err) },
            { status: 500 }
        );
    }
}
