import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("playlistId") ?? undefined;

  const progress = await prisma.videoProgress.findMany({
    where: {
      userId: session.userId,
      playlistId,
    },
  });

  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    videoId,
    playlistId,
    currentSeconds,
    durationSeconds,
    completed,
  } = body as {
    videoId: string;
    playlistId?: string | null;
    currentSeconds: number;
    durationSeconds?: number;
    completed?: boolean;
  };

  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const safeSeconds = Math.max(0, Math.floor(currentSeconds ?? 0));

  const record = await prisma.videoProgress.upsert({
    where: {
      userId_videoId: {
        userId: session.userId,
        videoId,
      },
    },
    update: {
      playlistId: playlistId ?? null,
      secondsWatched: safeSeconds,
      durationSeconds: durationSeconds ?? undefined,
      completed: completed ?? false,
      completedAt:
        completed ?? false
          ? new Date()
          : undefined,
    },
    create: {
      userId: session.userId,
      videoId,
      playlistId: playlistId ?? null,
      secondsWatched: safeSeconds,
      durationSeconds: durationSeconds ?? null,
      completed: completed ?? false,
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json({ progress: record });
}

