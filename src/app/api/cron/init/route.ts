import { NextResponse } from 'next/server'
import { initializePlaylistSync } from '@/lib/schedulers/playlistSync'

let initialized = false

export async function GET() {
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
