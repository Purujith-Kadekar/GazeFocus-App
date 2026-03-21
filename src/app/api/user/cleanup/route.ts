import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/user/cleanup - Permanently delete accounts past the grace period
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured – cleanup endpoint disabled')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const { data: usersToDelete } = await db.from('User').select('id, email').not('deletionScheduledAt', 'is', null).lte('deletionScheduledAt', now.toISOString())

    for (const user of usersToDelete || []) {
      await db.from('User').delete().eq('id', user.id)
    }

    return NextResponse.json({
      success: true,
      deletedCount: (usersToDelete || []).length,
    })
  } catch (error) {
    console.error('Error cleaning up deleted accounts:', error)
    return NextResponse.json({ error: 'Failed to clean up accounts' }, { status: 500 })
  }
}
