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
    const folders = (foldersResult.data || [])
      // Defensive: never let a row without a usable id reach the client —
      // that's what was crashing every folders.map(f => f.id) on the frontend.
      .filter((f: { id?: string } | null) => Boolean(f && typeof f.id === 'string'))
      .map(f => ({
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

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must not be empty' },
        { status: 400 }
      )
    }

    const maxPositionResult = await db.from('Folder').select('position').eq('userId', userId).order('position', { ascending: false }).limit(1)
    const maxPosition = maxPositionResult.data?.[0]?.position ?? -1

    const folderResult = await db.from('Folder').insert({
      // The Folder table has no DB-level id default (Prisma generated
      // ids client-side before the Supabase migration) — supply one.
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description?.trim() || null,
      userId,
      position: maxPosition + 1,
    }).select('id,title,description,position,userId,createdAt,updatedAt').single()

    if (folderResult.error) {
      console.error('Folder insert failed:', folderResult.error)
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
    }

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

    if (!folderIds || !Array.isArray(folderIds) || folderIds.length === 0) {
      return NextResponse.json(
        { error: 'folderIds array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate that all folderIds belong to the current user
    const ownedFoldersResult = await db.from('Folder').select('id').eq('userId', userId).in('id', folderIds)
    const ownedFolderIds = new Set<string>((ownedFoldersResult.data || []).map((f: any) => f.id))
    
    const unauthorizedIds = folderIds.filter(id => !ownedFolderIds.has(id))
    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: 'Some folders do not belong to the current user' },
        { status: 403 }
      )
    }

    // Parallel batch update instead of sequential loop
    const updates = folderIds.map((id: string, index: number) =>
      db.from('Folder').update({ position: index }).eq('id', id).eq('userId', userId)
    )
    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering folders:', error)
    return NextResponse.json(
      { error: 'Failed to reorder folders' },
      { status: 500 }
    )
  }
}
