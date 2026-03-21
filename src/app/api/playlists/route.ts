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

  // First, fetch all video IDs from the playlist
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
          // Use resourceId.videoId (this is the correct path for playlistItems)
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

  // Fetch video details in batches to get durations (YouTube API allows max 50 video IDs per request)
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

  // Sort by position (oldest first - position 0 is the first/oldest video)
  return videos.sort((a, b) => a.position - b.position)
}

// GET /api/playlists - Get all playlists for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const playlists = await db.playlist.findMany({
      where: {
        userId,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get folder associations from libraryItems
    const libraryItems = await db.libraryItem.findMany({
      where: {
        userId,
        type: 'PLAYLIST',
        externalId: { in: playlists.map(p => p.id) },
      },
      select: { externalId: true, folderId: true },
    })

    const folderMap = new Map(libraryItems.map(item => [item.externalId, item.folderId]))

    // Map to include folderId from libraryItems
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

// POST /api/playlists - Add a new playlist or video
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

    // Check if already exists for this user (check correct table based on type)
    if (type === 'playlist') {
      const existing = await db.playlist.findFirst({
        where: { youtubeId, userId },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'This playlist already exists in your library' },
          { status: 400 }
        )
      }
    } else {
      const existing = await db.video.findFirst({
        where: { youtubeId, userId },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'This video already exists in your library' },
          { status: 400 }
        )
      }
    }

    let playlistData: YouTubePlaylistDetails | null = null;
    let videoData: YouTubeVideoDetails | null = null;
    let playlistVideos: any[] = []; // Declare playlistVideos here

    if (type === 'playlist') {
      console.log('[POST /api/playlists] Fetching playlist details for:', youtubeId)
      playlistData = YOUTUBE_API_KEY ? await fetchYouTubePlaylistDetails(youtubeId) : null;
      // Fetch videos from the playlist and create them only if API key is available and playlist data is fetched
      if (YOUTUBE_API_KEY && playlistData) {
        playlistVideos = await fetchAllPlaylistVideos(youtubeId);
      }
    } else {
      videoData = YOUTUBE_API_KEY ? await fetchYouTubeVideoDetails(youtubeId) : null;
    }
    
    // Use fetched data or fall back to provided/manual data
    const finalTitle = title || (playlistData?.title ?? videoData?.title ?? '') || `YouTube ${type}`
    const finalDescription = description || (playlistData?.description ?? videoData?.description ?? '') || ''
    const finalThumbnail = thumbnail || (playlistData?.thumbnail ?? videoData?.thumbnail ?? '') || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    const finalChannelId = channelId || (playlistData?.channelId ?? videoData?.channelId ?? '') || ''
    const finalChannelName = channelName || (playlistData?.channelName ?? videoData?.channelName ?? '') || 'Unknown Channel'
    const finalDuration = videoData?.duration ?? 0 // Only applies to individual videos

    // Only create a Playlist for actual playlists, not for individual videos
    if (type === 'playlist') {
      const playlist = await db.playlist.create({
        data: {
          youtubeId,
          title: finalTitle,
          description: finalDescription,
          thumbnail: finalThumbnail,
          channelId: finalChannelId,
          channelName: finalChannelName,
          userId,
          totalDuration: 0,
        },
      })

      // Create libraryItem entry
      await db.libraryItem.create({
        data: {
          userId,
          externalId: playlist.id,
          type: 'PLAYLIST',
          title: finalTitle,
          folderId: folderId || null,
        },
      })

      if (playlistVideos.length > 0) {
        const totalDuration = playlistVideos.reduce((sum, v) => sum + (v.duration || 0), 0)
        
        await db.video.createMany({
          data: playlistVideos.map(video => ({
            youtubeId: video.youtubeId,
            title: video.title,
            description: video.description || '',
            thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
            duration: video.duration || 0,
            playlistId: playlist.id,
            userId,
            position: video.position || 0,
          })),
          skipDuplicates: true,
        })
        
        // Update playlist with total duration
        await db.playlist.update({
          where: { id: playlist.id },
          data: { totalDuration },
        })

        const videoCount = await db.video.count({
          where: { playlistId: playlist.id, userId },
        })

        return NextResponse.json({ 
          ...playlist, 
          videosCreated: playlistVideos.length,
          videoCount,
        }, { status: 201 })
      }

      // Return playlist even if no videos were created
      return NextResponse.json({ 
        ...playlist, 
        videosCreated: 0,
        videoCount: 0,
      }, { status: 201 })
    }

    // For individual videos, create only a Video entry (not linked to any playlist)
    const video = await db.video.create({
      data: {
        youtubeId,
        title: finalTitle, // Use finalTitle for individual videos as well
        description: finalDescription,
        thumbnail: finalThumbnail,
        duration: finalDuration, // Use finalDuration for individual videos
        playlistId: null,
        userId,
        position: 0,
      },
    })

    // Create libraryItem entry for video
    await db.libraryItem.upsert({
      where: {
        userId_type_externalId: {
          userId,
          type: 'VIDEO',
          externalId: youtubeId,
        },
      },
      update: {
        title: finalTitle,
        folderId: folderId || null,
      },
      create: {
        userId,
        externalId: youtubeId,
        type: 'VIDEO',
        title: finalTitle,
        folderId: folderId || null,
      },
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Error creating playlist or video:', error)
    return NextResponse.json(
      { error: 'Failed to create playlist or video' },
      { status: 500 }
    )
  }
}