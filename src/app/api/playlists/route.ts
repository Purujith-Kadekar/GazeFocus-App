import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface YouTubePlaylistDetails {
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
}

interface YouTubeVideoDetails {
  title: string;
  description: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  duration: number;
}

async function fetchYouTubePlaylistDetails(playlistId: string): Promise<YouTubePlaylistDetails | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set. Playlist details cannot be fetched.');
    return null;
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`
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
      }[];
      error?: any;
    };

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
      }
    }
  } catch (error) {
    console.error('Error fetching YouTube playlist details:', error)
  }
  return null
}

async function fetchYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set. Video details cannot be fetched.');
    return null;
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
    };

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

interface PlaylistVideo {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  duration: number
  position: number
}

async function fetchAllPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY not set, cannot fetch playlist videos')
    return []
  }

  console.log('[fetchAllPlaylistVideos] Starting for playlist:', playlistId)
  
  const videoIds: string[] = []
  const positionMap: Record<string, number> = {}

  let nextPageToken: string | undefined = undefined

  do {
    try {
      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
      url.searchParams.set('part', 'snippet,contentDetails')
      url.searchParams.set('playlistId', playlistId)
      url.searchParams.set('maxResults', '50')
      if (YOUTUBE_API_KEY) {
        url.searchParams.set('key', YOUTUBE_API_KEY)
      }
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken)
      }

      const response = await fetch(url.toString())
      const data = await response.json() as {
        items?: {
          snippet: {
            title: string;
            description: string;
            thumbnails: {
              maxres?: { url: string };
              medium?: { url: string };
            };
            position: number;
            resourceId: {
              videoId: string;
            };
          };
          contentDetails: {
            videoId: string;
            videoPublishedAt: string;
          } | null;
        }[];
        nextPageToken?: string;
        error?: any;
      }

      if (data.error) {
        console.error('[fetchAllPlaylistVideos] YouTube API error:', data.error)
        break
      }
      
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
    } catch (error) {
      console.error('[fetchAllPlaylistVideos] Error fetching playlist videos:', error)
      break
    }
  } while (nextPageToken)

  console.log('[fetchAllPlaylistVideos] Total video IDs found:', videoIds.length)

  const videos: PlaylistVideo[] = []
  const batchSize = 50

  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batchIds = videoIds.slice(i, i + batchSize)
    
    try {
      const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${batchIds.join(',')}&key=${YOUTUBE_API_KEY}`
      
      const response = await fetch(url)
      const data = await response.json() as {
        items?: {
          id: string;
          snippet: {
            title: string;
            description: string;
            thumbnails: {
              maxres?: { url: string };
              medium?: { url: string };
            };
          };
          contentDetails: {
            duration: string;
          };
        }[];
        error?: any;
      }

      if (data.error) {
        console.error('YouTube API error fetching video details:', data.error)
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
              position: positionMap[item.id] || 0,
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching video details batch:', error)
    }
  }

  return videos.sort((a, b) => a.position - b.position)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const playlistsResult = await db.from('Playlist').select('*').eq('userId', userId).order('createdAt', { ascending: false })
    const playlists = playlistsResult.data || []

    const libraryItemsResult = await db.from('LibraryItem').select('externalId, folderId').eq('userId', userId).eq('type', 'PLAYLIST').in('externalId', playlists.map(p => p.id))
    const libraryItems = libraryItemsResult.data || []

    const folderMap = new Map(libraryItems.map((item: any) => [item.externalId, item.folderId]))

    const playlistsWithFolder = playlists.map(p => ({
      ...p,
      folderId: folderMap.get(p.id) || null,
    }))

    return NextResponse.json(playlistsWithFolder)
  } catch (error) {
    console.error('Error fetching playlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    )
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
    const { youtubeId, type, folderId, title, description, thumbnail, channelId, channelName } = body

    if (!youtubeId) {
      return NextResponse.json(
        { error: 'YouTube ID is required' },
        { status: 400 }
      )
    }

    if (type === 'playlist') {
      const existingResult = await db.from('Playlist').select('id').eq('youtubeId', youtubeId).eq('userId', userId).maybeSingle()
      if (existingResult.data) {
        return NextResponse.json(
          { error: 'This playlist already exists in your library' },
          { status: 400 }
        )
      }
    } else {
      const existingResult = await db.from('Video').select('id').eq('youtubeId', youtubeId).eq('userId', userId).maybeSingle()
      if (existingResult.data) {
        return NextResponse.json(
          { error: 'This video already exists in your library' },
          { status: 400 }
        )
      }
    }

    let playlistData: YouTubePlaylistDetails | null = null;
    let videoData: YouTubeVideoDetails | null = null;
    let playlistVideos: any[] = [];

    if (type === 'playlist') {
      console.log('[POST /api/playlists] Fetching playlist details for:', youtubeId)
      playlistData = YOUTUBE_API_KEY ? await fetchYouTubePlaylistDetails(youtubeId) : null;
      if (YOUTUBE_API_KEY && playlistData) {
        playlistVideos = await fetchAllPlaylistVideos(youtubeId);
      }
    } else {
      videoData = YOUTUBE_API_KEY ? await fetchYouTubeVideoDetails(youtubeId) : null;
    }
    
    const finalTitle = title || (playlistData?.title ?? videoData?.title ?? '') || `YouTube ${type}`
    const finalDescription = description || (playlistData?.description ?? videoData?.description ?? '') || ''
    const finalThumbnail = thumbnail || (playlistData?.thumbnail ?? videoData?.thumbnail ?? '') || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    const finalChannelId = channelId || (playlistData?.channelId ?? videoData?.channelId ?? '') || ''
    const finalChannelName = channelName || (playlistData?.channelName ?? videoData?.channelName ?? '') || 'Unknown Channel'
    const finalDuration = videoData?.duration ?? 0

    if (type === 'playlist') {
      const playlistResult = await db.from('Playlist').insert({
        youtubeId,
        title: finalTitle,
        description: finalDescription,
        thumbnail: finalThumbnail,
        channelId: finalChannelId,
        channelName: finalChannelName,
        userId,
        totalDuration: 0,
      }).select().single()

      const playlist = playlistResult.data

      await db.from('LibraryItem').insert({
        userId,
        externalId: playlist!.id,
        type: 'PLAYLIST',
        title: finalTitle,
        folderId: folderId || null,
      })

      if (playlistVideos.length > 0) {
        const totalDuration = playlistVideos.reduce((sum, v) => sum + (v.duration || 0), 0)
        
        for (const video of playlistVideos) {
          await db.from('Video').upsert({
            youtubeId: video.youtubeId,
            title: video.title,
            description: video.description || '',
            thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
            duration: video.duration || 0,
            playlistId: playlist!.id,
            userId,
            position: video.position || 0,
          }, { onConflict: 'youtubeId,userId' })
        }
        
        await db.from('Playlist').update({ totalDuration }).eq('id', playlist!.id)

        const videoCountResult = await db.from('Video').select('id', { count: 'exact', head: true }).eq('playlistId', playlist!.id).eq('userId', userId)
        const videoCount = videoCountResult.count || 0

        return NextResponse.json({ 
          ...playlist, 
          videosCreated: playlistVideos.length,
          videoCount,
        }, { status: 201 })
      }

      return NextResponse.json({ 
        ...playlist, 
        videosCreated: 0,
        videoCount: 0,
      }, { status: 201 })
    }

    const videoResult = await db.from('Video').insert({
      youtubeId,
      title: finalTitle,
      description: finalDescription,
      thumbnail: finalThumbnail,
      duration: finalDuration,
      playlistId: null,
      userId,
      position: 0,
    }).select().single()

    const video = videoResult.data

    const existingItemResult = await db.from('LibraryItem').select('id').eq('userId', userId).eq('type', 'VIDEO').eq('externalId', youtubeId).maybeSingle()
    if (existingItemResult.data) {
      await db.from('LibraryItem').update({ title: finalTitle, folderId: folderId || null }).eq('id', existingItemResult.data.id)
    } else {
      await db.from('LibraryItem').insert({
        userId,
        externalId: youtubeId,
        type: 'VIDEO',
        title: finalTitle,
        folderId: folderId || null,
      })
    }

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Error creating playlist or video:', error)
    return NextResponse.json(
      { error: 'Failed to create playlist or video' },
      { status: 500 }
    )
  }
}
