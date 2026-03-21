import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface PlaylistVideo {
  youtubeId: string; title: string; description: string; thumbnail: string; duration: number; position: number;
}

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0
  return parseInt(match[1] || '0') * 3600 + parseInt(match[2] || '0') * 60 + parseInt(match[3] || '0')
}

async function fetchAllPlaylistVideos(playlistYoutubeId: string): Promise<PlaylistVideo[]> {
  if (!YOUTUBE_API_KEY) return []
  const videoIds: string[] = []
  const positionMap: Record<string, number> = {}
  let nextPageToken: string | undefined = undefined

  do {
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('playlistId', playlistYoutubeId)
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('key', YOUTUBE_API_KEY)
    if (nextPageToken) url.searchParams.set('pageToken', nextPageToken)

    const response = await fetch(url.toString())
    const data = await response.json() as any
    if (data.error) break

    if (data.items) {
      for (const item of data.items) {
        const videoId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId
        if (videoId) { videoIds.push(videoId); positionMap[videoId] = item.snippet?.position ?? 0 }
      }
    }
    nextPageToken = data.nextPageToken
  } while (nextPageToken)

  if (videoIds.length === 0) return []

  const videos: PlaylistVideo[] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50)
    const response = await fetch(`${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${batchIds.join(',')}&key=${YOUTUBE_API_KEY}`)
    const data = await response.json() as any
    if (data.error || !data.items) continue

    for (const item of data.items) {
      if (!item.id || !item.snippet) continue
      videos.push({
        youtubeId: item.id, title: item.snippet.title || 'Untitled', description: item.snippet.description || '',
        thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`,
        duration: item.contentDetails?.duration ? parseDuration(item.contentDetails.duration) : 0,
        position: positionMap[item.id] ?? 0,
      })
    }
  }
  return videos.sort((a, b) => a.position - b.position)
}

async function syncPlaylist(playlist: { id: string; youtubeId: string; userId: string }) {
  const playlistVideos = await fetchAllPlaylistVideos(playlist.youtubeId)
  const { data: existingVideos } = await db.from('Video').select('youtubeId').eq('userId', playlist.userId).eq('playlistId', playlist.id)
  const existingVideoIds = new Set((existingVideos || []).map((v: any) => v.youtubeId))
  const missingVideos = playlistVideos.filter(v => !existingVideoIds.has(v.youtubeId))

  if (missingVideos.length > 0) {
    await db.from('Video').insert(missingVideos.map(video => ({
      youtubeId: video.youtubeId, title: video.title, description: video.description,
      thumbnail: video.thumbnail, duration: video.duration, position: video.position,
      playlistId: playlist.id, userId: playlist.userId,
    })))
  }

  const { data: allPlaylistVideos } = await db.from('Video').select('duration').eq('userId', playlist.userId).eq('playlistId', playlist.id)
  const totalDuration = (allPlaylistVideos || []).reduce((sum: number, v: any) => sum + (v.duration || 0), 0)
  await db.from('Playlist').update({ totalDuration }).eq('id', playlist.id)

  return { playlistId: playlist.id, youtubeId: playlist.youtubeId, addedCount: missingVideos.length, totalVideos: (allPlaylistVideos || []).length }
}

export async function POST(request: NextRequest) {
  try {
    if (!YOUTUBE_API_KEY) return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })

    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isCronRequest = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`)

    if (isCronRequest) {
      const { data: playlists } = await db.from('Playlist').select('id, youtubeId, userId')
      let syncedPlaylists = 0, addedVideos = 0
      for (const playlist of playlists || []) {
        const result = await syncPlaylist(playlist)
        syncedPlaylists += 1; addedVideos += result.addedCount
      }
      return NextResponse.json({ success: true, mode: 'cron', syncedPlaylists, addedVideos })
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({})) as { playlistId?: string }
    const playlistId = body.playlistId
    if (!playlistId) return NextResponse.json({ error: 'playlistId is required' }, { status: 400 })

    const { data: playlist } = await db.from('Playlist').select('id, youtubeId, userId').eq('id', playlistId).eq('userId', user.id).single()
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })

    const result = await syncPlaylist(playlist)
    return NextResponse.json({ success: true, mode: 'manual', ...result })
  } catch (error) {
    console.error('Error syncing playlists:', error)
    return NextResponse.json({ error: 'Failed to sync playlists' }, { status: 500 })
  }
}
