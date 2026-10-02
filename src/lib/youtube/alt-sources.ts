/**
 * Alternative YouTube data sources — Invidious and Piped APIs.
 * These are free, open-source YouTube frontends with public APIs
 * that don't require API keys or consume YouTube Data API quota.
 *
 * Strategy:
 *   1. Try Invidious (100 videos/page, good metadata)
 *   2. Try Piped (all videos in one call, good metadata)
 *   3. Fall back to YouTube Data API v3 (quota-burn, but reliable)
 */

import { normalizeVideoThumbnail, repairThumbnailUrl } from '@/lib/youtube/thumbnails'

// --- Invidious ---
// Community-run instances. Health varies; try multiple with failover.
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://iv.ggtyler.dev',
  'https://invidious.privacyredirect.com',
  'https://yt.cdaut.de',
  'https://vid.puffyan.us',
]

// --- Piped ---
// Another open-source frontend. Returns all videos in one call.
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.r4fo.com',
  'https://pipedapi.adminforge.de',
  'https://pipedapi-libre.kavin.rocks',
]

export interface AltVideo {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  duration: number // seconds
  position: number
  author?: string
}

export interface AltPlaylistVideo extends AltVideo {
  author: string
}

/** Invidious/Piped thumbnail entry — both APIs use the same shape. */
interface AltThumbnail {
  quality: string
  url: string
}

/** Invidious playlist page (one page of a paginated playlist). */
interface InvidiousPlaylistPage {
  title?: string
  description?: string
  thumbnail?: string
  videoCount?: number
  author?: string
  videos?: Array<{
    videoId?: string
    title?: string
    description?: string
    videoThumbnails?: AltThumbnail[]
    lengthSeconds?: number
    author?: string
  }>
}

/** Piped playlist (all videos in one response). */
interface PipedPlaylist {
  name?: string
  thumbnail?: string
  videoCount?: number
  uploader?: string
  relatedStreams?: Array<{
    url?: string
    title?: string
    thumbnail?: string
    duration?: number
    uploaderName?: string
  }>
}

/** Invidious single-video details. */
interface InvidiousVideoDetails {
  videoId?: string
  title?: string
  description?: string
  videoThumbnails?: AltThumbnail[]
  lengthSeconds?: number
  author?: string
}

/** Piped single-video details. */
interface PipedVideoDetails {
  title?: string
  description?: string
  thumbnail?: string
  duration?: number
  uploader?: string
}

/** Invidious search result item (type discriminates video/playlist/channel). */
interface InvidiousSearchItem {
  type?: string
  videoId?: string
  playlistId?: string
  authorId?: string
  author?: string
  title?: string
  description?: string
  published?: number
  lengthSeconds?: number
  videoCount?: number
  subCount?: number
  playlistThumbnail?: string
  videoThumbnails?: AltThumbnail[]
  authorThumbnails?: AltThumbnail[]
}

export interface AltPlaylistInfo {
  title: string
  description: string
  thumbnail: string
  videoCount: number
  author: string
}

const REQUEST_TIMEOUT_MS = 8000

/**
 * Fetch a full playlist from Invidious API.
 * Returns all videos across pages (100 per page).
 */
export async function fetchPlaylistFromInvidious(
  playlistId: string
): Promise<{ info: AltPlaylistInfo; videos: AltPlaylistVideo[] } | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const allVideos: AltPlaylistVideo[] = []
      let page = 1
      let playlistTitle = ''
      let playlistDescription = ''
      let playlistThumbnail = ''
      let playlistVideoCount = 0
      let playlistAuthor = ''

      while (true) {
        const res = await fetch(
          `${instance}/api/v1/playlists/${playlistId}?page=${page}`,
          { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
        )

        if (!res.ok) {
          // Instance might not have this playlist or is broken; try next instance
          break
        }

        const data = (await res.json()) as InvidiousPlaylistPage

        if (page === 1) {
          playlistTitle = data.title || ''
          playlistDescription = data.description || ''
          playlistThumbnail = data.thumbnail || ''
          playlistVideoCount = data.videoCount || 0
          playlistAuthor = data.author || ''
        }

        const videos = data.videos || []
        if (videos.length === 0) break

        for (const v of videos) {
          allVideos.push({
            youtubeId: v.videoId || '',
            title: v.title || 'Unknown',
            description: v.description || '',
            // Instances send relative / instance-hosted thumbnail URLs that the
            // image optimizer rejects (400) — derive a loadable one from the id.
            thumbnail: normalizeVideoThumbnail(
              v.videoThumbnails?.find((t: AltThumbnail) => t.quality === 'maxres')?.url ||
                v.videoThumbnails?.find((t: AltThumbnail) => t.quality === 'medium')?.url,
              v.videoId
            ),
            duration: v.lengthSeconds || 0,
            position: (page - 1) * 100 + allVideos.length,
            author: v.author || '',
          })
        }

        // Invidious returns 100 per page; if fewer, we're done
        if (videos.length < 100) break
        page++
      }

      if (allVideos.length === 0) continue // try next instance

      return {
        info: {
          title: playlistTitle,
          description: playlistDescription,
          thumbnail: normalizeVideoThumbnail(playlistThumbnail, allVideos[0]?.youtubeId),
          videoCount: playlistVideoCount,
          author: playlistAuthor,
        },
        videos: allVideos,
      }
    } catch {
      continue // instance down, try next
    }
  }
  return null // all instances failed
}

/**
 * Fetch a full playlist from Piped API.
 * Returns all videos in a single call (no pagination needed).
 */
export async function fetchPlaylistFromPiped(
  playlistId: string
): Promise<{ info: AltPlaylistInfo; videos: AltPlaylistVideo[] } | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(
        `${instance}/playlists/${playlistId}`,
        { signal: AbortSignal.timeout(15000) }
      )

      if (!res.ok) continue

      const data = (await res.json()) as PipedPlaylist

      const relatedStreams = data.relatedStreams || []
      if (relatedStreams.length === 0) continue

      const videos: AltPlaylistVideo[] = relatedStreams.map(
        (v: NonNullable<PipedPlaylist['relatedStreams']>[number], index: number) => ({
          youtubeId: (v.url || '').replace('/watch?v=', ''),
          title: v.title || 'Unknown',
          description: '',
          thumbnail: normalizeVideoThumbnail(
            v.thumbnail,
            (v.url || '').replace('/watch?v=', '')
          ),
          duration: v.duration || 0,
          position: index,
          author: v.uploaderName || '',
        })
      )

      // Filter out videos without valid IDs
      const validVideos = videos.filter((v) => v.youtubeId && v.youtubeId.length > 0)

      if (validVideos.length === 0) continue

      return {
        info: {
          title: data.name || '',
          description: '',
          thumbnail: normalizeVideoThumbnail(data.thumbnail, validVideos[0]?.youtubeId),
          videoCount: data.videoCount || validVideos.length,
          author: data.uploader || '',
        },
        videos: validVideos,
      }
    } catch {
      continue
    }
  }
  return null
}

/**
 * Fetch a single video's metadata from Invidious.
 * Used for standalone video imports (not playlists).
 */
export async function fetchVideoFromInvidious(
  videoId: string
): Promise<AltPlaylistVideo | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(
        `${instance}/api/v1/videos/${videoId}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      )

      if (!res.ok) continue

      const data = (await res.json()) as InvidiousVideoDetails

      return {
        youtubeId: data.videoId || videoId,
        title: data.title || 'Unknown',
        description: data.description || '',
        thumbnail: normalizeVideoThumbnail(
          data.videoThumbnails?.find((t: AltThumbnail) => t.quality === 'maxres')?.url ||
            data.videoThumbnails?.find((t: AltThumbnail) => t.quality === 'medium')?.url,
          videoId
        ),
        duration: data.lengthSeconds || 0,
        position: 0,
        author: data.author || '',
      }
    } catch {
      continue
    }
  }
  return null
}

/**
 * Fetch a single video's metadata from Piped.
 */
export async function fetchVideoFromPiped(
  videoId: string
): Promise<AltPlaylistVideo | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(
        `${instance}/streams/${videoId}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      )

      if (!res.ok) continue

      const data = (await res.json()) as PipedVideoDetails

      return {
        youtubeId: videoId,
        title: data.title || 'Unknown',
        description: data.description || '',
        thumbnail: normalizeVideoThumbnail(data.thumbnail, videoId),
        duration: data.duration || 0,
        position: 0,
        author: data.uploader || '',
      }
    } catch {
      continue
    }
  }
  return null
}

/**
 * Search YouTube via Invidious API (free, no quota).
 *
 * Invidious supports: GET /api/v1/search?q={query}&type={type}
 * where type can be 'video', 'playlist', or 'channel'.
 * It does NOT support combined search, so for 'all' we run
 * three separate requests and merge the results.
 *
 * Returns results in the same YouTubeSearchResult format used by
 * the YouTube Data API search endpoint, or null if all instances fail.
 */
export async function searchFromInvidious(
  query: string,
  type: 'video' | 'playlist' | 'channel' | 'all' = 'all'
): Promise<Array<{
  id: string
  type: 'video' | 'playlist' | 'channel'
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  channelId: string
  publishedAt: string
  duration?: string
  videoCount?: number
  subscriberCount?: string
}> | null> {
  const typesToSearch: Array<'video' | 'playlist' | 'channel'> =
    type === 'all' ? ['video', 'playlist', 'channel'] : [type]

  // Helper: search a single type on a single instance
  async function searchTypeOnInstance(
    instance: string,
    searchType: 'video' | 'playlist' | 'channel'
  ): Promise<Array<{
    id: string
    type: 'video' | 'playlist' | 'channel'
    title: string
    description: string
    thumbnail: string
    channelTitle: string
    channelId: string
    publishedAt: string
    duration?: string
    videoCount?: number
    subscriberCount?: string
  }>> {
    try {
      const res = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=${searchType}&sort_by=relevance`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      )

      if (!res.ok) return []

      const data = (await res.json()) as InvidiousSearchItem[]
      if (!Array.isArray(data)) return []

      const results: Array<{
        id: string
        type: 'video' | 'playlist' | 'channel'
        title: string
        description: string
        thumbnail: string
        channelTitle: string
        channelId: string
        publishedAt: string
        duration?: string
        videoCount?: number
        subscriberCount?: string
      }> = []

      for (const item of data) {
        if (item.type === 'video') {
          results.push({
            id: item.videoId || '',
            type: 'video',
            title: item.title || '',
            description: item.description || '',
            thumbnail: normalizeVideoThumbnail(
              item.videoThumbnails?.find((t: AltThumbnail) => t.quality === 'maxres')?.url ||
                item.videoThumbnails?.find((t: AltThumbnail) => t.quality === 'medium')?.url,
              item.videoId
            ),
            channelTitle: item.author || '',
            channelId: item.authorId || '',
            publishedAt: item.published ? new Date(item.published * 1000).toISOString() : '',
            duration: item.lengthSeconds ? String(item.lengthSeconds) : undefined,
          })
        } else if (item.type === 'playlist') {
          results.push({
            id: item.playlistId || '',
            type: 'playlist',
            title: item.title || '',
            description: item.description || '',
            thumbnail: repairThumbnailUrl(item.playlistThumbnail),
            channelTitle: item.author || '',
            channelId: item.authorId || '',
            publishedAt: item.published ? new Date(item.published * 1000).toISOString() : '',
            videoCount: item.videoCount || undefined,
          })
        } else if (item.type === 'channel') {
          results.push({
            id: item.authorId || '',
            type: 'channel',
            title: item.author || '',
            description: item.description || '',
            thumbnail: repairThumbnailUrl(
              item.authorThumbnails?.find((t: AltThumbnail) => t.quality === 'maxres')?.url ||
                item.authorThumbnails?.find((t: AltThumbnail) => t.quality === 'high')?.url ||
                item.authorThumbnails?.find((t: AltThumbnail) => t.quality === 'medium')?.url
            ),
            channelTitle: item.author || '',
            channelId: item.authorId || '',
            publishedAt: '',
            subscriberCount: item.subCount ? String(item.subCount) : undefined,
          })
        }
      }
      return results
    } catch {
      return []
    }
  }

  // Try each instance with PARALLEL type searches for better performance
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      // Run all type searches in parallel (instead of sequential)
      const typeResults = await Promise.allSettled(
        typesToSearch.map((searchType) => searchTypeOnInstance(instance, searchType))
      )

      const allResults: Array<{
        id: string
        type: 'video' | 'playlist' | 'channel'
        title: string
        description: string
        thumbnail: string
        channelTitle: string
        channelId: string
        publishedAt: string
        duration?: string
        videoCount?: number
        subscriberCount?: string
      }> = []

      for (const result of typeResults) {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allResults.push(...result.value)
        }
      }

      // Only return if we got results for ALL requested types (or at least some)
      if (allResults.length > 0) {
        return allResults
      }
    } catch {
      continue // instance down, try next
    }
  }
  return null // all instances failed
}

/**
 * Primary playlist fetch strategy:
 *   1. Invidious (free, all videos)
 *   2. Piped (free, all videos)
 *   3. YouTube Data API (quota-burn, fallback)
 *
 * Returns the playlist info + videos, or null if all sources fail.
 */
export async function fetchPlaylistWithFallback(
  playlistId: string,
  youtubeApiFetcher?: (id: string) => Promise<AltVideo[]>
): Promise<{ info: AltPlaylistInfo | null; videos: AltVideo[]; source: string } | null> {
  // Try Invidious first
  const invidiousResult = await fetchPlaylistFromInvidious(playlistId)
  if (invidiousResult) {
    return {
      info: invidiousResult.info,
      videos: invidiousResult.videos,
      source: 'invidious',
    }
  }

  // Try Piped
  const pipedResult = await fetchPlaylistFromPiped(playlistId)
  if (pipedResult) {
    return {
      info: pipedResult.info,
      videos: pipedResult.videos,
      source: 'piped',
    }
  }

  // Fall back to YouTube API
  if (youtubeApiFetcher) {
    const apiVideos = await youtubeApiFetcher(playlistId)
    if (apiVideos && apiVideos.length > 0) {
      return {
        info: null, // API fetcher returns raw video list; caller gets info separately
        videos: apiVideos,
        source: 'youtube-api',
      }
    }
  }

  return null // all sources failed
}

/**
 * Primary video fetch strategy (for standalone video imports):
 *   1. Invidious (free)
 *   2. Piped (free)
 *   3. YouTube Data API (quota-burn)
 */
export async function fetchVideoWithFallback(
  videoId: string,
  youtubeApiFetcher?: (id: string) => Promise<Partial<AltVideo> | null>
): Promise<Partial<AltVideo> | null> {
  const invidious = await fetchVideoFromInvidious(videoId)
  if (invidious) return invidious

  const piped = await fetchVideoFromPiped(videoId)
  if (piped) return piped

  if (youtubeApiFetcher) {
    return youtubeApiFetcher(videoId)
  }

  return null
}
