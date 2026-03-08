import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

export const db =
  isBuildTime
    ? ({} as PrismaClient)
    : globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query'] : [],
      })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db