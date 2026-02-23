import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.userId;

  const [importantNotes, playlistMarks] = await Promise.all([
    prisma.note.findMany({
      where: { userId, isImportant: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.playlistMark.findMany({
      where: { userId, finished: true },
      orderBy: { finishedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    importantNotes,
    finishedPlaylists: playlistMarks,
  });
}

