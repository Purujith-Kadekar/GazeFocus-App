import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

// GET /api/folders - Get all folders for the current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const { data: folders, error } = await db.from('Folder').select('*').eq('userId', userId).order('position', { ascending: true })

    if (error) throw error

    // Get item counts for each folder
    const folderIds = (folders || []).map((f: any) => f.id)
    let itemCounts: Record<string, number> = {}
    if (folderIds.length > 0) {
      const { data: items } = await db.from('LibraryItem').select('folderId').in('folderId', folderIds)
      if (items) {
        for (const item of items) {
          itemCounts[item.folderId] = (itemCounts[item.folderId] || 0) + 1
        }
      }
    }

    const foldersWithCount = (folders || []).map((f: any) => ({
      ...f,
      _count: { items: itemCounts[f.id] || 0 },
    }))

    return NextResponse.json(foldersWithCount)
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Get max position
    const { data: maxPosData } = await db.from('Folder').select('position').eq('userId', userId).order('position', { ascending: false }).limit(1).single()
    const maxPosition = maxPosData?.position ?? -1

    const { data: folder, error } = await db.from('Folder').insert({
      title,
      description,
      userId,
      position: maxPosition + 1,
    }).select().single()

    if (error) throw error

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}

// PATCH /api/folders - Reorder folders
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { folderIds } = body

    if (!folderIds || !Array.isArray(folderIds)) {
      return NextResponse.json(
        { error: 'folderIds array is required' },
        { status: 400 }
      )
    }

    // Update positions sequentially (Supabase doesn't support transactions)
    for (let i = 0; i < folderIds.length; i++) {
      await db.from('Folder').update({ position: i }).eq('id', folderIds[i]).eq('userId', userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering folders:', error)
    return NextResponse.json(
      { error: 'Failed to reorder folders' },
      { status: 500 }
    )
  }
}
