import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import { QuotaEngine } from '@/lib/youtube/quota-engine'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface PlaylistVideo {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  duration: number
  position: number
}

interface SyncResult {
  playlistId: string
  youtubeId: string
  addedCount: number
  totalVideos: number
}

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}

async function fetchPlaylistVideosFromRSS(playlistYoutubeId: string): Promise<PlaylistVideo[]> {
  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistYoutubeId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!response.ok) {
      return []
    }

    const text = await response.text()
    const entries = text.split('<entry>').slice(1)

    return entries.map((entry, index) => {
      const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
      const titleMatch = entry.match(/<title>(.*?)<\/title>/)
      const descMatch = entry.match(/<media:description>(.*?)<\/media:description>/)
      const videoId = idMatch ? idMatch[1] : ''

      return {
        youtubeId: videoId,
        title: titleMatch ? titleMatch[1] : 'Unknown Title',
        description: descMatch ? descMatch[1] : '',
        thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '',
        duration: 0,
        position: index,
      }
    }).filter(v => v.youtubeId !== '')
  } catch {
    return []
  }
}

async function fetchAllPlaylistVideosFromAPI(playlistYoutubeId: string): Promise<PlaylistVideo[]> {
  if (!YOUTUBE_API_KEY) {
    return []
  }

  const videoIds: string[] = []
  const positionMap: Record<string, number> = {}
  let nextPageToken: string | undefined = undefined

  do {
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('playlistId', playlistYoutubeId)
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('key', YOUTUBE_API_KEY)

    if (nextPageToken) {
      url.searchParams.set('pageToken', nextPageToken)
    }

    const response = await fetch(url.toString())
    const data = await response.json() as {
      items?: {
        snippet?: {
          position?: number
          resourceId?: { videoId?: string }
        }
        contentDetails?: { videoId?: string }
      }[]
      nextPageToken?: string
      error?: { message?: string }
    }

    if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch playlist items from YouTube')
    }

    if (data.items) {
      for (const item of data.items) {
        const videoId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId
        if (videoId) {
          videoIds.push(videoId)
          positionMap[videoId] = item.snippet?.position ?? 0
        }
      }
    }

    nextPageToken = data.nextPageToken
  } while (nextPageToken)

  if (videoIds.length === 0) {
    return []
  }

  const videos: PlaylistVideo[] = []
  const batchSize = 50

  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batchIds = videoIds.slice(i, i + batchSize)
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${batchIds.join(',')}&key=${YOUTUBE_API_KEY}`
    )

    const data = await response.json() as {
      items?: {
        id: string
        snippet?: {
          title?: string
          description?: string
          thumbnails?: {
            maxres?: { url: string }
            medium?: { url: string }
          }
        }
        contentDetails?: {
          duration?: string
        }
      }[]
      error?: { message?: string }
    }

    if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch playlist video details from YouTube')
    }

    if (!data.items) {
      continue
    }

    for (const item of data.items) {
      if (!item.id || !item.snippet) {
        continue
      }

      videos.push({
        youtubeId: item.id,
        title: item.snippet.title || 'Untitled',
        description: item.snippet.description || '',
        thumbnail:
          item.snippet.thumbnails?.maxres?.url ||
          item.snippet.thumbnails?.medium?.url ||
          `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`,
        duration: item.contentDetails?.duration ? parseDuration(item.contentDetails.duration) : 0,
        position: positionMap[item.id] ?? 0,
      })
    }
  }

  return videos.sort((a, b) => a.position - b.position)
}

async function detectPotentialGap(playlistId: string, rssVideos: PlaylistVideo[]): Promise<boolean> {
  if (rssVideos.length === 0) return false
  if (rssVideos.length < 15) return false

  const { data: existing } = await db
    .from('Video')
    .select('youtubeId')
    .eq('playlistId', playlistId)
    .limit(1)

  return Boolean(existing && existing.length > 0)
}

async function fillGapWithAPI(playlistYoutubeId: string, existingVideoIds: Set<string>): Promise<PlaylistVideo[]> {
  const apiVideos = await fetchAllPlaylistVideosFromAPI(playlistYoutubeId)
  return apiVideos.filter(v => !existingVideoIds.has(v.youtubeId))
}

async function checkAndMarkLiveVideos(playlistId: string): Promise<void> {
  if (!YOUTUBE_API_KEY) return

  const { data: playlistVideos } = await db
    .from('Video')
    .select('youtubeId')
    .eq('playlistId', playlistId)
    .order('createdAt', { ascending: false })
    .limit(50)

  if (!playlistVideos || playlistVideos.length === 0) return

  const url = new URL(`${YOUTUBE_API_BASE}/search`)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('eventType', 'live')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '50')
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const response = await fetch(url.toString())
  const data = await response.json() as {
    items?: { id?: { videoId?: string }; snippet?: { liveBroadcastContent?: string } }[]
  }

  const liveIds = new Set(
    (data.items || [])
      .filter(item => item.id?.videoId && item.snippet?.liveBroadcastContent === 'live')
      .map(item => item.id!.videoId!)
  )

  const trackedIds = (playlistVideos as { youtubeId: string }[]).map(v => v.youtubeId)
  if (trackedIds.length === 0) return

  await db
    .from('Video')
    .update({ isLive: false, liveBroadcastContent: null })
    .eq('playlistId', playlistId)
    .in('youtubeId', trackedIds)

  const idsToMarkLive = trackedIds.filter(id => liveIds.has(id))
  if (idsToMarkLive.length > 0) {
    await db
      .from('Video')
      .update({ isLive: true, liveBroadcastContent: 'live' })
      .eq('playlistId', playlistId)
      .in('youtubeId', idsToMarkLive)
  }
}

async function fetchAllPlaylistVideosHybrid(playlistId: string, playlistYoutubeId: string, userId?: string): Promise<PlaylistVideo[]> {
  const rssVideos = await fetchPlaylistVideosFromRSS(playlistYoutubeId)
  if (rssVideos.length === 0) {
    return fetchAllPlaylistVideosFromAPI(playlistYoutubeId)
  }

  // Surgical Enrichment for RSS videos (1 unit for up to 50 videos)
  const videoIds = rssVideos.map(v => v.youtubeId)
  const enrichment = await QuotaEngine.enrichVideoMetadata(videoIds, userId)
  
  const enrichedRssVideos = rssVideos.map(v => ({
    ...v,
    duration: enrichment[v.youtubeId]?.duration ?? 0,
    description: enrichment[v.youtubeId]?.description ?? v.description,
    title: enrichment[v.youtubeId]?.title ?? v.title,
    thumbnail: enrichment[v.youtubeId]?.thumbnail ?? v.thumbnail,
  }))

  const hasGap = await detectPotentialGap(playlistId, rssVideos)
  if (!hasGap) {
    return enrichedRssVideos
  }

  const { data: existingVideos } = await db
    .from('Video')
    .select('youtubeId')
    .eq('playlistId', playlistId)

  const existingIds = new Set<string>((existingVideos || []).map((v: any) => v.youtubeId))
  const gapVideos = await fillGapWithAPI(playlistYoutubeId, existingIds)
  return [...enrichedRssVideos, ...gapVideos]
}

async function syncPlaylist(playlist: { id: string; youtubeId: string; userId: string }): Promise<SyncResult> {
  const playlistVideos = await fetchAllPlaylistVideosHybrid(playlist.id, playlist.youtubeId, playlist.userId)

  const existingVideosResult = await db.from('Video').select('youtubeId').eq('userId', playlist.userId).eq('playlistId', playlist.id)
  const existingVideos = existingVideosResult.data || []
  const existingVideoIds = new Set(existingVideos.map((video: any) => video.youtubeId))
  const missingVideos = playlistVideos.filter(video => !existingVideoIds.has(video.youtubeId))

  if (missingVideos.length > 0) {
    // Bulk upsert instead of loop
    const { error: upsertError } = await db.from('Video').upsert(
      missingVideos.map(video => ({
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        duration: video.duration,
        position: video.position,
        playlistId: playlist.id,
        userId: playlist.userId,
      })), { onConflict: 'youtubeId,userId' }
    )

    if (upsertError) {
      console.error('Error batch upserting videos:', upsertError)
    }
  }

  const allVideosResult = await db.from('Video').select('duration').eq('userId', playlist.userId).eq('playlistId', playlist.id)
  const allPlaylistVideos = allVideosResult.data || []
  const totalDuration = allPlaylistVideos.reduce((sum: number, video: any) => sum + (video.duration || 0), 0)

  await db.from('Playlist').update({ totalDuration }).eq('id', playlist.id)
  
  // We no longer need separate checkAndMarkLiveVideos because enrichment already provides liveBroadcastContent
  // But we need to apply it to the DB if we want to track it per video.
  // For now, let's keep it simple or just add isLive to the Video table.
  
  return {
    playlistId: playlist.id,
    youtubeId: playlist.youtubeId,
    addedCount: missingVideos.length,
    totalVideos: allPlaylistVideos.length,
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as { playlistId?: string; auto?: boolean }
    const playlistId = body.playlistId

    if (!playlistId) {
      const playlistsResult = await db
        .from('Playlist')
        .select('id, youtubeId, userId')
        .eq('userId', user.id)

      const playlists = playlistsResult.data || []
      let syncedPlaylists = 0
      let addedVideos = 0

      for (const playlist of playlists) {
        const result = await syncPlaylist(playlist)
        syncedPlaylists += 1
        addedVideos += result.addedCount
      }

      return NextResponse.json({
        success: true,
        mode: body.auto ? 'auto-open' : 'manual-all',
        syncedPlaylists,
        addedVideos,
      })
    }

    const playlistResult = await db.from('Playlist').select('id, youtubeId, userId').eq('id', playlistId).eq('userId', user.id).maybeSingle()
    const playlist = playlistResult.data

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    const result = await syncPlaylist(playlist)

    return NextResponse.json({
      success: true,
      mode: 'manual',
      ...result,
    })
  } catch (error) {
    console.error('Error syncing playlists:', error)
    return NextResponse.json(
      { error: 'Failed to sync playlists' },
      { status: 500 }
    )
  }
}
