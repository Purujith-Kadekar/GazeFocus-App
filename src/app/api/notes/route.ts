import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

// GET /api/notes - Get all notes for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { searchParams } = new URL(request.url)
    const youtubeId = searchParams.get('youtubeId')
    const importantOnly = searchParams.get('important')

    let query = db.from('Note').select('*').eq('userId', userId)
    if (youtubeId) query = query.eq('youtubeId', youtubeId)
    if (importantOnly === 'true') query = query.eq('isImportant', true)
    query = query.order('createdAt', { ascending: false })

    const { data: notes, error } = await query

    if (error) throw error

    return NextResponse.json(notes || [])
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { content, timestamp, youtubeId, isImportant } = body

    if (!content || !youtubeId) {
      return NextResponse.json(
        { error: 'Content and youtubeId are required' },
        { status: 400 }
      )
    }

    const { data: note, error } = await db.from('Note').insert({
      content,
      timestampSeconds: timestamp || 0,
      isImportant: isImportant || false,
      youtubeId,
      userId,
    }).select().single()

    if (error) throw error

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
