import { NextResponse } from "next/server";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

interface YTVideoItem {
  id: string;
  contentDetails: {
    duration: string;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids");
  if (!ids) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  try {
    const res = await fetch(`${YT_BASE}/videos?part=contentDetails&id=${ids}&key=${process.env.YOUTUBE_API_KEY}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const videos = data.items.map((item: YTVideoItem) => ({
      id: item.id,
      durationSeconds: parseDuration(item.contentDetails.duration),
    }));
    return NextResponse.json({ videos });
  } catch (err) {
    console.error("[API/videos] Error:", err);
    return NextResponse.json({ error: "Failed to fetch video details" }, { status: 500 });
  }
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}
