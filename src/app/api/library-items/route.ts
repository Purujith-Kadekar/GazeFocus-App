import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const itemsResult = await db
      .from('LibraryItem')
      .select('id,userId,type,externalId,title,folderId,metadata,position,createdAt,updatedAt')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
    const items = itemsResult.data || []

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching library items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch library items' },
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

    const body = await request.json()
    const { type, externalId, folderId, title } = body

    if (!type || !externalId) {
      return NextResponse.json(
        { error: 'Type and externalId are required' },
        { status: 400 }
      )
    }

    const validTypes = ['VIDEO', 'PLAYLIST', 'CHANNEL', 'FOLDER']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Use upsert to avoid race conditions (concurrent requests could both
    // pass the select check and both try to insert, causing a unique
    // constraint violation). If the item already exists, update its
    // folderId and title.
    const now = new Date().toISOString()
    const { data: item, error: upsertError } = await db.from('LibraryItem').upsert({
      id: crypto.randomUUID(),
      userId: user.id,
      type,
      externalId,
      folderId: folderId || null,
      title: title || externalId,
      updatedAt: now,
      createdAt: now,
    }, { onConflict: 'userId,type,externalId' }).select('id,userId,type,externalId,title,folderId,metadata,position,createdAt,updatedAt').single()

    if (upsertError) {
      console.error('Error creating library item:', upsertError)
      return NextResponse.json({ error: 'Failed to create library item' }, { status: 500 })
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating library item:', error)
    return NextResponse.json(
      { error: 'Failed to create library item' },
      { status: 500 }
    )
  }
}
