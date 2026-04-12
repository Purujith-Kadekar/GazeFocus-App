import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import { QuotaEngine, isQuotaExhausted, markQuotaExhausted } from '@/lib/youtube/quota-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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
    const updateData: any = {
      title: channelMetadata.title,
      description: channelMetadata.description,
      thumbnail: channelMetadata.thumbnail,
      updatedAt: new Date().toISOString(),
    }

    const { error: channelUpdateError } = await supabase
      .from('Channel')
      .update(updateData)
      .eq('id', channel.id)

    if (channelUpdateError) {
      console.error('Error updating channel:', channelUpdateError)
    }
  }

  let addedCount = 0
  if (videos.length > 0) {
    for (const video of videos) {
      const { data: existingVideo } = await supabase
        .from('Video')
        .select('id')
        .eq('youtubeId', video.youtubeId)
        .eq('userId', channel.userId)
        .maybeSingle()

      if (!existingVideo) {
        const videoId = crypto.randomUUID()
        const now = new Date().toISOString()

        const { error: videoInsertError } = await supabase.from('Video').insert({
          id: videoId,
          youtubeId: video.youtubeId,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          duration: video.duration || 0,
          channelId: channel.id,
          userId: channel.userId,
          createdAt: now,
          updatedAt: now,
        })

        if (!videoInsertError) {
          addedCount++
        } else {
          console.error('Error inserting video:', videoInsertError)
        }
      }
    }
  }

  const { count: totalVideos } = await supabase
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

    const { data: channel } = await supabase
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
  } catch (error: any) {
    console.error('Error syncing channel:', error)
    return NextResponse.json({ error: 'Failed to sync channel', details: error.message }, { status: 500 })
  }
}
