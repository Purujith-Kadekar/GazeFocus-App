import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import {
  updateChannelLiveStatus,
} from '@/lib/channel-db'
import { QuotaEngine, isQuotaExhausted } from '@/lib/youtube/quota-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
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

    const { data: channels } = await supabase
      .from('Channel')
      .select('*')
      .eq('userId', user.id)

    const channelsList = channels || []
    const liveStatuses: any[] = []
    let liveCount = 0

    for (const channel of channelsList) {
      const status = await checkLiveStatus(channel.youtubeId)

      await updateChannelLiveStatus(channel.id, status.isLive, status.liveVideoId, status.liveTitle)

      liveStatuses.push({
        channelId: channel.id,
        ...status,
      })

      if (status.isLive) {
        liveCount++
      }
    }

    return NextResponse.json({
      channels: liveStatuses,
      liveCount,
      totalChannels: channelsList.length,
      quotaExhausted: isQuotaExhausted()
    })
  } catch (error: any) {
    console.error('Error checking live statuses:', error)
    return NextResponse.json({ error: 'Failed to check live statuses', details: error.message }, { status: 500 })
  }
}
