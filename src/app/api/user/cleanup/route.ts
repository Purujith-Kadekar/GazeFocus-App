import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured - cleanup endpoint disabled')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    const { data: usersToDelete } = await db
      .from('User')
      .select('id, email')
      .not('deletionScheduledAt', 'is', null)
      .lte('deletionScheduledAt', now)

    if (!usersToDelete || usersToDelete.length === 0) {
      return NextResponse.json({ success: true, deletedCount: 0 })
    }

    for (const user of usersToDelete) {
      await db.from('Account').delete().eq('userId', user.id)
      await db.from('Session').delete().eq('userId', user.id)
      await db.from('VerificationToken').delete().eq('identifier', user.email || '')
      await db.from('UserSettings').delete().eq('userId', user.id)
      await db.from('Video').delete().eq('userId', user.id)
      await db.from('VideoProgress').delete().eq('userId', user.id)
      await db.from('Note').delete().eq('userId', user.id)
      await db.from('Playlist').delete().eq('userId', user.id)
      await db.from('PlaylistMark').delete().eq('userId', user.id)
      await db.from('Folder').delete().eq('userId', user.id)
      await db.from('LibraryItem').delete().eq('userId', user.id)
      await db.from('Notification').delete().eq('userId', user.id)
      await db.from('Todo').delete().eq('userId', user.id)
      await db.from('User').delete().eq('id', user.id)
    }

    return NextResponse.json({
      success: true,
      deletedCount: usersToDelete.length,
    })
  } catch (error) {
    console.error('Error cleaning up deleted accounts:', error)
    return NextResponse.json({ error: 'Failed to clean up accounts' }, { status: 500 })
  }
}
