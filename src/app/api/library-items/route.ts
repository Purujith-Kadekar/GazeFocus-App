import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const itemsResult = await db.from('LibraryItem').select('*').eq('userId', user.id).order('createdAt', { ascending: false })
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

    if (folderId) {
      const existingInFolderResult = await db.from('LibraryItem').select('id').eq('userId', user.id).eq('type', type).eq('externalId', externalId).eq('folderId', folderId).maybeSingle()
      const existingInFolder = existingInFolderResult.data

      if (existingInFolder) {
        return NextResponse.json(existingInFolder)
      }

      try {
        const itemResult = await db.from('LibraryItem').insert({
          userId: user.id,
          type,
          externalId,
          folderId,
          title: title || externalId,
        }).select().single()
        return NextResponse.json(itemResult.data, { status: 201 })
      } catch (createError: any) {
        if (createError?.code === '23505') {
          const existingResult = await db.from('LibraryItem').select('*').eq('userId', user.id).eq('type', type).eq('externalId', externalId).maybeSingle()
          return NextResponse.json(existingResult.data)
        }
        throw createError
      }
    }

    const existingItemResult = await db.from('LibraryItem').select('*').eq('userId', user.id).eq('type', type).eq('externalId', externalId).is('folderId', null).maybeSingle()
    const existingItem = existingItemResult.data

    if (existingItem) {
      return NextResponse.json(existingItem)
    }

    const itemResult = await db.from('LibraryItem').insert({
      userId: user.id,
      type,
      externalId,
      folderId: null,
      title: title || externalId,
    }).select().single()

    return NextResponse.json(itemResult.data, { status: 201 })
  } catch (error) {
    console.error('Error creating library item:', error)
    return NextResponse.json(
      { error: 'Failed to create library item' },
      { status: 500 }
    )
  }
}
