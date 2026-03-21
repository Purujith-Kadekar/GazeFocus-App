import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

// GET /api/playlists/[id] - Get a specific playlist
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
    const playlist = await db.playlist.findUnique({
      where: { id, userId: user.id },
      include: { videos: true },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    )
  }
}

// PUT /api/playlists/[id] - Update a playlist
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
    const { scheduledAt, title, description } = body

    const playlist = await db.playlist.update({
      where: { id, userId: user.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      },
    })

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/playlists/[id] - Delete a playlist
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
    console.log('[DELETE /api/playlists] Deleting playlist:', id)

    // First, delete all videos in the playlist
    console.log('[DELETE /api/playlists] Deleting videos...')
    await db.video.deleteMany({
      where: { playlistId: id },
    })
    console.log('[DELETE /api/playlists] Videos deleted')

    // Delete library items pointing to this playlist
    console.log('[DELETE /api/playlists] Deleting library items...')
    await db.libraryItem.deleteMany({
      where: { externalId: id, type: 'PLAYLIST', userId: user.id },
    })
    console.log('[DELETE /api/playlists] Library items deleted')

    // Delete the playlist
    console.log('[DELETE /api/playlists] Deleting playlist...')
    await db.playlist.delete({
      where: { id, userId: user.id },
    })
    console.log('[DELETE /api/playlists] Playlist deleted')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/playlists] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete playlist', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
