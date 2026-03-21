import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

// PUT /api/notes/[id] - Update a note
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
    const { content, isImportant, timestamp } = body

    if (content !== undefined && (typeof content !== 'string' || content.length > 10000)) {
      return NextResponse.json({ error: 'Note content must be 10,000 characters or fewer' }, { status: 400 })
    }

    // Verify the note belongs to this user
    const { data: existing } = await db.from('Note').select('id').eq('id', id).eq('userId', user.id).single()
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (content !== undefined) updateData.content = content
    if (isImportant !== undefined) updateData.isImportant = isImportant
    if (timestamp !== undefined) updateData.timestampSeconds = timestamp

    const { data: note, error } = await db.from('Note').update(updateData).eq('id', id).select().single()

    if (error) throw error

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    )
  }
}

// DELETE /api/notes/[id] - Delete a note
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

    // Verify the note belongs to this user
    const { data: existing } = await db.from('Note').select('id').eq('id', id).eq('userId', user.id).single()
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    await db.from('Note').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}
