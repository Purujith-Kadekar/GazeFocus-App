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

    const playlistResult = await db.from('Playlist').update({ ...updateData, updatedAt: new Date().toISOString() }).eq('id', id).eq('userId', user.id).select('id,youtubeId,title,description,thumbnail,channelId,channelName,totalDuration,totalVideos,scheduledAt,createdAt,updatedAt,userId').single()

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

    // Verify ownership before deleting
    const playlistResult = await db.from('Playlist').select('id, youtubeId').eq('id', id).eq('userId', user.id).maybeSingle()
    if (!playlistResult.data) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Cascade delete: clean up related data BEFORE deleting the playlist
    // (ON DELETE CASCADE on the FK handles Video→Playlist, but we also need
    // to clean up PlaylistMark, LibraryItem, and Note that reference this playlist)

    // Get all video IDs for this playlist to clean up notes
    const videosResult = await db.from('Video').select('id, youtubeId').eq('playlistId', id)
    const videoIds = (videosResult.data || []).map((v: { id: string }) => v.id)
    const videoYoutubeIds = (videosResult.data || []).map((v: { youtubeId: string }) => v.youtubeId)

    // Delete notes for videos in this playlist
    if (videoYoutubeIds.length > 0) {
      await db.from('Note').delete().in('youtubeId', videoYoutubeIds).eq('userId', user.id)
    }

    // Delete playlist marks
    await db.from('PlaylistMark').delete().eq('youtubeId', playlistResult.data.youtubeId).eq('userId', user.id)

    // Delete library items
    await db.from('LibraryItem').delete().eq('externalId', id).eq('userId', user.id)

    // Delete video progress for videos in this playlist
    if (videoYoutubeIds.length > 0) {
      await db.from('VideoProgress').delete().in('youtubeId', videoYoutubeIds).eq('userId', user.id)
    }

    // Delete videos (ON DELETE CASCADE should handle this, but explicit is safer)
    await db.from('Video').delete().eq('playlistId', id).eq('userId', user.id)

    // Finally delete the playlist
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
