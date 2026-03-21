import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')

    let query = db.from('LibraryItem').select('*').eq('userId', userId)
    if (folderId) query = query.eq('folderId', folderId)
    query = query.order('position', { ascending: true })

    const { data: items, error } = await query
    if (error) throw error

    return NextResponse.json(items || [])
  } catch (error) {
    console.error('Error fetching library items:', error)
    return NextResponse.json({ error: 'Failed to fetch library items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id
    const body = await request.json()
    const { folderId, type, externalId, title, metadata } = body

    if (!type || !externalId || !title) {
      return NextResponse.json({ error: 'type, externalId, and title are required' }, { status: 400 })
    }

    // Check if already exists
    const { data: existing } = await db.from('LibraryItem')
      .select('id').eq('userId', userId).eq('type', type).eq('externalId', externalId).maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Item already exists in library' }, { status: 409 })
    }

    const { data: item, error } = await db.from('LibraryItem').insert({
      userId, folderId: folderId || null, type, externalId, title, metadata: metadata || null,
    }).select().single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Item already exists in library' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating library item:', error)
    return NextResponse.json({ error: 'Failed to create library item' }, { status: 500 })
  }
}
