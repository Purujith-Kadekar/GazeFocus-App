import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('demo123', 10)

  await prisma.user.upsert({
    where: { email: 'demo@gazefocus.app' },
    update: {},
    create: {
      email: 'demo@gazefocus.app',
      name: 'Demo User',
      passwordHash: hashedPassword,
    },
  })

  const user = await prisma.user.findUnique({
    where: { email: 'demo@gazefocus.app' }
  })

  if (user) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        eyeTrackingEnabled: true,
        inactivityTimeout: 30,
        soundAlerts: true,
        theme: 'system',
        autoPlayNext: true,
        defaultPlaybackSpeed: 1.0,
      },
    })
  }

  console.log('Seed completed')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
