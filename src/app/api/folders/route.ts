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

    const folders = await db.folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { position: 'asc' },
    })

    return NextResponse.json(folders)
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

    const maxPosition = await db.folder.aggregate({
      where: { userId },
      _max: { position: true },
    })

    const folder = await db.folder.create({
      data: {
        title,
        description,
        userId,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    })

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

    await db.$transaction(
      folderIds.map((id: string, index: number) =>
        db.folder.update({
          where: { id, userId },
          data: { position: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering folders:', error)
    return NextResponse.json(
      { error: 'Failed to reorder folders' },
      { status: 500 }
    )
  }
}
