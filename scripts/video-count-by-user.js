#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, currentStreak: true, longestStreak: true },
    orderBy: { createdAt: 'asc' },
  });

  const rows = [];
  for (const user of users) {
    const [videos, standalone, playlistVideos, progress] = await Promise.all([
      prisma.video.count({ where: { userId: user.id } }),
      prisma.video.count({ where: { userId: user.id, playlistId: null } }),
      prisma.video.count({ where: { userId: user.id, playlistId: { not: null } } }),
      prisma.videoProgress.count({ where: { userId: user.id } }),
    ]);

    rows.push({
      email: user.email,
      userId: user.id,
      videos,
      standalone,
      playlistVideos,
      progress,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    });
  }

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
