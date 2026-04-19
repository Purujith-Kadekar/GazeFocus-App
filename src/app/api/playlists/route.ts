import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import { QuotaEngine } from '@/lib/youtube/quota-engine'

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

async function fetchPlaylistVideosFromRSS(playlistId: string): Promise<PlaylistVideo[]> {
  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`, {
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
  } catch (error) {
    return []
  }
}

async function fetchAllPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
  
  if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY not set - cannot fetch playlist videos')
    return []
  }
  
  const videos: PlaylistVideo[] = []
  const positionMap: Record<string, number> = {}
  let nextPageToken: string | undefined = undefined

  do {
    try {
      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
      url.searchParams.set('part', 'snippet,contentDetails')
      url.searchParams.set('playlistId', playlistId)
      url.searchParams.set('maxResults', '50')
      url.searchParams.set('key', YOUTUBE_API_KEY)
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken)
      }

      const response = await fetch(url.toString())
      const data = await response.json() as {
        items?: {
          snippet: {
            title: string;
            thumbnails: { maxres?: { url: string }; medium?: { url: string } };
            position: number;
            resourceId: { videoId: string };
          };
          contentDetails: { videoId: string };
        }[];
        nextPageToken?: string;
      }

      if (data.items) {
        for (const item of data.items) {
          const videoId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId
          const pos = item.snippet?.position ?? 0
          if (videoId) {
            positionMap[videoId] = pos
            }
        }
      }

      nextPageToken = data.nextPageToken
    } catch (error) {
      console.error('[fetchAllPlaylistVideos] Error:', error)
      break
    }
  } while (nextPageToken)

  const videoIds = Object.keys(positionMap)

  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50)
    
    try {
      const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${batchIds.join(',')}&key=${YOUTUBE_API_KEY}`
      const response = await fetch(url)
      const data = await response.json() as {
        items?: {
          id: string;
          snippet: { title: string; description: string; thumbnails: { maxres?: { url: string }; medium?: { url: string } } };
          contentDetails: { duration: string };
        }[];
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
      console.error('[fetchAllPlaylistVideos] Error fetching details:', error)
    }
  }

  videos.sort((a, b) => a.position - b.position)
  return videos
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const playlistsResult = await db
      .from('Playlist')
      .select('id,youtubeId,title,description,thumbnail,channelId,channelName,totalDuration,scheduledAt,createdAt,updatedAt,userId')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
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
      playlistData = YOUTUBE_API_KEY ? await fetchYouTubePlaylistDetails(youtubeId) : null;
      
      // Use Hybrid Logic: RSS discovery + Surgical Enrichment (saves quota)
      const rssVideos = await fetchPlaylistVideosFromRSS(youtubeId);
      if (rssVideos.length > 0) {
        const videoIds = rssVideos.map(v => v.youtubeId);
        const enrichment = await QuotaEngine.enrichVideoMetadata(videoIds, userId);
        playlistVideos = rssVideos.map(v => ({
          ...v,
          duration: enrichment[v.youtubeId]?.duration ?? 0,
          description: enrichment[v.youtubeId]?.description ?? v.description,
          title: enrichment[v.youtubeId]?.title ?? v.title,
          thumbnail: enrichment[v.youtubeId]?.thumbnail ?? v.thumbnail,
        }));
      } else {
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
      const now = new Date().toISOString()
      const playlistResult = await db.from('Playlist').insert({
        id: crypto.randomUUID(),
        youtubeId,
        title: finalTitle,
        description: finalDescription,
        thumbnail: finalThumbnail,
        channelId: finalChannelId,
        channelName: finalChannelName,
        userId,
        totalDuration: 0,
        updatedAt: now,
        createdAt: now,
      }).select().single()

      if (playlistResult.error || !playlistResult.data) {
        console.error('Error creating playlist:', playlistResult.error)
        return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 })
      }

      const playlist = playlistResult.data

      await db.from('LibraryItem').insert({
        id: crypto.randomUUID(),
        userId,
        externalId: playlist.id,
        type: 'PLAYLIST',
        title: finalTitle,
        folderId: folderId || null,
        updatedAt: now,
        createdAt: now,
      })

      if (playlistVideos.length > 0) {
        const totalDuration = playlistVideos.reduce((sum, v) => sum + (v.duration || 0), 0)
        
        // Bulk upsert instead of loop
        const { error: upsertError } = await db.from('Video').upsert(
          playlistVideos.map(video => ({
            youtubeId: video.youtubeId,
            title: video.title,
            description: video.description || '',
            thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
            duration: video.duration || 0,
            playlistId: playlist.id,
            userId,
            position: video.position || 0,
            updatedAt: now,
            createdAt: now,
          })), { onConflict: 'youtubeId,userId' }
        )

        if (upsertError) {
          console.error('Error batch upserting playlist videos:', upsertError)
        }
        
        await db.from('Playlist').update({ totalDuration }).eq('id', playlist.id)

        const videoCountResult = await db.from('Video').select('id', { count: 'exact', head: true }).eq('playlistId', playlist.id).eq('userId', userId)
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

    const now = new Date().toISOString()
    const videoResult = await db.from('Video').insert({
      id: crypto.randomUUID(),
      youtubeId,
      title: finalTitle,
      description: finalDescription,
      thumbnail: finalThumbnail,
      duration: finalDuration,
      playlistId: null,
      userId,
      position: 0,
      updatedAt: now,
      createdAt: now,
    }).select().single()

    if (videoResult.error || !videoResult.data) {
      console.error('Error creating video:', videoResult.error)
      return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
    }

    const video = videoResult.data

    const existingItemResult = await db.from('LibraryItem').select('id').eq('userId', userId).eq('type', 'VIDEO').eq('externalId', youtubeId).maybeSingle()
    if (existingItemResult.data) {
      await db.from('LibraryItem').update({ title: finalTitle, folderId: folderId || null, updatedAt: now }).eq('id', existingItemResult.data.id)
    } else {
      await db.from('LibraryItem').insert({
        id: crypto.randomUUID(),
        userId,
        externalId: youtubeId,
        type: 'VIDEO',
        title: finalTitle,
        folderId: folderId || null,
        updatedAt: now,
        createdAt: now,
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
