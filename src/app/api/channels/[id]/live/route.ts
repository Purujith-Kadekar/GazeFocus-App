import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import { QuotaEngine, isQuotaExhausted, VideoMetadata } from '@/lib/youtube/quota-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface LiveVideo {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  liveBroadcastContent: string
  viewerCount?: string | null
}

function toLiveVideos(videos: VideoMetadata[]): LiveVideo[] {
  return videos
    .map((video) => ({
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      publishedAt: video.publishedAt,
      liveBroadcastContent: video.liveBroadcastContent || 'none',
    }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const mode = (searchParams.get('mode') as 'initial' | 'refresh' | 'loadMore') || 'initial'
    const pageToken = searchParams.get('pageToken')
    const maxResults = parseInt(searchParams.get('maxResults') || '50')

    const { data: channel } = await supabase
      .from('Channel')
      .select('youtubeId')
      .eq('id', id)
      .eq('userId', user.id)
      .maybeSingle()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    let result: {
      videos: VideoMetadata[]
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

    const liveVideos = toLiveVideos(result.videos)

    // Enrich live videos with progress data for the current user
    if (liveVideos.length > 0) {
      const videoIds = liveVideos.map(v => v.youtubeId)
      const { data: progressData } = await supabase
        .from('VideoProgress')
        .select('*')
        .eq('userId', user.id)
        .in('youtubeId', videoIds)
      
      if (progressData && progressData.length > 0) {
        const progressMap = new Map(progressData.map(p => [p.youtubeId, p]))
        
        liveVideos.forEach(video => {
          const progress = progressMap.get(video.youtubeId)
          if (progress) {
            (video as any).progress = {
              secondsWatched: progress.secondsWatched,
              durationSeconds: progress.durationSeconds,
              completed: progress.completed,
              completedAt: progress.completedAt
            }
          }
        })
      }
    }

    return NextResponse.json({
      videos: liveVideos,
      nextPageToken: result.nextPageToken,
      source: result.source,
      hasMore: result.hasMore,
      quotaExhausted: isQuotaExhausted()
    })
  } catch (error) {
    console.error('Error fetching live videos:', error)
    return NextResponse.json({ error: 'Failed to fetch live videos' }, { status: 500 })
  }
}
