import { NextRequest, NextResponse } from 'next/server'
import { initializePlaylistSync } from '@/lib/schedulers/playlistSync'

let initialized = false

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[cron/init] CRON_SECRET is not configured - endpoint disabled')
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!initialized) {
      initializePlaylistSync()
      initialized = true
      return NextResponse.json({ success: true, message: 'Playlist sync scheduler initialized' })
    }
    return NextResponse.json({ success: true, message: 'Playlist sync scheduler already running' })
  } catch (error) {
    console.error('[cron/init] Error initializing scheduler:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize scheduler' },
      { status: 500 }
    )
  }
}
