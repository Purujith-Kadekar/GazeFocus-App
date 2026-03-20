#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'puru0kadek@gmail.com';

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) {
    throw new Error(`User not found for email: ${email}`);
  }

  const standaloneLibraryItems = await prisma.libraryItem.findMany({
    where: { userId: user.id, type: 'VIDEO' },
    select: { externalId: true },
  });

  const youtubeIds = [...new Set(standaloneLibraryItems.map((item) => item.externalId).filter(Boolean))];

  const beforeStandaloneCount = await prisma.video.count({ where: { userId: user.id, playlistId: null } });

  let updated = 0;
  if (youtubeIds.length > 0) {
    const result = await prisma.video.updateMany({
      where: {
        userId: user.id,
        youtubeId: { in: youtubeIds },
      },
      data: {
        playlistId: null,
      },
    });
    updated = result.count;
  }

  const afterStandaloneCount = await prisma.video.count({ where: { userId: user.id, playlistId: null } });
  const playlistVideoCount = await prisma.video.count({ where: { userId: user.id, playlistId: { not: null } } });

  console.log(JSON.stringify({
    email: user.email,
    libraryVideoItems: youtubeIds.length,
    beforeStandaloneCount,
    updated,
    afterStandaloneCount,
    playlistVideoCount,
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
