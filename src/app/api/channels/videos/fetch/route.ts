import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import { QuotaEngine, isQuotaExhausted } from '@/lib/youtube/quota-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const mode = (searchParams.get('mode') as 'initial' | 'loadMore' | 'refresh') || 'initial'
    const pageToken = searchParams.get('pageToken')
    const maxResults = parseInt(searchParams.get('maxResults') || '50')

    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    // Verify channel belongs to user
    const { data: channel } = await supabase
      .from('Channel')
      .select('youtubeId')
      .eq('id', channelId)
      .eq('userId', user.id)
      .maybeSingle()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    let result: {
      videos: any[]
      nextPageToken: string | null
      source: 'api' | 'cache' | 'rss'
      hasMore: boolean
    }

    if (mode === 'loadMore') {
      const resolvedPageToken = pageToken || (await QuotaEngine.getChannelCacheState(channel.youtubeId))?.nextPageToken

      if (!resolvedPageToken) {
        result = {
          videos: [],
          nextPageToken: null,
          source: 'api',
          hasMore: false,
        }
      } else {
        result = await QuotaEngine.loadMoreVideos(channel.youtubeId, resolvedPageToken, maxResults, user.id)
      }
    } else {
      result = await QuotaEngine.smartFetchVideos(channel.youtubeId, mode, maxResults, user.id)
    }

    return NextResponse.json({
      ...result,
      quotaExhausted: isQuotaExhausted()
    })
  } catch (error: any) {
    console.error('Error in smart-fetch-videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos', details: error.message }, { status: 500 })
  }
}
