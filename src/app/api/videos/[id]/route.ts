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
      .select('id,youtubeId,title,description,thumbnail,duration,playlistId,position,scheduledAt,createdAt,updatedAt,userId')
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

    // Verify ownership before deleting. Distinguish "database unreachable"
    // (503) from "no such video" (404); the old check collapsed both into 404.
    const videoResult = await db.from('Video').select('id, youtubeId').eq('id', id).eq('userId', user.id).maybeSingle()
    if (videoResult.error) {
      console.error('Error looking up video for delete:', videoResult.error)
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    if (!videoResult.data) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const youtubeId = videoResult.data.youtubeId

    // Cascade delete: clean up all related data, then the video itself.
    // All five target tables are independent of each other, so run them in
    // parallel instead of sequentially — one round-trip instead of five.
    const [notesResult, progressResult, libByYoutube, libById, videoResult2] = await Promise.all([
      db.from('Note').delete().eq('youtubeId', youtubeId).eq('userId', user.id),
      db.from('VideoProgress').delete().eq('youtubeId', youtubeId).eq('userId', user.id),
      db.from('LibraryItem').delete().eq('externalId', youtubeId).eq('userId', user.id).eq('type', 'VIDEO'),
      db.from('LibraryItem').delete().eq('externalId', id).eq('userId', user.id),
      db.from('Video').delete().eq('id', id).eq('userId', user.id).select('id'),
    ])

    const cascade = [
      ['notes', notesResult],
      ['progress', progressResult],
      ['library items', libByYoutube],
      ['library items (by id)', libById],
      ['video', videoResult2],
    ] as const
    const failed = cascade.filter(([, r]) => r.error)
    if (failed.length > 0) {
      for (const [label, r] of failed) console.error(`Error deleting ${label}:`, r.error)
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
    }
    // .select('id') above returns the deleted rows; empty means the row was
    // already gone (deleted concurrently) — report not found, not success.
    const deletedRows = Array.isArray(videoResult2.data) ? videoResult2.data : (videoResult2.data ? [videoResult2.data] : [])
    if (deletedRows.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
