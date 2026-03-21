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
    const folderResult = await db.from('Folder').select('*').eq('id', id).single()
    const folder = folderResult.data

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const itemsResult = await db.from('LibraryItem').select('*').eq('folderId', id)
    const folderItems = itemsResult.data || []

    const playlistIds = folderItems.filter((i: any) => i.type === 'PLAYLIST').map((i: any) => i.externalId)
    const videoExternalIds = folderItems.filter((i: any) => i.type === 'VIDEO').map((i: any) => i.externalId)
    
    const playlistThumbnailsResult = playlistIds.length > 0 
      ? await db.from('Playlist').select('id, thumbnail').in('id', playlistIds)
      : { data: [] }
    
    const videoThumbnailsResult = videoExternalIds.length > 0 
      ? await db.from('Video').select('id, youtubeId, thumbnail').eq('userId', user.id).or(`youtubeId.in.(${videoExternalIds.join(',')}),id.in.(${videoExternalIds.join(',')})`)
      : { data: [] }
    
    const playlistThumbnails = playlistThumbnailsResult.data || []
    const videoThumbnails = videoThumbnailsResult.data || []
    
    const playlistMap = new Map<string, string | null>(playlistThumbnails.map((p: any) => [p.id, p.thumbnail as string | null]))
    const videoMap = new Map<string, string | null>()
    for (const video of videoThumbnails) {
      videoMap.set(video.id, video.thumbnail as string | null)
      videoMap.set(video.youtubeId, video.thumbnail as string | null)
    }
    
    const itemsWithThumbnails = (folderItems || []).map((item: any) => {
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
    }).eq('id', id).eq('userId', user.id).select().single()

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
    
    await db.from('LibraryItem').delete().eq('folderId', id).eq('userId', user.id)

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
