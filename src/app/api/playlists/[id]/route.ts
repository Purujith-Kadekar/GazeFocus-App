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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const { data: playlist } = await db.from('Playlist').select('*').eq('id', id).eq('userId', user.id).single()
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })

    const { data: videos } = await db.from('Video').select('*').eq('playlistId', id).order('position', { ascending: true })

    return NextResponse.json({ ...playlist, videos: videos || [] })
  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 })
  }
}

// PUT /api/playlists/[id] - Update a playlist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const { scheduledAt, title, description } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : null

    const { data: playlist, error } = await db.from('Playlist').update(updateData).eq('id', id).eq('userId', user.id).select().single()
    if (error) throw error

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 })
  }
}

// DELETE /api/playlists/[id] - Delete a playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    await db.from('Video').delete().eq('playlistId', id)
    await db.from('LibraryItem').delete().eq('externalId', id).eq('type', 'PLAYLIST').eq('userId', user.id)
    await db.from('Playlist').delete().eq('id', id).eq('userId', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/playlists] Error:', error)
    return NextResponse.json({ error: 'Failed to delete playlist', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
