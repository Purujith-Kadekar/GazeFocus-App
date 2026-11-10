import { NextRequest, NextResponse } from 'next/server'
import type { LibraryItemTypeNew } from '@/types'

/** LibraryItem columns selected by this route (see the select below). */
type FolderItemProjection = {
  id: string
  userId: string
  type: LibraryItemTypeNew
  externalId: string
  title: string | null
  folderId: string | null
  metadata: unknown
  position: number
  createdAt: string
  updatedAt: string
}
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
    const folderResult = await db
      .from('Folder')
      .select('id,userId,title,description,parentId,position,createdAt,updatedAt')
      .eq('id', id)
      .eq('userId', user.id)
      .single()
    const folder = folderResult.data

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const itemsResult = await db
      .from('LibraryItem')
      .select('id,userId,type,externalId,title,folderId,metadata,position,createdAt,updatedAt')
      .eq('folderId', id)
      .eq('userId', user.id)
    const folderItems = itemsResult.data || []

    const playlistIds = folderItems.filter((i: FolderItemProjection) => i.type === 'PLAYLIST').map((i: FolderItemProjection) => i.externalId)
    const videoExternalIds = folderItems.filter((i: FolderItemProjection) => i.type === 'VIDEO').map((i: FolderItemProjection) => i.externalId)
    
    // Fetch thumbnails in parallel for efficiency
    const [playlistThumbnailsResult, videoThumbnailsResult] = await Promise.all([
      playlistIds.length > 0 
        ? db.from('Playlist').select('id, thumbnail').eq('userId', user.id).in('id', playlistIds)
        : Promise.resolve({ data: [] }),
      videoExternalIds.length > 0 
        ? db.from('Video')
            .select('id, youtubeId, thumbnail')
            .eq('userId', user.id)
            .or(`youtubeId.in.(${videoExternalIds.map(id => `"${id}"`).join(',')}),id.in.(${videoExternalIds.map(id => `"${id}"`).join(',')})`)
        : Promise.resolve({ data: [] })
    ])
    
    const playlistThumbnails = playlistThumbnailsResult.data || []
    const videoThumbnails = videoThumbnailsResult.data || []
    
    const playlistMap = new Map<string, string | null>(playlistThumbnails.map((p: { id: string; thumbnail: string | null }) => [p.id, p.thumbnail]))
    const videoMap = new Map<string, string | null>()
    for (const video of videoThumbnails) {
      videoMap.set(video.id, video.thumbnail as string | null)
      videoMap.set(video.youtubeId, video.thumbnail as string | null)
    }
    
    const itemsWithThumbnails = (folderItems || [])
      .filter((item: FolderItemProjection) => {
        if (item.type === 'PLAYLIST') return playlistMap.has(item.externalId)
        if (item.type === 'VIDEO') return videoMap.has(item.externalId)
        // Links have no thumbnail to look up — they always render.
        if (item.type === 'LINK') return true
        return false
      })
      .map((item: FolderItemProjection) => {
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

    const folderResult = await db.from('Folder').update({
      title,
      description,
    }).eq('id', id).eq('userId', user.id).select('id,title,description,position,userId,createdAt,updatedAt').single()

    return NextResponse.json(folderResult.data)
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      { error: 'Failed to update folder' },
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

    // Verify ownership before touching data so a foreign id cannot trigger deletes.
    // Distinguish "database unreachable" (503) from "no such folder" (404):
    // the old check collapsed both into 404.
    const { data: folder, error: folderLookupError } = await db
      .from('Folder')
      .select('id')
      .eq('id', id)
      .eq('userId', user.id)
      .maybeSingle()
    if (folderLookupError) {
      console.error('Error looking up folder for delete:', folderLookupError)
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // The two deletes are independent (items reference the folder, not the
    // other way around), so run them in parallel and check both results —
    // previously neither was inspected, so a failed delete still returned
    // success and the folder reappeared on the next reload.
    const [itemsResult, folderResult] = await Promise.all([
      db.from('LibraryItem').delete().eq('folderId', id).eq('userId', user.id),
      db.from('Folder').delete().eq('id', id).eq('userId', user.id),
    ])

    if (itemsResult.error) {
      console.error('Error deleting folder items:', itemsResult.error)
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    if (folderResult.error) {
      console.error('Error deleting folder:', folderResult.error)
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
