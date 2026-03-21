import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface YouTubePlaylistDetails {
  title: string; description: string; thumbnail: string; channelId: string; channelName: string;
}
interface YouTubeVideoDetails {
  title: string; description: string; thumbnail: string; channelId: string; channelName: string; duration: number;
}

async function fetchYouTubePlaylistDetails(playlistId: string): Promise<YouTubePlaylistDetails | null> {
  if (!YOUTUBE_API_KEY) return null
  try {
    const response = await fetch(`${YOUTUBE_API_BASE}/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`)
    const data = await response.json() as any
    if (data.error || !data.items?.length) return null
    const playlist = data.items[0]
    return {
      title: playlist.snippet.title, description: playlist.snippet.description,
      thumbnail: playlist.snippet.thumbnails.maxres?.url || playlist.snippet.thumbnails.medium?.url || '',
      channelId: playlist.snippet.channelId, channelName: playlist.snippet.channelTitle,
    }
  } catch { return null }
}

async function fetchYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
  if (!YOUTUBE_API_KEY) return null
  try {
    const response = await fetch(`${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`)
    const data = await response.json() as any
    if (data.error || !data.items?.length) return null
    const video = data.items[0]
    return {
      title: video.snippet.title, description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.medium?.url || '',
      channelId: video.snippet.channelId, channelName: video.snippet.channelTitle,
      duration: parseDuration(video.contentDetails.duration),
    }
  } catch { return null }
}

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0
  return parseInt(match[1] || '0') * 3600 + parseInt(match[2] || '0') * 60 + parseInt(match[3] || '0')
}

interface PlaylistVideo {
  youtubeId: string; title: string; description: string; thumbnail: string; duration: number; position: number;
}

async function fetchAllPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
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
      url.searchParams.set('key', YOUTUBE_API_KEY)
      if (nextPageToken) url.searchParams.set('pageToken', nextPageToken)

      const response = await fetch(url.toString())
      const data = await response.json() as any
      if (data.error) break

      if (data.items) {
        for (const item of data.items) {
          const videoId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId
          if (videoId && item.snippet) {
            videoIds.push(videoId)
            positionMap[videoId] = item.snippet.position || 0
          }
        }
      }
      nextPageToken = data.nextPageToken
    } catch { break }
  } while (nextPageToken)

  const videos: PlaylistVideo[] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50)
    try {
      const response = await fetch(`${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${batchIds.join(',')}&key=${YOUTUBE_API_KEY}`)
      const data = await response.json() as any
      if (data.error) continue
      if (data.items) {
        for (const item of data.items) {
          if (item.id && item.snippet) {
            videos.push({
              youtubeId: item.id, title: item.snippet.title || 'Untitled',
              description: item.snippet.description || '',
              thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.medium?.url || '',
              duration: item.contentDetails?.duration ? parseDuration(item.contentDetails.duration) : 0,
              position: positionMap[item.id] || 0,
            })
          }
        }
      }
    } catch { continue }
  }
  return videos.sort((a, b) => a.position - b.position)
}

// GET /api/playlists - Get all playlists for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id

    const { data: playlists, error } = await db.from('Playlist').select('*').eq('userId', userId).order('createdAt', { ascending: false })
    if (error) throw error

    // Get folder associations from libraryItems
    const playlistIds = (playlists || []).map((p: any) => p.id)
    let folderMap = new Map<string, string | null>()
    if (playlistIds.length > 0) {
      const { data: libraryItems } = await db.from('LibraryItem').select('externalId, folderId').eq('userId', userId).eq('type', 'PLAYLIST').in('externalId', playlistIds)
      if (libraryItems) {
        folderMap = new Map(libraryItems.map((item: any) => [item.externalId, item.folderId]))
      }
    }

    const playlistsWithFolder = (playlists || []).map((p: any) => ({
      ...p, folderId: folderMap.get(p.id) || null,
    }))

    return NextResponse.json(playlistsWithFolder)
  } catch (error) {
    console.error('Error fetching playlists:', error)
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 })
  }
}

// POST /api/playlists - Add a new playlist or video
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id
    const body = await request.json()
    const { youtubeId, type, folderId, title, description, thumbnail, channelId, channelName } = body

    if (!youtubeId) return NextResponse.json({ error: 'YouTube ID is required' }, { status: 400 })

    // Check if already exists
    if (type === 'playlist') {
      const { data: existing } = await db.from('Playlist').select('id').eq('youtubeId', youtubeId).eq('userId', userId).maybeSingle()
      if (existing) return NextResponse.json({ error: 'This playlist already exists in your library' }, { status: 400 })
    } else {
      const { data: existing } = await db.from('Video').select('id').eq('youtubeId', youtubeId).eq('userId', userId).maybeSingle()
      if (existing) return NextResponse.json({ error: 'This video already exists in your library' }, { status: 400 })
    }

    let playlistData: YouTubePlaylistDetails | null = null
    let videoData: YouTubeVideoDetails | null = null
    let playlistVideos: PlaylistVideo[] = []

    if (type === 'playlist') {
      playlistData = YOUTUBE_API_KEY ? await fetchYouTubePlaylistDetails(youtubeId) : null
      if (YOUTUBE_API_KEY && playlistData) playlistVideos = await fetchAllPlaylistVideos(youtubeId)
    } else {
      videoData = YOUTUBE_API_KEY ? await fetchYouTubeVideoDetails(youtubeId) : null
    }

    const finalTitle = title || (playlistData?.title ?? videoData?.title ?? '') || `YouTube ${type}`
    const finalDescription = description || (playlistData?.description ?? videoData?.description ?? '') || ''
    const finalThumbnail = thumbnail || (playlistData?.thumbnail ?? videoData?.thumbnail ?? '') || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    const finalChannelId = channelId || (playlistData?.channelId ?? videoData?.channelId ?? '') || ''
    const finalChannelName = channelName || (playlistData?.channelName ?? videoData?.channelName ?? '') || 'Unknown Channel'
    const finalDuration = videoData?.duration ?? 0

    if (type === 'playlist') {
      const { data: playlist, error } = await db.from('Playlist').insert({
        youtubeId, title: finalTitle, description: finalDescription, thumbnail: finalThumbnail,
        channelId: finalChannelId, channelName: finalChannelName, userId, totalDuration: 0,
      }).select().single()
      if (error) throw error

      await db.from('LibraryItem').insert({
        userId, externalId: playlist.id, type: 'PLAYLIST', title: finalTitle, folderId: folderId || null,
      })

      if (playlistVideos.length > 0) {
        const totalDuration = playlistVideos.reduce((sum, v) => sum + (v.duration || 0), 0)

        await db.from('Video').insert(playlistVideos.map(video => ({
          youtubeId: video.youtubeId, title: video.title, description: video.description || '',
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
          duration: video.duration || 0, playlistId: playlist.id, userId, position: video.position || 0,
        })))

        await db.from('Playlist').update({ totalDuration }).eq('id', playlist.id)

        const { count: videoCount } = await db.from('Video').select('*', { count: 'exact', head: true }).eq('playlistId', playlist.id).eq('userId', userId)

        return NextResponse.json({ ...playlist, videosCreated: playlistVideos.length, videoCount: videoCount || 0 }, { status: 201 })
      }

      return NextResponse.json({ ...playlist, videosCreated: 0, videoCount: 0 }, { status: 201 })
    }

    // For individual videos
    const { data: video, error } = await db.from('Video').insert({
      youtubeId, title: finalTitle, description: finalDescription, thumbnail: finalThumbnail,
      duration: finalDuration, playlistId: null, userId, position: 0,
    }).select().single()
    if (error) throw error

    await db.from('LibraryItem').upsert({
      userId, type: 'VIDEO', externalId: youtubeId, title: finalTitle, folderId: folderId || null,
    }, { onConflict: 'userId,type,externalId' })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Error creating playlist or video:', error)
    return NextResponse.json({ error: 'Failed to create playlist or video' }, { status: 500 })
  }
}