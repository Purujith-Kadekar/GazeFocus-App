import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const foldersResult = await db.from('Folder').select('id,title,description,position,userId,createdAt,updatedAt,items:LibraryItem(id)').eq('userId', userId).order('position', { ascending: true })
    const folders = (foldersResult.data || []).map(f => ({
      ...f,
      _count: { items: f.items?.length || 0 },
    }))

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

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

    const maxPositionResult = await db.from('Folder').select('position').eq('userId', userId).order('position', { ascending: false }).limit(1)
    const maxPosition = maxPositionResult.data?.[0]?.position ?? -1

    const folderResult = await db.from('Folder').insert({
      title,
      description,
      userId,
      position: maxPosition + 1,
    }).select('id,title,description,position,userId,createdAt,updatedAt').single()

    return NextResponse.json(folderResult.data, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}

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
