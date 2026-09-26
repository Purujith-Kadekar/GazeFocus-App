import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import { deleteChannel } from '@/lib/channel-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: channel, error } = await db
      .from('Channel')
      .select('id,userId,youtubeId,title,description,thumbnail,subscriberCount,videoCount,isLive,liveVideoId,liveTitle,createdAt,updatedAt')
      .eq('id', id)
      .eq('userId', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch channel', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error('Error fetching channel:', error)
    return NextResponse.json({ error: 'Failed to fetch channel', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership and get channel's youtubeId for cascade deletes
    const { data: channel } = await db
      .from('Channel')
      .select('id, youtubeId')
      .eq('id', id)
      .eq('userId', user.id)
      .maybeSingle()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Cascade delete: get all videos for this channel
    const videosResult = await db
      .from('Video')
      .select('id, youtubeId')
      .eq('channelId', id)
      .eq('userId', user.id)

    const videoYoutubeIds = (videosResult.data || []).map((v: { youtubeId: string }) => v.youtubeId)

    // Delete notes for those videos using youtubeIds
    if (videoYoutubeIds.length > 0) {
      await db.from('Note').delete().in('youtubeId', videoYoutubeIds).eq('userId', user.id)
    }

    // Delete VideoProgress for those youtubeIds
    if (videoYoutubeIds.length > 0) {
      await db.from('VideoProgress').delete().in('youtubeId', videoYoutubeIds).eq('userId', user.id)
    }

    // Delete LibraryItems for those video externalIds AND for the channel externalId
    if (videoYoutubeIds.length > 0) {
      await db.from('LibraryItem').delete().in('externalId', videoYoutubeIds).eq('userId', user.id).eq('type', 'VIDEO')
    }
    await db.from('LibraryItem').delete().eq('externalId', id).eq('userId', user.id).eq('type', 'CHANNEL')

    // Delete the videos themselves
    await db.from('Video').delete().eq('channelId', id).eq('userId', user.id)

    // Delete ChannelCache (no userId column on this table)
    await db.from('ChannelCache').delete().eq('youtubeId', channel.youtubeId)

    // Delete the channel
    const { error } = await deleteChannel(id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete channel', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting channel:', error)
    return NextResponse.json({ error: 'Failed to delete channel', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
