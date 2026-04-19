import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { QuotaEngine, isQuotaExhausted } from '@/lib/youtube/quota-engine'

const BATCH_SIZE = 5
const SYNC_THRESHOLD_HOURS = 24

async function syncChannel(channelId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await QuotaEngine.smartFetchVideos(channelId, 'refresh')

    await db.from('ChannelCache').upsert({
      youtubeId: channelId,
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured - sync-channels endpoint disabled')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const force = body.force === true

    const hoursAgo = new Date(Date.now() - SYNC_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString()

    const { data: channels, error } = await db
      .from('ChannelCache')
      .select('youtubeId,lastSyncedAt')
      .or(force ? 'lastSyncedAt.is.null' : `lastSyncedAt.lt.${hoursAgo},lastSyncedAt.is.null`)

    if (error) {
      console.error('Failed to fetch channels:', error)
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json({
        syncedCount: 0,
        failedCount: 0,
        errors: [],
        quotaExhausted: false,
        message: 'No channels to sync'
      })
    }

    const channelIds = channels.map(c => c.youtubeId)
    const errors: string[] = []
    let syncedCount = 0
    let failedCount = 0

    for (let i = 0; i < channelIds.length; i += BATCH_SIZE) {
      if (isQuotaExhausted()) {
        console.log('Quota exhausted, stopping sync')
        break
      }

      const batch = channelIds.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(batch.map(channelId => syncChannel(channelId)))

      for (const result of results) {
        if (result.success) {
          syncedCount++
        } else {
          failedCount++
          if (result.error) {
            errors.push(result.error)
          }
        }
      }
    }

    return NextResponse.json({
      syncedCount,
      failedCount,
      errors,
      quotaExhausted: isQuotaExhausted()
    })
  } catch (error) {
    console.error('Error in sync-channels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}