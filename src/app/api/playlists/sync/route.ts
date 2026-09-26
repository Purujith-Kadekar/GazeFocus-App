import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import { QuotaEngine } from '@/lib/youtube/quota-engine'
import { fetchPlaylistFromInvidious, fetchPlaylistFromPiped, type AltPlaylistVideo } from '@/lib/youtube/alt-sources'
import { fetchAllPlaylistVideosFromAPI, fetchPlaylistVideosFromRSS, parseDuration } from '@/lib/youtube/shared'
import { randomUUID } from 'crypto'

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
  source: string
}

/**
 * Insert new videos and update existing ones WITHOUT overwriting the id column.
 *
 * The old code used upsert with `id: randomUUID()` which overwrites the existing
 * row's `id` on conflict — breaking foreign-key references (Note → Video,
 * VideoProgress → Video).  This helper mirrors the pattern already used in
 * the playlist import route (playlists/route.ts) which correctly separates
 * insert vs update operations.
 */
async function insertOrUpdateVideos(
  videos: Array<{
    youtubeId: string
    title: string
    description: string
    thumbnail: string
    duration: number
    position: number
  }>,
  userId: string,
  playlistId: string
): Promise<{ inserted: number; updated: number }> {
  if (videos.length === 0) return { inserted: 0, updated: 0 }

  const youtubeIds = videos.map(v => v.youtubeId)

  // Check which youtubeIds already exist in the DB for this user
  const { data: existingVideos } = await db
    .from('Video')
    .select('id, youtubeId')
    .eq('userId', userId)
    .in('youtubeId', youtubeIds)

  const existingYoutubeIds = new Set<string>((existingVideos || []).map((v: { youtubeId: string }) => v.youtubeId))

  const now = new Date().toISOString()
  const videosToInsert: Array<typeof videos[number] & {
    id: string
    playlistId: string
    userId: string
    updatedAt: string
    createdAt: string
  }> = []
  const videosToUpdate: Array<typeof videos[number]> = []

  for (const video of videos) {
    if (existingYoutubeIds.has(video.youtubeId)) {
      // Existing video — update metadata fields but NOT the id
      videosToUpdate.push(video)
    } else {
      // New video — insert with a fresh id
      videosToInsert.push({
        id: randomUUID(),
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        duration: video.duration,
        playlistId,
        userId,
        position: video.position,
        updatedAt: now,
        createdAt: now,
      })
    }
  }

  // Insert truly new videos
  if (videosToInsert.length > 0) {
    const { error: insertError } = await db.from('Video').insert(videosToInsert)
    if (insertError) {
      console.error('Error inserting new videos:', insertError)
    }
  }

  // Update existing videos — only metadata fields, never id
  for (const video of videosToUpdate) {
    await db.from('Video').update({
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      duration: video.duration,
      playlistId,
      position: video.position,
      updatedAt: now,
    }).eq('youtubeId', video.youtubeId).eq('userId', userId)
  }

  return { inserted: videosToInsert.length, updated: videosToUpdate.length }
}

/**
 * Sync a playlist using the RSS-first strategy:
 *
 * 1. RSS check (free, ≤15 most recent videos)
 *    → Compare RSS video IDs against existing DB videos
 *    → If no new IDs found → SKIP (0 API calls)
 *    → If new IDs found → add them directly + enrich duration
 *
 * 2. If RSS empty/fails AND playlist has fewer videos than totalVideos stored:
 *    → Try Invidious (free)
 *    → Try Piped (free)
 *    → Fall back to YouTube API (quota-burn)
 *
 * 3. If we have more videos stored than the stored total, re-check total from API metadata
 */
async function syncPlaylist(playlist: { id: string; youtubeId: string; userId: string; totalVideos?: number }): Promise<SyncResult> {
  const { id: playlistId, youtubeId: playlistYoutubeId, userId } = playlist

  // Get existing videos from DB
  const existingVideosResult = await db.from('Video').select('youtubeId').eq('userId', userId).eq('playlistId', playlistId)
  const existingVideoIds = new Set<string>((existingVideosResult.data || []).map((v: { youtubeId: string }) => v.youtubeId))

  // Get stored totalVideos count
  const playlistMeta = await db.from('Playlist').select('totalVideos').eq('id', playlistId).maybeSingle()
  const storedTotalVideos = playlistMeta.data?.totalVideos || 0

  // --- Step 1: RSS check (free, fast) ---
  const rssVideos = await fetchPlaylistVideosFromRSS(playlistYoutubeId)

  if (rssVideos.length > 0) {
    // Find new video IDs from RSS (these are the most recent videos)
    const newRssVideos = rssVideos.filter(v => !existingVideoIds.has(v.youtubeId))

    if (newRssVideos.length > 0) {
      // Enrich duration for new videos that don't have it
      const enrichmentNeeded = newRssVideos.filter(v => v.duration === 0)
      let enrichment: Record<string, any> = {}

      if (enrichmentNeeded.length > 0) {
        enrichment = await QuotaEngine.enrichVideoMetadata(
          enrichmentNeeded.map(v => v.youtubeId),
          userId
        )
      }

      const finalNewVideos = newRssVideos.map(v => ({
        youtubeId: v.youtubeId,
        title: enrichment[v.youtubeId]?.title || v.title,
        description: enrichment[v.youtubeId]?.description || v.description,
        thumbnail: enrichment[v.youtubeId]?.thumbnail || v.thumbnail,
        duration: v.duration || enrichment[v.youtubeId]?.duration || 0,
        position: v.position,
      }))

      // Insert new videos and update existing ones without overwriting id
      if (finalNewVideos.length > 0) {
        await insertOrUpdateVideos(finalNewVideos, userId, playlistId)
      }

      // Update total duration
      const allVideosResult = await db.from('Video').select('duration').eq('userId', userId).eq('playlistId', playlistId)
      const totalDuration = (allVideosResult.data || []).reduce((sum: number, video: { duration: number }) => sum + (video.duration || 0), 0)
      await db.from('Playlist').update({ totalDuration, totalVideos: Math.max(storedTotalVideos, existingVideoIds.size + finalNewVideos.length) }).eq('id', playlistId)

      return {
        playlistId,
        youtubeId: playlistYoutubeId,
        addedCount: finalNewVideos.length,
        totalVideos: (allVideosResult.data || []).length,
        source: 'rss',
      }
    }

    // All RSS IDs exist in DB already — check if we might be missing videos
    // If stored total > current DB count, there might be old videos we never fetched
    if (storedTotalVideos > existingVideoIds.size) {
      // We have fewer videos than expected — try full fetch from alt sources
      const altResult = await fetchFullPlaylistAndFillGap(playlistId, playlistYoutubeId, userId, existingVideoIds)
      if (altResult) return altResult
    }

    // No new videos found, and no gap detected
    return {
      playlistId,
      youtubeId: playlistYoutubeId,
      addedCount: 0,
      totalVideos: existingVideoIds.size,
      source: 'rss-none',
    }
  }

  // --- Step 2: RSS failed/empty — try Invidious/Piped ---
  const altResult = await fetchFullPlaylistAndFillGap(playlistId, playlistYoutubeId, userId, existingVideoIds)
  if (altResult) return altResult

  // --- Step 3: All alternative sources failed — try YouTube API ---
  // Only use if we think there are missing videos
  if (storedTotalVideos > existingVideoIds.size || storedTotalVideos === 0) {
    const apiVideos = await fetchAllPlaylistVideosFromAPI(playlistYoutubeId)
    const newApiVideos = apiVideos.filter(v => !existingVideoIds.has(v.youtubeId))

    if (newApiVideos.length > 0) {
      await insertOrUpdateVideos(newApiVideos, userId, playlistId)

      const allVideosResult = await db.from('Video').select('duration').eq('userId', userId).eq('playlistId', playlistId)
      const totalDuration = (allVideosResult.data || []).reduce((sum: number, video: { duration: number }) => sum + (video.duration || 0), 0)
      await db.from('Playlist').update({ totalDuration, totalVideos: Math.max(storedTotalVideos, apiVideos.length) }).eq('id', playlistId)

      return {
        playlistId,
        youtubeId: playlistYoutubeId,
        addedCount: newApiVideos.length,
        totalVideos: (allVideosResult.data || []).length,
        source: 'youtube-api',
      }
    }
  }

  // Nothing new from any source
  return {
    playlistId,
    youtubeId: playlistYoutubeId,
    addedCount: 0,
    totalVideos: existingVideoIds.size,
    source: 'none',
  }
}

/**
 * Try Invidious then Piped to fill missing videos in a playlist.
 * Returns a SyncResult if new videos were found, or null if no new videos.
 */
async function fetchFullPlaylistAndFillGap(
  playlistId: string,
  playlistYoutubeId: string,
  userId: string,
  existingVideoIds: Set<string>
): Promise<SyncResult | null> {
  // Try Invidious
  const invidiousResult = await fetchPlaylistFromInvidious(playlistYoutubeId)
  if (invidiousResult) {
    const newVideos = invidiousResult.videos.filter(v => !existingVideoIds.has(v.youtubeId))

    if (newVideos.length > 0) {
      // Enrich duration for videos that have 0
      const enrichmentNeeded = newVideos.filter(v => v.duration === 0)
      let enrichment: Record<string, any> = {}
      if (enrichmentNeeded.length > 0) {
        enrichment = await QuotaEngine.enrichVideoMetadata(
          enrichmentNeeded.map(v => v.youtubeId),
          userId
        )
      }

      const finalNewVideos = newVideos.map(v => ({
        youtubeId: v.youtubeId,
        title: enrichment[v.youtubeId]?.title || v.title,
        description: enrichment[v.youtubeId]?.description || v.description,
        thumbnail: enrichment[v.youtubeId]?.thumbnail || v.thumbnail,
        duration: v.duration || enrichment[v.youtubeId]?.duration || 0,
        position: v.position,
      }))

      await insertOrUpdateVideos(finalNewVideos, userId, playlistId)

      // Update playlist metadata
      const allVideosResult = await db.from('Video').select('duration').eq('userId', userId).eq('playlistId', playlistId)
      const totalDuration = (allVideosResult.data || []).reduce((sum: number, video: { duration: number }) => sum + (video.duration || 0), 0)
      const newTotalVideos = Math.max(invidiousResult.info.videoCount, existingVideoIds.size + finalNewVideos.length)
      await db.from('Playlist').update({ totalDuration, totalVideos: newTotalVideos }).eq('id', playlistId)

      return {
        playlistId,
        youtubeId: playlistYoutubeId,
        addedCount: finalNewVideos.length,
        totalVideos: (allVideosResult.data || []).length,
        source: 'invidious',
      }
    }
  }

  // Try Piped
  const pipedResult = await fetchPlaylistFromPiped(playlistYoutubeId)
  if (pipedResult) {
    const newVideos = pipedResult.videos.filter(v => !existingVideoIds.has(v.youtubeId))

    if (newVideos.length > 0) {
      const enrichmentNeeded = newVideos.filter(v => v.duration === 0)
      let enrichment: Record<string, any> = {}
      if (enrichmentNeeded.length > 0) {
        enrichment = await QuotaEngine.enrichVideoMetadata(
          enrichmentNeeded.map(v => v.youtubeId),
          userId
        )
      }

      const finalNewVideos = newVideos.map(v => ({
        youtubeId: v.youtubeId,
        title: enrichment[v.youtubeId]?.title || v.title,
        description: enrichment[v.youtubeId]?.description || v.description,
        thumbnail: enrichment[v.youtubeId]?.thumbnail || v.thumbnail,
        duration: v.duration || enrichment[v.youtubeId]?.duration || 0,
        position: v.position,
      }))

      await insertOrUpdateVideos(finalNewVideos, userId, playlistId)

      const allVideosResult = await db.from('Video').select('duration').eq('userId', userId).eq('playlistId', playlistId)
      const totalDuration = (allVideosResult.data || []).reduce((sum: number, video: { duration: number }) => sum + (video.duration || 0), 0)
      const newTotalVideos = Math.max(pipedResult.info.videoCount, existingVideoIds.size + finalNewVideos.length)
      await db.from('Playlist').update({ totalDuration, totalVideos: newTotalVideos }).eq('id', playlistId)

      return {
        playlistId,
        youtubeId: playlistYoutubeId,
        addedCount: finalNewVideos.length,
        totalVideos: (allVideosResult.data || []).length,
        source: 'piped',
      }
    }
  }

  return null // no new videos from alt sources
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
        .select('id, youtubeId, userId, totalVideos')
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

    const playlistResult = await db.from('Playlist').select('id, youtubeId, userId, totalVideos').eq('id', playlistId).eq('userId', user.id).maybeSingle()
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
