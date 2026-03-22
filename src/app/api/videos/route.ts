import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'

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

interface YouTubeVideoDetails {
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  duration: number;
}

async function fetchYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set. Video details cannot be fetched.')
    return null
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json() as {
      items?: {
        snippet: {
          title: string;
          description: string;
          thumbnails: {
            maxres?: { url: string };
            medium?: { url: string };
          };
          channelId: string;
          channelTitle: string;
        };
        contentDetails: {
          duration: string;
        };
      }[];
      error?: any;
    }

    if (data.error) {
      console.error('Error fetching YouTube video details:', data.error)
      return null
    }

    if (data.items && data.items.length > 0) {
      const video = data.items[0]
      return {
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.medium?.url || '',
        channelId: video.snippet.channelId,
        channelName: video.snippet.channelTitle,
        duration: parseDuration(video.contentDetails.duration),
      }
    }
  } catch (error) {
    console.error('Error fetching YouTube video details:', error)
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get('playlistId')
    const youtubeId = searchParams.get('youtubeId')
    const standaloneOnly = searchParams.get('standaloneOnly') === 'true'
    const channelId = searchParams.get('channelId')

    let query = supabase.from('Video').select('*').eq('userId', userId)

    if (channelId !== null && channelId !== undefined && channelId !== '') {
      query = query.eq('channelId', channelId)
    } else if (playlistId !== null && playlistId !== undefined && playlistId !== '') {
      query = query.eq('playlistId', playlistId)
    } else if (standaloneOnly || youtubeId === null) {
      query = query.is('playlistId', null).is('channelId', null)
    }

    if (youtubeId) {
      query = query.eq('youtubeId', youtubeId)
    }

    const { data: videos, error } = await query.order('position', { ascending: true }).order('createdAt', { ascending: true })

    if (error) {
      console.error('Error fetching videos:', error)
      return NextResponse.json({ error: 'Failed to fetch videos', details: error.message }, { status: 500 })
    }

    if (videos && videos.length > 0 && !standaloneOnly) {
      const playlistIds = videos.map(v => v.playlistId).filter((id): id is string => id !== null)
      if (playlistIds.length > 0) {
        const { data: playlists } = await supabase.from('Playlist').select('*').in('id', playlistIds)
        const playlistMap = new Map(playlists?.map(p => [p.id, p]) || [])
        const enrichedVideos = videos.map(v => ({
          ...v,
          playlist: v.playlistId ? playlistMap.get(v.playlistId) : null
        }))
        return NextResponse.json(enrichedVideos)
      }
    }

    return NextResponse.json(videos || [])
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { youtubeId, folderId, title, description, thumbnail, channelId, channelName } = body

    if (!youtubeId) {
      return NextResponse.json({ error: 'YouTube ID is required' }, { status: 400 })
    }

    const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/
    if (!YOUTUBE_ID_RE.test(youtubeId)) {
      return NextResponse.json({ error: 'Invalid YouTube ID' }, { status: 400 })
    }

    const { data: existing } = await supabase.from('Video').select('id').eq('youtubeId', youtubeId).eq('userId', userId).single()

    if (existing) {
      return NextResponse.json({ error: 'This video already exists in your library' }, { status: 400 })
    }

    let videoData: YouTubeVideoDetails | null = null
    if (YOUTUBE_API_KEY) {
      videoData = await fetchYouTubeVideoDetails(youtubeId)
    }

    const finalTitle = title || videoData?.title || 'YouTube Video'
    const finalDescription = description || videoData?.description || ''
    const finalThumbnail = thumbnail || videoData?.thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    const finalDuration = videoData?.duration ?? 0

    const videoId = `video-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()

    const { data: video, error: videoError } = await supabase.from('Video').insert({
      id: videoId,
      youtubeId,
      title: finalTitle,
      description: finalDescription,
      thumbnail: finalThumbnail,
      duration: finalDuration,
      playlistId: null,
      userId,
      position: 0,
      createdAt: now,
      updatedAt: now,
    }).select().single()

    if (videoError) {
      console.error('Error creating video:', videoError)
      return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
    }

    const libraryItemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    await supabase.from('LibraryItem').upsert({
      id: libraryItemId,
      userId,
      type: 'VIDEO',
      externalId: youtubeId,
      title: finalTitle,
      folderId: folderId || null,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'userId,type,externalId',
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
  }
}
