import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import {
  updateChannelLiveStatus,
} from '@/lib/channel-db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

async function checkLiveStatus(channelIdOrHandle: string): Promise<{
  isLive: boolean
  liveVideoId: string | null
  liveTitle: string | null
}> {
  if (!YOUTUBE_API_KEY) {
    return { isLive: false, liveVideoId: null, liveTitle: null }
  }

  try {
    let actualChannelId = channelIdOrHandle
    const handle = channelIdOrHandle.startsWith('@') ? channelIdOrHandle.substring(1) : channelIdOrHandle

    if (!actualChannelId.startsWith('UC')) {
      const searchResponse = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${handle}&key=${YOUTUBE_API_KEY}`
      )
      const searchData = await searchResponse.json()

      if (searchData.items && searchData.items.length > 0) {
        actualChannelId = searchData.items[0].id
      }
    }

    if (!actualChannelId.startsWith('UC')) {
      return { isLive: false, liveVideoId: null, liveTitle: null }
    }

    const liveSearchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${actualChannelId}&eventType=live&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`
    )
    const searchData = await liveSearchResponse.json()

    if (searchData.error) {
      return { isLive: false, liveVideoId: null, liveTitle: null }
    }

    if (searchData.items && searchData.items.length > 0) {
      const liveVideo = searchData.items[0]
      return {
        isLive: true,
        liveVideoId: liveVideo.id.videoId,
        liveTitle: liveVideo.snippet.title,
      }
    }
  } catch (error) {
    console.error('Error checking live status:', error)
  }

  return { isLive: false, liveVideoId: null, liveTitle: null }
}

export async function GET(request: NextRequest) {
  try {
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
    }

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
    })
  } catch (error: any) {
    console.error('Error checking live statuses:', error)
    return NextResponse.json({ error: 'Failed to check live statuses', details: error.message }, { status: 500 })
  }
}
