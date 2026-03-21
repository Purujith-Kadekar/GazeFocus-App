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
      .select('*, playlist(*)')
      .eq('id', id)
      .eq('userId', user.id)
      .single()

    if (error || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const { data: notes } = await db
      .from('Note')
      .select('*')
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

    const { data: video } = await db.from('Video').select('id, youtubeId').eq('id', id).single()

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    await db.from('Note').delete().eq('youtubeId', video.youtubeId).eq('userId', user.id)

    await db.from('LibraryItem').delete().eq('type', 'VIDEO').eq('userId', user.id).or(`externalId.eq.${video.youtubeId},externalId.eq.${video.id}`)

    await db.from('Video').delete().eq('id', id).eq('userId', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
