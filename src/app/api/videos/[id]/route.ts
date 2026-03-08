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
    const video = await db.video.findFirst({
      where: { id, userId: user.id },
      include: {
        playlist: true,
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const notes = await db.note.findMany({
      where: { youtubeId: video.youtubeId, userId: user.id },
      orderBy: { timestampSeconds: 'asc' },
    })

    return NextResponse.json({ ...video, notes })
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
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
    const { lastPosition, duration } = body

    const video = await db.video.update({
      where: { id, userId: user.id },
      data: {
        ...(lastPosition !== undefined && { position: lastPosition }),
        ...(duration !== undefined && { duration }),
      },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
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

    const video = await db.video.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    await db.note.deleteMany({
      where: { youtubeId: video.youtubeId, userId: user.id },
    })

    await db.libraryItem.deleteMany({
      where: { externalId: video.youtubeId, type: 'VIDEO', userId: user.id },
    })

    await db.video.delete({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
