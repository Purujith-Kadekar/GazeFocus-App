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
    const playlistResult = await db.from('Playlist').select('*, videos:Video(*)').eq('id', id).eq('userId', user.id).single()
    const playlist = playlistResult.data

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

    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : null

    const playlistResult = await db.from('Playlist').update({ ...updateData, updatedAt: new Date().toISOString() }).eq('id', id).eq('userId', user.id).select().single()

    if (playlistResult.error || !playlistResult.data) {
      console.error('Error updating playlist:', playlistResult.error)
      return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 })
    }

    return NextResponse.json(playlistResult.data)
  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to update playlist' },
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

    await db.from('Playlist').delete().eq('id', id).eq('userId', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/playlists] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete playlist', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
