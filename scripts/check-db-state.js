#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('📊 Current Database State:\n');
    
    // Check Videos
    const videos = await prisma.video.findMany({
      select: { id: true, youtubeId: true, title: true, playlistId: true, userId: true }
    });
    console.log(`Videos: ${videos.length} total`);
    if (videos.length > 0) {
      console.log('Video IDs:');
      videos.forEach(v => console.log(`  - ${v.id}: ${v.title.substring(0, 40)}`));
    }
    
    // Check Users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, currentStreak: true, longestStreak: true }
    });
    console.log(`\nUsers: ${users.length}`);
    users.forEach(u => {
      console.log(`  ${u.email}:`);
      console.log(`    currentStreak: ${u.currentStreak}`);
      console.log(`    longestStreak: ${u.longestStreak}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
