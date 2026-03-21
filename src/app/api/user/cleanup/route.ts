import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/user/cleanup - Permanently delete accounts past the 2-day grace period
// This should be called periodically (e.g., via cron job or on app startup)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // CRON_SECRET must always be set; refuse to run without it to prevent
    // unauthenticated mass-deletion if the env var is accidentally unset.
    if (!cronSecret) {
      console.error('CRON_SECRET is not configured – cleanup endpoint disabled')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
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
