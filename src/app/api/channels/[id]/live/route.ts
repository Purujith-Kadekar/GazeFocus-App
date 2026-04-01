import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

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
  actualStartTime?: string
  actualEndTime?: string
  scheduledStartTime?: string
  viewerCount?: string | null
}

async function resolveChannelId(channelId: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null

  if (channelId.startsWith('UC')) {
    return channelId
  }

  const handle = channelId.startsWith('@') ? channelId.substring(1) : channelId

  try {
    // Try resolving via handle (works for @handle format)
    const handleResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${handle}&key=${YOUTUBE_API_KEY}`
    )
    const handleData = await handleResponse.json()
    if (handleData.items && handleData.items.length > 0) {
      return handleData.items[0].id
    }

    // Fallback: try resolving via legacy username
    const usernameResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=id&forUsername=${handle}&key=${YOUTUBE_API_KEY}`
    )
    const usernameData = await usernameResponse.json()
    if (usernameData.items && usernameData.items.length > 0) {
      return usernameData.items[0].id
    }
  } catch (error) {
    console.error('Error resolving channel ID:', error)
  }

  return null
}

async function fetchVideosByEventType(resolvedId: string, eventType: string | null): Promise<string[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId: resolvedId,
    type: 'video',
    maxResults: '50',
    key: YOUTUBE_API_KEY!,
  })

  if (eventType) {
    params.set('eventType', eventType)
  } else {
    // Only add order when not filtering by eventType, as the combination
    // can cause YouTube API to return errors for some event types
    params.set('order', 'date')
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params.toString()}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error(`YouTube API error (${response.status}) for eventType=${eventType}:`, errorData?.error?.message || response.statusText)
    return []
  }

  const data = await response.json()

  if (data.error) {
    console.error(`YouTube API error for eventType=${eventType}:`, data.error)
    return []
  }

  return data.items?.map((item: any) => item.id.videoId).filter(Boolean) || []
}

async function fetchVideoDetails(videoIds: string[]): Promise<any[]> {
  if (videoIds.length === 0) return []

  const batches: string[][] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50))
  }

  const allDetails: any[] = []

  for (const batch of batches) {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,liveStreamingDetails&id=${batch.join(',')}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()
    if (data.items) {
      allDetails.push(...data.items)
    }
  }

  return allDetails
}

async function fetchLiveVideos(channelYoutubeId: string): Promise<LiveVideo[]> {
  const liveVideos: LiveVideo[] = []

  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API key not configured')
    return []
  }

  try {
    const resolvedId = await resolveChannelId(channelYoutubeId)
    if (!resolvedId) {
      console.error('Could not resolve channel ID:', channelYoutubeId)
      return []
    }

    // Fetch live, upcoming, and completed (past) live streams
    const [liveIds, upcomingIds, completedIds] = await Promise.all([
      fetchVideosByEventType(resolvedId, 'live'),
      fetchVideosByEventType(resolvedId, 'upcoming'),
      fetchVideosByEventType(resolvedId, 'completed'),
    ])

    // Combine all video IDs and deduplicate
    const allIds = [...new Set([...liveIds, ...upcomingIds, ...completedIds])]

    if (allIds.length === 0) {
      return []
    }

    // Fetch details for all videos
    const videoDetails = await fetchVideoDetails(allIds)

    for (const video of videoDetails) {
      const snippet = video.snippet
      const liveDetails = video.liveStreamingDetails || {}

      const liveBroadcastContent = snippet.liveBroadcastContent || 'none'
      const actualStartTime = liveDetails.actualStartTime || null
      const actualEndTime = liveDetails.actualEndTime || null
      const scheduledStartTime = liveDetails.scheduledStartTime || null
      const concurrentViewers = liveDetails.concurrentViewers

      const isCurrentlyLive = liveBroadcastContent === 'live'
      const isUpcoming = liveBroadcastContent === 'upcoming'
      // Include as a past broadcast if it has any live streaming details
      // (actualStartTime may be absent for broadcasts that were cancelled before starting)
      const isPastBroadcast = video.liveStreamingDetails != null

      // Include if it's live, upcoming, or has live streaming details (past broadcast)
      if (!isCurrentlyLive && !isUpcoming && !isPastBroadcast) {
        continue
      }

      const thumbnail = snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`

      let broadcastStatus = 'completed'
      if (isCurrentlyLive) {
        broadcastStatus = 'live'
      } else if (isUpcoming) {
        broadcastStatus = 'upcoming'
      }

      liveVideos.push({
        youtubeId: video.id,
        title: snippet.title || 'Untitled',
        description: snippet.description || '',
        thumbnail,
        publishedAt: snippet.publishedAt || '',
        liveBroadcastContent: broadcastStatus,
        actualStartTime: actualStartTime || undefined,
        actualEndTime: actualEndTime || undefined,
        scheduledStartTime: scheduledStartTime || undefined,
        viewerCount: concurrentViewers ? String(concurrentViewers) : null,
      })
    }

    // Sort: live first, then upcoming, then completed by date
    liveVideos.sort((a, b) => {
      const aTime = a.actualStartTime || a.scheduledStartTime || a.publishedAt
      const bTime = b.actualStartTime || b.scheduledStartTime || b.publishedAt

      if (a.liveBroadcastContent === 'live' && b.liveBroadcastContent !== 'live') return -1
      if (a.liveBroadcastContent !== 'live' && b.liveBroadcastContent === 'live') return 1
      if (a.liveBroadcastContent === 'upcoming' && b.liveBroadcastContent === 'completed') return -1
      if (a.liveBroadcastContent === 'completed' && b.liveBroadcastContent === 'upcoming') return 1

      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  } catch (error) {
    console.error('Error fetching live videos:', error)
  }

  return liveVideos
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

    const { data: channel } = await supabase
      .from('Channel')
      .select('youtubeId')
      .eq('id', id)
      .eq('userId', user.id)
      .maybeSingle()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const liveVideos = await fetchLiveVideos(channel.youtubeId)

    return NextResponse.json(liveVideos)
  } catch (error) {
    console.error('Error fetching live videos:', error)
    return NextResponse.json({ error: 'Failed to fetch live videos' }, { status: 500 })
  }
}
