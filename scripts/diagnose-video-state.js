#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const totalVideos = await prisma.video.count();
  const standaloneVideos = await prisma.video.count({ where: { playlistId: null } });
  const playlistVideos = await prisma.video.count({ where: { playlistId: { not: null } } });

  const orphanPlaylistVideos = await prisma.video.count({
    where: {
      playlistId: { not: null },
      playlist: null,
    },
  });

  const totalProgress = await prisma.videoProgress.count();

  const user = await prisma.user.findUnique({
    where: { email: 'puru0kadek@gmail.com' },
    select: {
      email: true,
      currentStreak: true,
      longestStreak: true,
      weeklyVideosWatched: true,
      lastActiveDate: true,
    },
  });

  console.log(JSON.stringify({
    totalVideos,
    standaloneVideos,
    playlistVideos,
    orphanPlaylistVideos,
    totalProgress,
    user,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
