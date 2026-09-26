import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import type { ChannelVideo } from '@/types'
import { QuotaEngine } from '@/lib/youtube/quota-engine'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

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

async function fetchChannelVideos(channelYoutubeId: string): Promise<ChannelVideo[]> {
  if (!YOUTUBE_API_KEY) return []

  const uploadsPlaylistId = await getUploadsPlaylistId(channelYoutubeId)
  if (!uploadsPlaylistId) return []

  const videos: ChannelVideo[] = []
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
  
  const now = new Date().toISOString()
  const updateData: Record<string, unknown> = {
    updatedAt: now,
  }

  if (channelDetails) {
    updateData.title = channelDetails.title
    if (channelDetails.thumbnail) {
      updateData.thumbnail = channelDetails.thumbnail
    }
    updateData.subscriberCount = channelDetails.subscriberCount
    updateData.videoCount = channelDetails.videoCount
    updateData.description = channelDetails.description
  }

  // Smart discovery using RSS-first approach (QuotaEngine)
  const { videos } = await QuotaEngine.smartFetchVideos(resolvedYoutubeId, 'refresh', 50, channel.userId)
  
  // Update channel live status from discovered videos (no search unit needed!)
  const liveVideo = videos.find(v => v.liveBroadcastContent === 'live')
  updateData.isLive = !!liveVideo
  updateData.liveVideoId = liveVideo?.youtubeId || null
  updateData.liveTitle = liveVideo?.title || null

  await db.from('Channel').update(updateData).eq('id', channel.id)

  let addedCount = 0
  let adoptedCount = 0
  if (videos.length > 0) {
    const fetchedIds = videos.map(v => v.youtubeId)
    
    // === CRITICAL FIX: Proper content categorization ===
    // Find ALL existing videos with these youtubeIds (regardless of channelId)
    // This includes standalone videos (channelId=null) and videos from other contexts
    const { data: existingVideos } = await db
      .from('Video')
      .select('id, youtubeId, channelId, playlistId')
      .eq('userId', channel.userId)
      .in('youtubeId', fetchedIds)

    const existingMap = new Map<string, { id: string; channelId: string | null; playlistId: string | null }>(
      (existingVideos || []).map((v: { id: string; youtubeId: string; channelId: string | null; playlistId: string | null }) => [v.youtubeId, v])
    )
    
    // Separate into: videos to adopt (standalone → channel), videos to insert (new), videos to skip
    const videosToAdopt: string[] = [] // youtubeIds of standalone videos to claim for this channel
    const videosToInsert: Array<{
      id: string
      youtubeId: string
      title: string
      description: string
      thumbnail: string
      duration: number
      position: number
      channelId: string
      userId: string
      createdAt: string
      updatedAt: string
    }> = [] // truly new videos
    
    for (const video of videos) {
      const existing = existingMap.get(video.youtubeId)
      
      if (existing) {
        // Video already exists
        if (!existing.channelId && !existing.playlistId) {
          // Standalone video → adopt it for this channel
          // This moves it from the Videos section to the Channel section
          videosToAdopt.push(video.youtubeId)
        }
        // If it's already in a playlist or another channel, leave it there
        // The user explicitly added it in that context, don't override
      } else {
        // Truly new video → insert with channelId set
        videosToInsert.push({
          id: crypto.randomUUID(),
          youtubeId: video.youtubeId,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          duration: video.duration || 0,
          position: 0,
          channelId: channel.id,
          userId: channel.userId,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    // Insert new videos
    if (videosToInsert.length > 0) {
      const { error: insertError } = await db.from('Video').insert(videosToInsert)
      if (!insertError) addedCount = videosToInsert.length
    }

    // Adopt standalone videos: update their channelId
    // This moves them from the dashboard's "Videos" section to the "Channels" section
    for (const youtubeId of videosToAdopt) {
      await db.from('Video')
        .update({ channelId: channel.id, updatedAt: now })
        .eq('youtubeId', youtubeId)
        .eq('userId', channel.userId)
      adoptedCount++
    }

    // Clean up stale LibraryItems: standalone VIDEO items that now belong to a channel
    // should be removed so the video doesn appear in both sections
    if (videosToAdopt.length > 0) {
      await db.from('LibraryItem')
        .delete()
        .eq('userId', channel.userId)
        .eq('type', 'VIDEO')
        .in('externalId', videosToAdopt)
    }
  }

  return {
    channelId: channel.id,
    addedCount,
    adoptedCount,
    isLive: updateData.isLive,
    liveVideoId: updateData.liveVideoId,
    liveTitle: updateData.liveTitle,
    title: channelDetails?.title,
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: channels, error } = await db
      .from('Channel')
      .select('id,userId,youtubeId,title,description,thumbnail,subscriberCount,videoCount,isLive,liveVideoId,liveTitle,createdAt,updatedAt')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching channels:', error)
      return NextResponse.json({ error: 'Failed to fetch channels', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }

    return NextResponse.json(channels || [])
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ error: 'Failed to fetch channels', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
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

    const { data: existing } = await db
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

    const { data: channel, error } = await db
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
      .select('id,userId,youtubeId,title,description,thumbnail,subscriberCount,videoCount,isLive,liveVideoId,liveTitle,createdAt,updatedAt')
      .single()

    if (error) {
      console.error('Error creating channel:', error)
      return NextResponse.json({ error: 'Failed to create channel', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }

    const libraryItemId = crypto.randomUUID()
    await db.from('LibraryItem').insert({
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
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json({ error: 'Failed to create channel', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
