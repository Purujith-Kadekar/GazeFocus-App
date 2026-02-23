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
  const videoId = searchParams.get("videoId") ?? undefined;
  const importantOnly = searchParams.get("important") === "true";

  const notes = await prisma.note.findMany({
    where: {
      userId: session.userId,
      playlistId,
      videoId,
      ...(importantOnly ? { isImportant: true } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    id,
    playlistId,
    videoId,
    timestampSeconds,
    content,
    isImportant,
  } = body as {
    id?: string;
    playlistId?: string | null;
    videoId?: string | null;
    timestampSeconds?: number | null;
    content: string;
    isImportant?: boolean;
  };

  if (!content || (!playlistId && !videoId)) {
    return NextResponse.json(
      { error: "content and playlistId or videoId are required" },
      { status: 400 }
    );
  }

  if (id) {
    const updated = await prisma.note.update({
      where: { id },
      data: {
        content,
        isImportant: !!isImportant,
        timestampSeconds: timestampSeconds ?? null,
      },
    });
    return NextResponse.json({ note: updated });
  }

  const created = await prisma.note.create({
    data: {
      userId: session.userId,
      playlistId: playlistId ?? null,
      videoId: videoId ?? null,
      timestampSeconds: timestampSeconds ?? null,
      content,
      isImportant: !!isImportant,
    },
  });

  return NextResponse.json({ note: created });
}

