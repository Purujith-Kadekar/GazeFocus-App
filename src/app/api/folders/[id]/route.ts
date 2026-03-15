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
    const folder = await db.folder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Fetch thumbnails for each item - BATCHED for performance
    const playlistIds = folder.items.filter(i => i.type === 'PLAYLIST').map(i => i.externalId)
    const videoExternalIds = folder.items.filter(i => i.type === 'VIDEO').map(i => i.externalId)
    
    // Fetch all playlist thumbnails in one query
    const playlistThumbnails = playlistIds.length > 0 ? await db.playlist.findMany({
      where: { id: { in: playlistIds } },
      select: { id: true, thumbnail: true },
    }) : []
    
    // Fetch all video thumbnails in one query
    const videoThumbnails = videoExternalIds.length > 0 ? await db.video.findMany({
      where: {
        userId: user.id,
        OR: [
          { youtubeId: { in: videoExternalIds } },
          { id: { in: videoExternalIds } },
        ],
      },
      select: { id: true, youtubeId: true, thumbnail: true },
    }) : []
    
    // Create lookup maps
    const playlistMap = new Map(playlistThumbnails.map(p => [p.id, p.thumbnail]))
    const videoMap = new Map<string, string | null>()
    for (const video of videoThumbnails) {
      videoMap.set(video.id, video.thumbnail)
      videoMap.set(video.youtubeId, video.thumbnail)
    }
    
    // Map thumbnails to items
    const itemsWithThumbnails = folder.items.map(item => {
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

    const folder = await db.folder.update({
      where: { id, userId: user.id },
      data: {
        title,
        description,
      },
    })

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
    await db.libraryItem.deleteMany({
      where: { folderId: id, userId: user.id },
    })

    // Delete the folder
    await db.folder.delete({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
