import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Fetch all library items of type PLAYLIST to get their titles
    const playlists = await prisma.libraryItem.findMany({
      where: { userId, type: "PLAYLIST" },
    });

    // Fetch all video progress for the user
    const progressEntries = await prisma.videoProgress.findMany({
      where: { userId },
    });

    // Aggregate stats by playlist
    const playlistStatsMap = new Map();

    for (const entry of progressEntries) {
      if (!entry.playlistId) continue;
      
      const stats = playlistStatsMap.get(entry.playlistId) || {
        watchedVideos: 0,
        totalVideos: 0, // This is tricky because we only know videos with progress
        totalWatchTime: 0,
        completedVideos: 0,
      };

      stats.totalVideos += 1;
      stats.totalWatchTime += entry.secondsWatched;
      if (entry.completed) {
        stats.completedVideos += 1;
        stats.watchedVideos += 1;
      } else if (entry.secondsWatched > 0) {
        stats.watchedVideos += 1;
      }

      playlistStatsMap.set(entry.playlistId, stats);
    }

    const playlistStats = playlists.map(p => {
      const stats = playlistStatsMap.get(p.externalId) || {
        watchedVideos: 0,
        totalVideos: 0,
        totalWatchTime: 0,
        completedVideos: 0,
      };
      
      // If we don't have totalVideos from progress, we might want to get it from metadata if stored
      // For now, let's use what we have.
      
      const completionPercent = stats.totalVideos > 0 
        ? Math.round((stats.completedVideos / stats.totalVideos) * 100) 
        : 0;

      return {
        id: p.externalId,
        name: p.title,
        totalVideos: stats.totalVideos,
        watchedVideos: stats.watchedVideos,
        completionPercent,
        totalWatchTime: stats.totalWatchTime,
      };
    });

    const totalVideosWatched = progressEntries.filter(e => e.secondsWatched > 0).length;
    const totalWatchTime = progressEntries.reduce((sum, e) => sum + e.secondsWatched, 0);
    const completedPlaylists = playlistStats.filter(p => p.completionPercent >= 100 && p.totalVideos > 0).length;

    return NextResponse.json({
      totalPlaylists: playlists.length,
      completedPlaylists,
      totalVideosWatched,
      totalWatchTime,
      playlistStats: playlistStats.sort((a, b) => b.completionPercent - a.completionPercent),
    });
  } catch (error) {
    console.error("[API/stats] Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
