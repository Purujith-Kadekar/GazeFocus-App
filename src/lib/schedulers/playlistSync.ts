import cron, { ScheduledTask } from 'node-cron'
import { db } from '@/lib/db'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

interface PlaylistVideo {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  duration: number
  position: number
}

async function fetchAllPlaylistVideos(playlistYoutubeId: string): Promise<PlaylistVideo[]> {
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
      console.error('[playlistSync] YouTube API error:', data.error.message)
      break
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
      console.error('[playlistSync] YouTube API error fetching details:', data.error.message)
      break
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

async function syncPlaylist(playlist: { id: string; youtubeId: string; userId: string }): Promise<{ added: number; total: number }> {
  try {
    const playlistVideos = await fetchAllPlaylistVideos(playlist.youtubeId)

    const existingVideos = await db.video.findMany({
      where: { userId: playlist.userId, playlistId: playlist.id },
      select: { youtubeId: true },
    })

    const existingVideoIds = new Set(existingVideos.map(video => video.youtubeId))
    const missingVideos = playlistVideos.filter(video => !existingVideoIds.has(video.youtubeId))

    if (missingVideos.length > 0) {
      await db.video.createMany({
        data: missingVideos.map(video => ({
          youtubeId: video.youtubeId,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          duration: video.duration,
          position: video.position,
          playlistId: playlist.id,
          userId: playlist.userId,
        })),
        skipDuplicates: true,
      })
    }

    const allPlaylistVideos = await db.video.findMany({
      where: { userId: playlist.userId, playlistId: playlist.id },
      select: { duration: true },
    })

    const totalDuration = allPlaylistVideos.reduce((sum, video) => sum + (video.duration || 0), 0)

    await db.playlist.update({
      where: { id: playlist.id },
      data: { totalDuration },
    })

    return {
      added: missingVideos.length,
      total: allPlaylistVideos.length,
    }
  } catch (error) {
    console.error('[playlistSync] Error syncing playlist:', playlist.youtubeId, error)
    return { added: 0, total: 0 }
  }
}

let syncTask: ScheduledTask | null = null

export function initializePlaylistSync() {
  if (syncTask) {
    console.log('[playlistSync] Scheduler already initialized')
    return
  }

  if (!YOUTUBE_API_KEY) {
    console.warn('[playlistSync] YouTube API key not configured, scheduler will not start')
    return
  }

  console.log('[playlistSync] Initializing playlist sync scheduler (every 30 minutes)')

  // Run every 30 minutes: */30 * * * *
  syncTask = cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('[playlistSync] Running scheduled sync...')
      const startTime = Date.now()

      const playlists = await db.playlist.findMany({
        select: { id: true, youtubeId: true, userId: true },
      })

      let totalSynced = 0
      let totalAdded = 0

      for (const playlist of playlists) {
        const result = await syncPlaylist(playlist)
        if (result.added > 0) {
          totalAdded += result.added
          totalSynced += 1
        }
      }

      const duration = (Date.now() - startTime) / 1000
      console.log(`[playlistSync] Completed in ${duration.toFixed(2)}s: synced ${totalSynced} playlists, added ${totalAdded} videos`)
    } catch (error) {
      console.error('[playlistSync] Scheduled sync failed:', error)
    }
  })

  // Also run immediately on startup (after a small delay to ensure DB is ready)
  setTimeout(async () => {
    try {
      console.log('[playlistSync] Running initial sync on startup...')
      const playlists = await db.playlist.findMany({
        select: { id: true, youtubeId: true, userId: true },
      })

      let totalAdded = 0
      for (const playlist of playlists) {
        const result = await syncPlaylist(playlist)
        totalAdded += result.added
      }

      if (totalAdded > 0) {
        console.log(`[playlistSync] Initial sync added ${totalAdded} videos`)
      }
    } catch (error) {
      console.error('[playlistSync] Initial sync failed:', error)
    }
  }, 2000)
}

export function stopPlaylistSync() {
  if (syncTask) {
    syncTask.stop()
    syncTask = null
    console.log('[playlistSync] Scheduler stopped')
  }
}
