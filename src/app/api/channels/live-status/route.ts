import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import {
  updateChannelLiveStatus,
} from '@/lib/channel-db'
import { QuotaEngine, isQuotaExhausted } from '@/lib/youtube/quota-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Bound queries like the shared client in src/lib/db.ts.
const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS || 8000)
const timeoutFetch: typeof fetch = (input, init) => {
  return fetch(input, { ...init, signal: AbortSignal.timeout(DB_TIMEOUT_MS) })
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: timeoutFetch,
  },
})

async function checkLiveStatus(channelIdOrHandle: string): Promise<{
  isLive: boolean
  liveVideoId: string | null
  liveTitle: string | null
  latestVideoPublishedAt: string | null
  source: 'cache' | 'none'
}> {
  try {
    const latest = await QuotaEngine.getLatestCachedVideoInfo(channelIdOrHandle)

    if (!latest.publishedAt) {
      return { isLive: false, liveVideoId: null, liveTitle: null, latestVideoPublishedAt: null, source: 'none' }
    }

    const publishedAt = new Date(latest.publishedAt).getTime()
    const ageMinutes = Number.isFinite(publishedAt)
      ? (Date.now() - publishedAt) / (1000 * 60)
      : Number.POSITIVE_INFINITY

    const titleLooksLive = /\b(live|stream)\b/i.test(latest.title || '')
    const isLikelyLive = titleLooksLive && ageMinutes >= 0 && ageMinutes <= 30

    return {
      isLive: isLikelyLive,
      liveVideoId: isLikelyLive ? latest.youtubeId : null,
      liveTitle: isLikelyLive ? latest.title : null,
      latestVideoPublishedAt: latest.publishedAt,
      source: 'cache',
    }
  } catch (error) {
    console.error('Error checking live status via JSON cache:', error)
    return { isLive: false, liveVideoId: null, liveTitle: null, latestVideoPublishedAt: null, source: 'none' }
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: channels, error: channelsError } = await supabase
      .from('Channel')
      .select('id,userId,youtubeId,title,description,thumbnail,subscriberCount,videoCount,isLive,liveVideoId,liveTitle,createdAt,updatedAt')
      .eq('userId', user.id)

    if (channelsError) {
      console.error('Error fetching channels for live status:', channelsError)
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const channelsList = channels || []
    const liveStatuses: Array<{ channelId: string; isLive: boolean; liveVideoId: string | null; liveTitle: string | null }> = []

    // Per-channel work is independent — process all channels in parallel
    // instead of a sequential loop, so N channels cost one round-trip of
    // wall-clock time instead of N.
    const statuses = await Promise.all(
      channelsList.map(async (channel) => {
        const status = await checkLiveStatus(channel.youtubeId)
        // Status write is best-effort: the cached read already decided the
        // answer, a failed write must not fail the whole response.
        try {
          await updateChannelLiveStatus(channel.id, status.isLive, status.liveVideoId, status.liveTitle)
        } catch (writeError) {
          console.error(`Failed to persist live status for channel ${channel.id}:`, writeError)
        }
        return { channelId: channel.id, ...status }
      })
    )

    const liveCount = statuses.filter((s) => s.isLive).length
    liveStatuses.push(...statuses)

    return NextResponse.json({
      channels: liveStatuses,
      liveCount,
      totalChannels: channelsList.length,
      quotaExhausted: isQuotaExhausted()
    })
  } catch (error) {
    console.error('Error checking live statuses:', error)
    return NextResponse.json({ error: 'Failed to check live statuses', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
