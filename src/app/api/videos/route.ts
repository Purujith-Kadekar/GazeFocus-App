import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

// GET /api/videos - Get all videos or filter by youtubeId/playlistId
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

    let query = db.from('Video').select('*, Playlist(*)')
    query = query.eq('userId', userId)

    if (playlistId !== null && playlistId !== undefined) {
      query = query.eq('playlistId', playlistId)
    } else if (standaloneOnly && !youtubeId) {
      query = query.is('playlistId', null)
    }

    if (youtubeId) {
      query = query.eq('youtubeId', youtubeId)
    }

    query = query.order('position', { ascending: true }).order('createdAt', { ascending: true })

    const { data: videos, error } = await query

    if (error) throw error

    // Map the relation name from Supabase format
    const mappedVideos = (videos || []).map((v: any) => ({
      ...v,
      playlist: v.Playlist || null,
      Playlist: undefined,
    }))

    return NextResponse.json(mappedVideos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

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
    const data = await response.json() as any

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

// POST /api/videos - Add a new video
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
      return NextResponse.json(
        { error: 'YouTube ID is required' },
        { status: 400 }
      )
    }

    // Validate YouTube video ID format (11 alphanumeric/-/_ characters)
    const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/
    if (!YOUTUBE_ID_RE.test(youtubeId)) {
      return NextResponse.json(
        { error: 'Invalid YouTube ID' },
        { status: 400 }
      )
    }

    // Check if video already exists for this user
    const { data: existing } = await db.from('Video').select('id').eq('youtubeId', youtubeId).eq('userId', userId).limit(1).maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'This video already exists in your library' },
        { status: 400 }
      )
    }

    // Fetch additional details from YouTube if API key is available
    let videoData: YouTubeVideoDetails | null = null
    if (YOUTUBE_API_KEY) {
      videoData = await fetchYouTubeVideoDetails(youtubeId)
    }

    // Use fetched data or fall back to provided/manual data
    const finalTitle = title || videoData?.title || 'YouTube Video'
    const finalDescription = description || videoData?.description || ''
    const finalThumbnail = thumbnail || videoData?.thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    const finalDuration = videoData?.duration ?? 0

    const { data: video, error } = await db.from('Video').insert({
      youtubeId,
      title: finalTitle,
      description: finalDescription,
      thumbnail: finalThumbnail,
      duration: finalDuration,
      playlistId: null,
      userId,
      position: 0,
    }).select().single()

    if (error) throw error

    // Create/update libraryItem entry for video
    await db.from('LibraryItem').upsert({
      userId,
      type: 'VIDEO',
      externalId: youtubeId,
      title: finalTitle,
      folderId: folderId || null,
    }, { onConflict: 'userId,type,externalId' }).select()

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
