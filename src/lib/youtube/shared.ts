/**
 * Shared YouTube utility functions.
 * Consolidated from duplicated code across multiple route files.
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

/**
 * Parse ISO 8601 duration string (PT1H30M15S) to seconds.
 * Robust version that strips unit suffixes before parsing.
 */
export function parseDuration(isoDuration: string): number {
  if (!isoDuration) return 0
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Fetch YouTube playlist details via the YouTube Data API.
 * Returns metadata (title, description, thumbnail, channel info, itemCount).
 */
export async function fetchYouTubePlaylistDetails(playlistId: string): Promise<{
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelName: string
  itemCount: number
} | null> {
  if (!YOUTUBE_API_KEY) return null

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()

    if (data.error) {
      console.error('YouTube API error fetching playlist details:', data.error)
      return null
    }

    if (data.items && data.items.length > 0) {
      const playlist = data.items[0]
      return {
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        thumbnail: playlist.snippet.thumbnails.maxres?.url || playlist.snippet.thumbnails.medium?.url || '',
        channelId: playlist.snippet.channelId,
        channelName: playlist.snippet.channelTitle,
        itemCount: playlist.contentDetails?.itemCount || 0,
      }
    }
  } catch (error) {
    console.error('Error fetching YouTube playlist details:', error)
  }
  return null
}

/**
 * Fetch YouTube video details via the YouTube Data API.
 * Returns metadata including duration.
 */
export async function fetchYouTubeVideoDetails(videoId: string): Promise<{
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelName: string
  duration: number
} | null> {
  if (!YOUTUBE_API_KEY) return null

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()

    if (data.error) {
      console.error('YouTube API error fetching video details:', data.error)
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

/**
 * Fetch ALL videos from a YouTube playlist using the YouTube Data API with pagination.
 * This is the quota-burning fallback — use only when Invidious/Piped fail.
 */
export async function fetchAllPlaylistVideosFromAPI(playlistId: string): Promise<{
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  duration: number
  position: number
}[]> {
  if (!YOUTUBE_API_KEY) return []

  const videoIds: string[] = []
  const positionMap: Record<string, number> = {}
  let nextPageToken: string | undefined = undefined

  do {
    try {
      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
      url.searchParams.set('part', 'snippet,contentDetails')
      url.searchParams.set('playlistId', playlistId)
      url.searchParams.set('maxResults', '50')
      url.searchParams.set('key', YOUTUBE_API_KEY!)
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.error) {
        console.error('YouTube API error fetching playlist items:', data.error)
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
    } catch (error) {
      console.error('[fetchAllPlaylistVideosFromAPI] Error:', error)
      break
    }
  } while (nextPageToken)

  if (videoIds.length === 0) return []

  const videos: {
    youtubeId: string
    title: string
    description: string
    thumbnail: string
    duration: number
    position: number
  }[] = []

  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50)

    try {
      const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${batchIds.join(',')}&key=${YOUTUBE_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        console.error('[fetchAllPlaylistVideosFromAPI] Error fetching details:', data.error)
        continue
      }

      if (data.items) {
        for (const item of data.items) {
          if (item.id && item.snippet) {
            videos.push({
              youtubeId: item.id,
              title: item.snippet.title || 'Untitled',
              description: item.snippet.description || '',
              thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.medium?.url || '',
              duration: item.contentDetails?.duration ? parseDuration(item.contentDetails.duration) : 0,
              position: positionMap[item.id] ?? 0,
            })
          }
        }
      }
    } catch (error) {
      console.error('[fetchAllPlaylistVideosFromAPI] Error fetching details:', error)
    }
  }

  videos.sort((a, b) => a.position - b.position)
  return videos
}

/**
 * Fetch playlist videos from RSS feed (free, no quota).
 * Returns at most 15 most recent videos.
 * Used for daily sync checks — NOT for full imports.
 */
export async function fetchPlaylistVideosFromRSS(playlistId: string): Promise<{
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  duration: number
  position: number
}[]> {
  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )

    if (!response.ok) return []

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
