const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function verify() {
  try {
    console.log('📊 Verification Report:\n');
    
    // Check Users with streaks
    const users = await db.user.findMany({
      select: { id: true, email: true, currentStreak: true, longestStreak: true }
    });
    console.log('✅ Users with streak info:');
    users.forEach(u => {
      console.log(`  📧 ${u.email}: currentStreak=${u.currentStreak}, longestStreak=${u.longestStreak}`);
    });
    
    // Check Videos with playlistId (should be videos in playlists)
    const videosWithPlaylist = await db.video.findMany({
      where: { playlistId: { not: null } },
      select: { id: true, youtubeId: true, title: true, playlistId: true },
      take: 5
    });
    console.log(`\n✅ Videos with playlists: ${videosWithPlaylist.length} found`);
    videosWithPlaylist.forEach(v => {
      console.log(`  🎬 ${v.title.substring(0, 50)}...`);
      console.log(`     playlistId: ${v.playlistId.substring(0, 12)}...`);
    });
    
    // Check Videos without playlistId (standalone videos)
    const videosStandalone = await db.video.findMany({
      where: { playlistId: null },
      select: { id: true, youtubeId: true, title: true },
      take: 5
    });
    console.log(`\n✅ Standalone videos: ${videosStandalone.length} found`);
    videosStandalone.forEach(v => {
      console.log(`  🎬 ${v.title.substring(0, 50)}`);
    });
    
    // Check API endpoint behavior
    console.log('\n✅ Summary:');
    console.log(`  Total Users: ${users.length}`);
    console.log(`  Videos in playlists: ${videosWithPlaylist.length}`);
    console.log(`  Standalone videos: ${videosStandalone.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

verify();
