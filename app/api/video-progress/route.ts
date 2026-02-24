import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { videoId, playlistId, secondsWatched, durationSeconds } = await req.json();
    
    const completed = secondsWatched / durationSeconds > 0.95; // Consider completed if > 95%

    const progress = await prisma.videoProgress.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId,
        },
      },
      update: {
        playlistId,
        secondsWatched,
        durationSeconds,
        completed,
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        userId: session.user.id,
        videoId,
        playlistId,
        secondsWatched,
        durationSeconds,
        completed,
        completedAt: completed ? new Date() : undefined,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[API/video-progress] Error:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
