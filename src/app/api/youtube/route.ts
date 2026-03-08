import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const playlistId = searchParams.get('playlistId')
    const query = searchParams.get('q')
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      )
    }

    // Support id and type parameters for fetching details
    if (id && type) {
      if (type === 'video') {
        const response = await fetch(
          `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${id}&key=${YOUTUBE_API_KEY}`
        )
        const data = await response.json()

        if (data.error) {
          return NextResponse.json({ error: data.error.message }, { status: 400 })
        }

        if (!data.items || data.items.length === 0) {
          return NextResponse.json({ error: 'Video not found' }, { status: 404 })
        }

        const video = data.items[0]
        return NextResponse.json({
          youtubeId: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
          channelId: video.snippet.channelId,
          channelName: video.snippet.channelTitle,
          duration: parseDuration(video.contentDetails.duration),
        })
      } else if (type === 'playlist') {
        const response = await fetch(
          `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${id}&key=${YOUTUBE_API_KEY}`
        )
        const data = await response.json()

        if (data.error) {
          return NextResponse.json({ error: data.error.message }, { status: 400 })
        }

        if (!data.items || data.items.length === 0) {
          return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
        }

        const playlist = data.items[0]
        return NextResponse.json({
          youtubeId: playlist.id,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          thumbnail: playlist.snippet.thumbnails?.maxres?.url || playlist.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
          channelId: playlist.snippet.channelId,
          channelName: playlist.snippet.channelTitle,
          totalVideos: playlist.contentDetails.itemCount,
        })
      }
    }

    // Search for videos and playlists
    if (query) {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video,playlist&key=${YOUTUBE_API_KEY}`
      )
      const data = await response.json()

      if (data.error) {
        return NextResponse.json({ error: data.error.message }, { status: 400 })
      }

      const results = data.items?.map((item: any) => ({
        id: item.id.videoId || item.id.playlistId,
        type: item.id.kind === 'youtube#video' ? 'video' : 'playlist',
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id.videoId || item.id.playlistId}/maxresdefault.jpg`,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
      })) || []

      return NextResponse.json(results)
    }

    if (videoId) {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
      )
      const data = await response.json()

      if (data.error) {
        return NextResponse.json({ error: data.error.message }, { status: 400 })
      }

      if (!data.items || data.items.length === 0) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
      }

      const video = data.items[0]
      return NextResponse.json({
        youtubeId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.medium?.url,
        channelId: video.snippet.channelId,
        channelName: video.snippet.channelTitle,
        duration: parseDuration(video.contentDetails.duration),
      })
    }

    if (playlistId) {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${YOUTUBE_API_KEY}`
      )
      const data = await response.json()

      if (data.error) {
        return NextResponse.json({ error: data.error.message }, { status: 400 })
      }

      if (!data.items || data.items.length === 0) {
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
      }

      const playlist = data.items[0]
      return NextResponse.json({
        youtubeId: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        thumbnail: playlist.snippet.thumbnails.maxres?.url || playlist.snippet.thumbnails.medium?.url,
        channelId: playlist.snippet.channelId,
        channelName: playlist.snippet.channelTitle,
        totalVideos: playlist.contentDetails.itemCount,
      })
    }

    return NextResponse.json({ error: 'videoId or playlistId required' }, { status: 400 })
  } catch (error) {
    console.error('YouTube API error:', error)
    return NextResponse.json({ error: 'Failed to fetch from YouTube' }, { status: 500 })
  }
}

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}
