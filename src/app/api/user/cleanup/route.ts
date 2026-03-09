import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/user/cleanup - Permanently delete accounts past the 2-day grace period
// This should be called periodically (e.g., via cron job or on app startup)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow if called internally or with correct secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const usersToDelete = await db.user.findMany({
      where: {
        deletionScheduledAt: {
          lte: now,
          not: null,
        },
      },
      select: { id: true, email: true },
    })

    for (const user of usersToDelete) {
      await db.user.delete({
        where: { id: user.id },
      })
    }

    return NextResponse.json({
      success: true,
      deletedCount: usersToDelete.length,
    })
  } catch (error) {
    console.error('Error cleaning up deleted accounts:', error)
    return NextResponse.json(
      { error: 'Failed to clean up accounts' },
      { status: 500 }
    )
  }
}
