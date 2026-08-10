import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

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

    const { data: video, error } = await db
      .from('Video')
      .select('id,youtubeId,title,description,thumbnail,duration,playlistId,position,scheduledAt,createdAt,updatedAt,userId,playlist:Playlist(id,youtubeId,title,description,thumbnail,channelId,channelName,totalDuration,scheduledAt,createdAt,updatedAt,userId)')
      .eq('id', id)
      .eq('userId', user.id)
      .single()

    if (error || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const { data: notes } = await db
      .from('Note')
      .select('id,content,timestampSeconds,isImportant,youtubeId,createdAt,updatedAt,userId')
      .eq('youtubeId', video.youtubeId)
      .eq('userId', user.id)
      .order('timestampSeconds', { ascending: true })

    return NextResponse.json({ ...video, notes: notes || [] })
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { lastPosition, duration, scheduledAt } = body

    const updateData: Record<string, any> = {}
    if (lastPosition !== undefined) updateData.position = lastPosition
    if (duration !== undefined) updateData.duration = duration
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : null
    updateData.updatedAt = new Date().toISOString()

    const { data: video, error } = await db
      .from('Video')
      .update(updateData)
      .eq('id', id)
      .eq('userId', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating video:', error)
      return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
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

    // Verify ownership before deleting
    const videoResult = await db.from('Video').select('id, youtubeId').eq('id', id).eq('userId', user.id).maybeSingle()
    if (!videoResult.data) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const youtubeId = videoResult.data.youtubeId

    // Cascade delete: clean up all related data before deleting the video
    // Delete notes for this video
    await db.from('Note').delete().eq('youtubeId', youtubeId).eq('userId', user.id)

    // Delete video progress for this video
    await db.from('VideoProgress').delete().eq('youtubeId', youtubeId).eq('userId', user.id)

    // Delete library items referencing this video
    await db.from('LibraryItem').delete().eq('externalId', youtubeId).eq('userId', user.id).eq('type', 'VIDEO')

    // Also delete library items referencing this video by its internal ID (some routes use the DB id)
    await db.from('LibraryItem').delete().eq('externalId', id).eq('userId', user.id)

    // Finally delete the video
    await db.from('Video').delete().eq('id', id).eq('userId', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
