#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function truncateTables() {
  try {
    console.log('Truncating tables...');
    
    // Truncate in order to avoid foreign key violations
    const tables = [
      'VideoProgress',
      'PlaylistMark',
      'Note',
      'Todo',
      'Notification',
      'UserSettings',
      'Video',
      'Playlist',
      'LibraryItem',
      'Folder',
      'Session',
      'VerificationToken',
      'Account',
      'User',
    ];
    
    for (const table of tables) {
      console.log(`  Truncating ${table}...`);
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE public."${table}" RESTART IDENTITY CASCADE`);
    }
    
    console.log('✅ All tables truncated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error truncating tables:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

truncateTables();
