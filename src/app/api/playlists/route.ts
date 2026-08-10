import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import { QuotaEngine } from '@/lib/youtube/quota-engine'
import { fetchPlaylistWithFallback, fetchVideoWithFallback, type AltPlaylistVideo } from '@/lib/youtube/alt-sources'
import { fetchYouTubePlaylistDetails, fetchYouTubeVideoDetails, fetchAllPlaylistVideosFromAPI, parseDuration } from '@/lib/youtube/shared'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const playlistsResult = await db
      .from('Playlist')
      .select('id,youtubeId,title,description,thumbnail,channelId,channelName,totalDuration,totalVideos,scheduledAt,createdAt,updatedAt,userId')
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
      const existingResult = await db.from('Video').select('id, playlistId, channelId').eq('youtubeId', youtubeId).eq('userId', userId).maybeSingle()
      if (existingResult.data) {
        // If the video exists but is standalone (not in any playlist or channel), it's a duplicate standalone add
        if (!existingResult.data.playlistId && !existingResult.data.channelId) {
          return NextResponse.json(
            { error: 'This video already exists in your library' },
            { status: 400 }
          )
        }
        // If the video exists as part of a playlist/channel, user might be re-adding as standalone
        // Allow this by creating a new standalone reference (the video stays in its playlist/channel
        // AND we acknowledge the user wants it as standalone too)
        // Actually, this is ambiguous. For now, block it - user should remove from playlist first
        return NextResponse.json(
          { error: 'This video already exists in a playlist or channel in your library' },
          { status: 400 }
        )
      }
    }

    // --- PLAYLIST IMPORT ---
    if (type === 'playlist') {
      let playlistTitle = title || ''
      let playlistDescription = description || ''
      let playlistThumbnail = thumbnail || ''
      let playlistChannelId = channelId || ''
      let playlistChannelName = channelName || ''
      let totalVideoCount = 0

      // Try to get playlist metadata from YouTube API (1 unit, gives itemCount)
      const ytPlaylistDetails = await fetchYouTubePlaylistDetails(youtubeId)
      if (ytPlaylistDetails) {
        playlistTitle = title || ytPlaylistDetails.title
        playlistDescription = description || ytPlaylistDetails.description
        playlistThumbnail = thumbnail || ytPlaylistDetails.thumbnail
        playlistChannelId = channelId || ytPlaylistDetails.channelId
        playlistChannelName = channelName || ytPlaylistDetails.channelName
        totalVideoCount = ytPlaylistDetails.itemCount
      }

      // Fetch videos: Invidious → Piped → YouTube API
      const result = await fetchPlaylistWithFallback(youtubeId, fetchAllPlaylistVideosFromAPI)

      if (!result || result.videos.length === 0) {
        // No videos found from any source — still create the playlist (user can sync later)
        const now = new Date().toISOString()
        const playlistResult = await db.from('Playlist').insert({
          id: crypto.randomUUID(),
          youtubeId,
          title: playlistTitle || `YouTube Playlist ${youtubeId}`,
          description: playlistDescription,
          thumbnail: playlistThumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          channelId: playlistChannelId,
          channelName: playlistChannelName || 'Unknown Channel',
          userId,
          totalDuration: 0,
          totalVideos: totalVideoCount,
          updatedAt: now,
          createdAt: now,
        }).select().single()

        if (playlistResult.error || !playlistResult.data) {
          return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 })
        }

        await db.from('LibraryItem').insert({
          id: crypto.randomUUID(),
          userId,
          externalId: playlistResult.data.id,
          type: 'PLAYLIST',
          title: playlistResult.data.title,
          folderId: folderId || null,
          updatedAt: now,
          createdAt: now,
        })

        return NextResponse.json({ 
          ...playlistResult.data, 
          videosCreated: 0,
          videoCount: 0,
          source: 'none',
        }, { status: 201 })
      }

      // Enrich videos that have missing duration (from RSS/Piped, duration may be 0)
      const videosNeedingEnrichment = result.videos.filter(v => v.duration === 0)
      let enrichedVideos: Record<string, any> = {}

      if (videosNeedingEnrichment.length > 0 && result.source !== 'youtube-api') {
        const videoIds = videosNeedingEnrichment.map(v => v.youtubeId)
        enrichedVideos = await QuotaEngine.enrichVideoMetadata(videoIds, userId)
      }

      const finalVideos = result.videos.map(v => ({
        youtubeId: v.youtubeId,
        title: v.title || enrichedVideos[v.youtubeId]?.title || 'Unknown',
        description: v.description || enrichedVideos[v.youtubeId]?.description || '',
        thumbnail: v.thumbnail || enrichedVideos[v.youtubeId]?.thumbnail || `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`,
        duration: v.duration || enrichedVideos[v.youtubeId]?.duration || 0,
        position: v.position,
      }))

      // If we got playlist info from Invidious/Piped, update our metadata
      if (result.info) {
        if (!playlistTitle) playlistTitle = result.info.title
        if (!playlistDescription) playlistDescription = result.info.description
        if (!playlistThumbnail) playlistThumbnail = result.info.thumbnail
        if (!playlistChannelName) playlistChannelName = result.info.author
        if (totalVideoCount === 0) totalVideoCount = result.info.videoCount
      }

      const storedTotalVideos = Math.max(totalVideoCount, finalVideos.length)

      const now = new Date().toISOString()
      const playlistResult = await db.from('Playlist').insert({
        id: crypto.randomUUID(),
        youtubeId,
        title: playlistTitle || `YouTube Playlist ${youtubeId}`,
        description: playlistDescription,
        thumbnail: playlistThumbnail,
        channelId: playlistChannelId,
        channelName: playlistChannelName || 'Unknown Channel',
        userId,
        totalDuration: 0,
        totalVideos: storedTotalVideos,
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
        title: playlistTitle,
        folderId: folderId || null,
        updatedAt: now,
        createdAt: now,
      })

      if (finalVideos.length > 0) {
        const totalDuration = finalVideos.reduce((sum, v) => sum + (v.duration || 0), 0)

        // === CRITICAL FIX: Proper content categorization ===
        // Instead of bulk upsert (which overwrites video id), we must:
        // 1. Check which videos already exist for this user
        // 2. For existing standalone videos: UPDATE playlistId (move to playlist)
        // 3. For new videos: INSERT with playlistId set
        // 4. Clean up stale LibraryItems (standalone VIDEO items that now belong to a playlist)

        const fetchedYoutubeIds = finalVideos.map(v => v.youtubeId)
        
        // Find existing videos for this user with these youtubeIds
        const { data: existingVideos } = await db
          .from('Video')
          .select('id, youtubeId, playlistId, channelId')
          .eq('userId', userId)
          .in('youtubeId', fetchedYoutubeIds)

        const existingMap = new Map<string, any>((existingVideos || []).map((v: any) => [v.youtubeId, v]))
        
        // Separate into videos to update vs insert
        const videosToUpdate: Array<{ youtubeId: string; playlistId: string; title?: string; thumbnail?: string; duration?: number; position?: number }> = []
        const videosToInsert: Array<any> = []

        for (const video of finalVideos) {
          const existing = existingMap.get(video.youtubeId)
          
          if (existing) {
            // Video already exists - UPDATE it to belong to this playlist
            // Only update playlistId (don't overwrite id or other critical fields)
            // If the video was standalone (playlistId=null, channelId=null), it moves to this playlist
            // If the video was in another playlist, it's now in THIS playlist (user chose to add this playlist)
            // If the video was in a channel, it stays in channel AND also in this playlist
            // Note: a video can only have ONE playlistId, so adding it to a new playlist means
            // removing it from the old one. This is correct: the user is choosing this playlist.
            
            videosToUpdate.push({
              youtubeId: video.youtubeId,
              playlistId: playlist.id,
              // Also update metadata if we have better data
              title: video.title !== 'Unknown' ? video.title : undefined,
              thumbnail: video.thumbnail || undefined,
              duration: video.duration || undefined,
              position: video.position || undefined,
            })
          } else {
            // New video - INSERT with playlistId set
            videosToInsert.push({
              id: crypto.randomUUID(),
              youtubeId: video.youtubeId,
              title: video.title,
              description: video.description || '',
              thumbnail: video.thumbnail,
              duration: video.duration || 0,
              playlistId: playlist.id,
              userId,
              position: video.position || 0,
              updatedAt: now,
              createdAt: now,
            })
          }
        }

        // Insert new videos
        if (videosToInsert.length > 0) {
          const { error: insertError } = await db.from('Video').insert(videosToInsert)
          if (insertError) {
            console.error('Error inserting new playlist videos:', insertError)
          }
        }

        // Update existing videos to belong to this playlist
        for (const update of videosToUpdate) {
          const updateData: Record<string, any> = {
            playlistId: update.playlistId,
            updatedAt: now,
          }
          if (update.title) updateData.title = update.title
          if (update.thumbnail) updateData.thumbnail = update.thumbnail
          if (update.duration) updateData.duration = update.duration
          if (update.position !== undefined) updateData.position = update.position
          
          await db.from('Video').update(updateData).eq('youtubeId', update.youtubeId).eq('userId', userId)
        }

        // Clean up stale LibraryItems: if a video was previously added as standalone (VIDEO type)
        // and now belongs to a playlist, the standalone LibraryItem should be removed
        // so the video doesn appear in both the Videos section AND the Playlist
        const updatedYoutubeIds = videosToUpdate.map(v => v.youtubeId)
        if (updatedYoutubeIds.length > 0) {
          await db.from('LibraryItem')
            .delete()
            .eq('userId', userId)
            .eq('type', 'VIDEO')
            .in('externalId', updatedYoutubeIds)
        }

        await db.from('Playlist').update({ totalDuration, totalVideos: storedTotalVideos }).eq('id', playlist.id)
      }

      return NextResponse.json({ 
        ...playlist, 
        videosCreated: finalVideos.length,
        source: result.source,
      }, { status: 201 })
    }

    // --- SINGLE VIDEO IMPORT ---
    // Try Invidious → Piped → YouTube API
    const altVideo = await fetchVideoWithFallback(youtubeId, fetchYouTubeVideoDetails)

    const finalTitle = title || altVideo?.title || `YouTube Video ${youtubeId}`
    const finalDescription = description || altVideo?.description || ''
    const finalThumbnail = thumbnail || altVideo?.thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    const finalChannelId = channelId || ''
    const finalChannelName = channelName || altVideo?.author || 'Unknown Channel'
    const finalDuration = altVideo?.duration || 0

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
      channelId: null,
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
