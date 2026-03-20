#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'puru0kadek@gmail.com';
  const longestStreak = Number(process.argv[3] || 10);

  const user = await prisma.user.update({
    where: { email },
    data: {
      longestStreak,
      currentStreak: {
        set: Math.min(longestStreak, 10),
      },
    },
    select: {
      id: true,
      email: true,
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
      lastLoginDate: true,
    },
  });

  console.log('✅ Updated user streak:');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error) => {
    console.error('❌ Failed to update streak:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
