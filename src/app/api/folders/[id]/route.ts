import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

// GET /api/folders/[id] - Get a specific folder
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
    const { data: folder, error } = await db.from('Folder').select('*').eq('id', id).single()

    if (error || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Get library items for this folder
    const { data: items } = await db.from('LibraryItem').select('*').eq('folderId', id)

    // Fetch thumbnails for each item - BATCHED for performance
    const playlistIds = (items || []).filter((i: any) => i.type === 'PLAYLIST').map((i: any) => i.externalId)
    const videoExternalIds = (items || []).filter((i: any) => i.type === 'VIDEO').map((i: any) => i.externalId)

    // Fetch all playlist thumbnails in one query
    let playlistThumbnails: any[] = []
    if (playlistIds.length > 0) {
      const { data } = await db.from('Playlist').select('id, thumbnail').in('id', playlistIds)
      playlistThumbnails = data || []
    }

    // Fetch all video thumbnails in one query
    let videoThumbnails: any[] = []
    if (videoExternalIds.length > 0) {
      const { data } = await db.from('Video').select('id, youtubeId, thumbnail').eq('userId', user.id).or(
        `youtubeId.in.(${videoExternalIds.join(',')}),id.in.(${videoExternalIds.join(',')})`
      )
      videoThumbnails = data || []
    }

    // Create lookup maps
    const playlistMap = new Map(playlistThumbnails.map((p: any) => [p.id, p.thumbnail]))
    const videoMap = new Map<string, string | null>()
    for (const video of videoThumbnails) {
      videoMap.set(video.id, video.thumbnail)
      videoMap.set(video.youtubeId, video.thumbnail)
    }

    // Map thumbnails to items
    const itemsWithThumbnails = (items || []).map((item: any) => {
      let thumbnail: string | null = null
      if (item.type === 'PLAYLIST') {
        thumbnail = playlistMap.get(item.externalId) ?? null
      } else if (item.type === 'VIDEO') {
        thumbnail = videoMap.get(item.externalId) ?? null
      }
      return { ...item, thumbnail }
    })

    return NextResponse.json({ ...folder, items: itemsWithThumbnails })
  } catch (error) {
    console.error('Error fetching folder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 }
    )
  }
}

// PUT /api/folders/[id] - Update a folder
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
    const { title, description } = body

    const { data: folder, error } = await db.from('Folder').update({
      title,
      description,
    }).eq('id', id).eq('userId', user.id).select().single()

    if (error) throw error

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    )
  }
}

// DELETE /api/folders/[id] - Delete a folder
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

    // Delete all library items in the folder first
    await db.from('LibraryItem').delete().eq('folderId', id).eq('userId', user.id)

    // Delete the folder
    await db.from('Folder').delete().eq('id', id).eq('userId', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
