import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import { QuotaEngine, isQuotaExhausted, markQuotaExhausted } from '@/lib/youtube/quota-engine'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

async function syncChannel(
  channel: { id: string; youtubeId: string; userId: string },
  pageToken?: string
) {
  const channelMetadata = await QuotaEngine.getChannel(channel.youtubeId, channel.userId)
  if (!channelMetadata) {
    throw new Error('Failed to fetch channel data from QuotaEngine')
  }

  const { videos, nextPageToken, source } = await QuotaEngine.smartFetchVideos(
    channel.youtubeId,
    pageToken ? 'loadMore' : 'refresh',
    50,
    channel.userId
  )

  // If quota was exhausted during sync, mark it
  if (isQuotaExhausted()) {
    markQuotaExhausted()
  }

  // Only update channel metadata on first sync (no pageToken)
  if (!pageToken) {
    const updateData: Record<string, unknown> = {
      title: channelMetadata.title,
      description: channelMetadata.description,
      thumbnail: channelMetadata.thumbnail,
      updatedAt: new Date().toISOString(),
    }

    const { error: channelUpdateError } = await db
      .from('Channel')
      .update(updateData)
      .eq('id', channel.id)

    if (channelUpdateError) {
      console.error('Error updating channel:', channelUpdateError)
    }
  }

  let addedCount = 0
  if (videos.length > 0) {
    // Collect video IDs for enrichment if needed (source is RSS or from cache but missing duration)
    const videosToEnrich = videos.filter(v => v.duration === 0).map(v => v.youtubeId)
    const enrichment = videosToEnrich.length > 0 
      ? await QuotaEngine.enrichVideoMetadata(videosToEnrich, channel.userId)
      : {}

    const enrichedVideos = videos.map(v => ({
      ...v,
      duration: enrichment[v.youtubeId]?.duration ?? v.duration,
      description: enrichment[v.youtubeId]?.description ?? v.description,
      title: enrichment[v.youtubeId]?.title ?? v.title,
      thumbnail: enrichment[v.youtubeId]?.thumbnail ?? v.thumbnail,
    }))

    // Find existing videos in one query
    const fetchedIds = enrichedVideos.map(v => v.youtubeId)
    const { data: existingVideos } = await db
      .from('Video')
      .select('youtubeId')
      .eq('userId', channel.userId)
      .in('youtubeId', fetchedIds)

    const existingIds = new Set<string>((existingVideos || []).map((v: { youtubeId: string }) => v.youtubeId))
    const newVideos = enrichedVideos.filter(v => !existingIds.has(v.youtubeId))

    if (newVideos.length > 0) {
      const now = new Date().toISOString()
      const { error: insertError } = await db.from('Video').insert(
        newVideos.map(v => ({
          id: crypto.randomUUID(),
          youtubeId: v.youtubeId,
          title: v.title,
          description: v.description,
          thumbnail: v.thumbnail,
          duration: v.duration || 0,
          channelId: channel.id,
          userId: channel.userId,
          createdAt: now,
          updatedAt: now,
        }))
      )

      if (!insertError) {
        addedCount = newVideos.length
      } else {
        console.error('Error batch inserting videos:', insertError)
      }
    }
  }

  const { count: totalVideos } = await db
    .from('Video')
    .select('id', { count: 'exact', head: true })
    .eq('channelId', channel.id)
    .eq('userId', channel.userId)

  return {
    channelId: channel.id,
    youtubeId: channel.youtubeId,
    addedCount,
    totalVideos: totalVideos || 0,
    title: channelMetadata.title,
    thumbnail: channelMetadata.thumbnail,
    nextPageToken: nextPageToken || null,
    source,
    quotaExhausted: isQuotaExhausted()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, pageToken } = body

    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const { data: channel } = await db
      .from('Channel')
      .select('id, youtubeId, userId')
      .eq('id', channelId)
      .eq('userId', user.id)
      .maybeSingle()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const result = await syncChannel(channel, pageToken)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error syncing channel:', error)
    return NextResponse.json({ error: 'Failed to sync channel', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
