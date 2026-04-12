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

async function fetchYouTubeChannelDetails(channelIdOrHandle: string): Promise<{
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
      } else {
        const byUsernameResponse = await fetch(
          `${YOUTUBE_API_BASE}/channels?part=id&forUsername=${handle}&key=${YOUTUBE_API_KEY}`
        )
        const byUsernameData = await byUsernameResponse.json()
        if (byUsernameData.items && byUsernameData.items.length > 0) {
          actualChannelId = byUsernameData.items[0].id
        }
      }
    }

    if (!actualChannelId || !actualChannelId.startsWith('UC')) {
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
    console.error('Error fetching YouTube channel details:', error)
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

async function checkLiveStatus(channelIdOrHandle: string): Promise<{
  isLive: boolean
  liveVideoId: string | null
  liveTitle: string | null
}> {
  if (!YOUTUBE_API_KEY) return { isLive: false, liveVideoId: null, liveTitle: null }

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

    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${actualChannelId}&eventType=live&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`
    )
    const searchData = await searchResponse.json()

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

async function fetchChannelVideos(channelYoutubeId: string): Promise<any[]> {
  if (!YOUTUBE_API_KEY) return []

  const uploadsPlaylistId = await getUploadsPlaylistId(channelYoutubeId)
  if (!uploadsPlaylistId) return []

  const videos: any[] = []
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
        if (videoId && item.snippet) {
          videos.push({
            youtubeId: videoId,
            title: item.snippet.title || 'Untitled',
            description: item.snippet.description || '',
            thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            publishedAt: item.contentDetails?.videoPublishedAt || item.snippet.publishedAt || '',
            duration: 0,
            position: position++,
          })
        }
      }
    }
    nextPageToken = data.nextPageToken
  } while (nextPageToken && videos.length < 100)

  return videos
}

async function syncChannel(channel: { id: string; youtubeId: string; userId: string }) {
  const channelDetails = await fetchYouTubeChannelDetails(channel.youtubeId)
  const resolvedYoutubeId = channelDetails?.youtubeId || channel.youtubeId
  const liveStatus = await checkLiveStatus(resolvedYoutubeId)

  const now = new Date().toISOString()
  const updateData: any = {
    isLive: liveStatus.isLive,
    liveVideoId: liveStatus.liveVideoId,
    liveTitle: liveStatus.liveTitle,
    updatedAt: now,
  }

  if (channelDetails) {
    updateData.title = channelDetails.title
    updateData.thumbnail = channelDetails.thumbnail
    updateData.subscriberCount = channelDetails.subscriberCount
    updateData.videoCount = channelDetails.videoCount
    updateData.description = channelDetails.description
  }

  await supabase.from('Channel').update(updateData).eq('id', channel.id)

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

  return {
    channelId: channel.id,
    addedCount,
    isLive: liveStatus.isLive,
    liveVideoId: liveStatus.liveVideoId,
    liveTitle: liveStatus.liveTitle,
    title: channelDetails?.title,
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: channels, error } = await supabase
      .from('Channel')
      .select('id,userId,youtubeId,title,description,thumbnail,subscriberCount,videoCount,isLive,liveVideoId,liveTitle,createdAt,updatedAt')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching channels:', error)
      return NextResponse.json({ error: 'Failed to fetch channels', details: error.message }, { status: 500 })
    }

    return NextResponse.json(channels || [])
  } catch (error: any) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ error: 'Failed to fetch channels', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { youtubeId, folderId } = body

    if (!youtubeId) {
      return NextResponse.json({ error: 'YouTube Channel ID is required' }, { status: 400 })
    }

    let channelDetails = await fetchYouTubeChannelDetails(youtubeId)

    if (!channelDetails) {
      return NextResponse.json(
        { error: 'Could not find channel. Please check the URL and try again.' },
        { status: 400 }
      )
    }

    const resolvedYoutubeId = channelDetails.youtubeId

    const { data: existing } = await supabase
      .from('Channel')
      .select('id')
      .eq('youtubeId', resolvedYoutubeId)
      .eq('userId', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'This channel already exists in your library' }, { status: 400 })
    }

    const channelId = crypto.randomUUID()
    const now = new Date().toISOString()

    const { data: channel, error } = await supabase
      .from('Channel')
      .insert({
        id: channelId,
        userId: user.id,
        youtubeId: resolvedYoutubeId,
        title: channelDetails.title,
        description: channelDetails.description,
        thumbnail: channelDetails.thumbnail,
        subscriberCount: channelDetails.subscriberCount,
        videoCount: channelDetails.videoCount,
        isLive: false,
        liveVideoId: null,
        liveTitle: null,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating channel:', error)
      return NextResponse.json({ error: 'Failed to create channel', details: error.message }, { status: 500 })
    }

    const libraryItemId = crypto.randomUUID()
    await supabase.from('LibraryItem').insert({
      id: libraryItemId,
      userId: user.id,
      externalId: channel.id,
      type: 'CHANNEL',
      title: channelDetails.title,
      folderId: folderId || null,
      createdAt: now,
      updatedAt: now,
    })

    const syncResult = await syncChannel({
      id: channel.id,
      youtubeId: resolvedYoutubeId,
      userId: user.id,
    })

    return NextResponse.json({
      ...channel,
      title: channelDetails.title,
      isLive: syncResult.isLive,
      liveVideoId: syncResult.liveVideoId,
      liveTitle: syncResult.liveTitle,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating channel:', error)
    return NextResponse.json({ error: 'Failed to create channel', details: error.message }, { status: 500 })
  }
}
