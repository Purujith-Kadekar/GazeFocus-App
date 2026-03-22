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

async function checkChannelLiveStatus(channelIdOrHandle: string): Promise<{
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

async function fetchChannelDetails(channelIdOrHandle: string): Promise<{
  title: string
  description: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  youtubeId: string
} | null> {
  if (!YOUTUBE_API_KEY) return null

  try {
    let actualChannelId = channelIdOrHandle
    const handle = channelIdOrHandle.startsWith('@') ? channelIdOrHandle.substring(1) : channelIdOrHandle

    if (channelIdOrHandle.startsWith('@')) {
      const searchResponse = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${handle}&key=${YOUTUBE_API_KEY}`
      )
      const searchData = await searchResponse.json()

      if (searchData.items && searchData.items.length > 0) {
        actualChannelId = searchData.items[0].id
      }
    }

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
      console.log('Could not resolve channel:', channelIdOrHandle)
      return null
    }

    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${actualChannelId}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()

    if (data.items && data.items.length > 0) {
      const channel = data.items[0]
      return {
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails?.maxres?.url || channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.medium?.url || '',
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        youtubeId: actualChannelId,
      }
    }
  } catch (error) {
    console.error('Error fetching channel details:', error)
  }
  return null
}

async function getUploadsPlaylistId(channelIdOrHandle: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null
  
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
      return null
    }

    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${actualChannelId}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()

    if (data.items && data.items.length > 0) {
      return data.items[0].contentDetails.relatedPlaylists.uploads
    }
  } catch (error) {
    console.error('Error getting uploads playlist ID:', error)
  }
  return null
}

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

async function fetchChannelVideos(channelYoutubeId: string): Promise<any[]> {
  if (!YOUTUBE_API_KEY) return []

  const uploadsPlaylistId = await getUploadsPlaylistId(channelYoutubeId)
  if (!uploadsPlaylistId) return []

  const videoIds: string[] = []
  const positionMap: Record<string, number> = {}
  let nextPageToken: string | undefined = undefined
  let position = 0

  do {
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('playlistId', uploadsPlaylistId)
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('key', YOUTUBE_API_KEY)
    if (nextPageToken) url.searchParams.set('pageToken', nextPageToken)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.items) {
      for (const item of data.items) {
        const videoId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId
        if (videoId) {
          videoIds.push(videoId)
          positionMap[videoId] = position++
        }
      }
    }
    nextPageToken = data.nextPageToken
  } while (nextPageToken && videoIds.length < 100)

  if (videoIds.length === 0) return []

  const videos: any[] = []
  const batchSize = 50
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batchIds = videoIds.slice(i, i + batchSize)
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${batchIds.join(',')}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()

    if (data.items) {
      for (const item of data.items) {
        if (!item.id || !item.snippet) continue
        videos.push({
          youtubeId: item.id,
          title: item.snippet.title || 'Untitled',
          description: item.snippet.description || '',
          thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`,
          publishedAt: item.snippet.publishedAt || '',
          duration: item.contentDetails?.duration ? parseDuration(item.contentDetails.duration) : 0,
          position: positionMap[item.id] ?? 0,
        })
      }
    }
  }

  return videos.sort((a, b) => a.position - b.position)
}

async function syncChannel(channel: { id: string; youtubeId: string; userId: string }) {
  const channelDetails = await fetchChannelDetails(channel.youtubeId)
  const resolvedYoutubeId = channelDetails?.youtubeId || channel.youtubeId

  const liveStatus = await checkChannelLiveStatus(resolvedYoutubeId)

  const updateData: any = {
    isLive: liveStatus.isLive,
    liveVideoId: liveStatus.liveVideoId,
    liveTitle: liveStatus.liveTitle,
    updatedAt: new Date().toISOString(),
  }

  if (channelDetails) {
    updateData.title = channelDetails.title
    updateData.thumbnail = channelDetails.thumbnail
    updateData.subscriberCount = channelDetails.subscriberCount
    updateData.videoCount = channelDetails.videoCount
    updateData.description = channelDetails.description
  }

  await updateChannelLiveStatus(channel.id, liveStatus.isLive, liveStatus.liveVideoId, liveStatus.liveTitle)

  await supabase
    .from('Channel')
    .update(updateData)
    .eq('id', channel.id)

  const channelVideos = await fetchChannelVideos(resolvedYoutubeId)

  let addedCount = 0

  if (channelVideos.length > 0) {
    for (const video of channelVideos.slice(0, 50)) {
      const { data: existingVideo } = await supabase
        .from('Video')
        .select('id')
        .eq('youtubeId', video.youtubeId)
        .eq('userId', channel.userId)
        .maybeSingle()

      if (!existingVideo) {
        const videoId = crypto.randomUUID()
        const now = new Date().toISOString()

        await supabase.from('Video').insert({
          id: videoId,
          youtubeId: video.youtubeId,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          duration: video.duration,
          position: video.position,
          channelId: channel.id,
          userId: channel.userId,
          createdAt: now,
          updatedAt: now,
        })
        addedCount++
      }
    }
  }

  const { count: totalVideos } = await supabase
    .from('Video')
    .select('*', { count: 'exact', head: true })
    .eq('channelId', channel.id)
    .eq('userId', channel.userId)

  return {
    channelId: channel.id,
    youtubeId: channel.youtubeId,
    addedCount,
    totalVideos: totalVideos || 0,
    isLive: liveStatus.isLive,
    liveVideoId: liveStatus.liveVideoId,
    liveTitle: liveStatus.liveTitle,
    title: channelDetails?.title,
    thumbnail: channelDetails?.thumbnail,
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId } = body

    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const { data: channel } = await supabase
      .from('Channel')
      .select('id, youtubeId, userId')
      .eq('id', channelId)
      .eq('userId', user.id)
      .maybeSingle()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const result = await syncChannel(channel)

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Error syncing channel:', error)
    return NextResponse.json({ error: 'Failed to sync channel', details: error.message }, { status: 500 })
  }
}
