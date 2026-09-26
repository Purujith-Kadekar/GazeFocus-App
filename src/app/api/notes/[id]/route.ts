import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

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

    const existingResult = await db.from('Note').select('id').eq('id', id).eq('userId', user.id).maybeSingle()
    if (!existingResult.data) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (content !== undefined) updateData.content = content
    if (isImportant !== undefined) updateData.isImportant = isImportant
    if (timestamp !== undefined) updateData.timestampSeconds = timestamp

    const noteResult = await db.from('Note').update({ ...updateData, updatedAt: new Date().toISOString() }).eq('id', id).select('id,content,timestampSeconds,isImportant,youtubeId,createdAt,updatedAt,userId').single()

    if (noteResult.error || !noteResult.data) {
      console.error('Error updating note:', noteResult.error)
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    return NextResponse.json(noteResult.data)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
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

    const existingResult = await db.from('Note').select('id').eq('id', id).eq('userId', user.id).maybeSingle()
    if (!existingResult.data) {
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
