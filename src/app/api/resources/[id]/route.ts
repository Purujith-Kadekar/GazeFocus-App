import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

const RESOURCE_SELECT =
  'id,userId,type,externalId,title,folderId,metadata,position,createdAt,updatedAt'

export async function PATCH(
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
    const { title, folderId } = body

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }

    if (typeof title === 'string') {
      const trimmed = title.trim()
      if (!trimmed) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      updates.title = trimmed.slice(0, 300)
    }

    if (folderId !== undefined) {
      if (folderId === null || folderId === '') {
        updates.folderId = null
      } else {
        const { data: folder } = await db
          .from('Folder')
          .select('id')
          .eq('id', folderId)
          .eq('userId', user.id)
          .maybeSingle()
        if (!folder) {
          return NextResponse.json({ error: 'Folder not found' }, { status: 400 })
        }
        updates.folderId = folderId
      }
    }

    const { data: item, error } = await db
      .from('LibraryItem')
      .update(updates)
      .eq('id', id)
      .eq('userId', user.id)
      .eq('type', 'LINK')
      .select(RESOURCE_SELECT)
      .single()

    if (error || !item) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
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

    const { error } = await db
      .from('LibraryItem')
      .delete()
      .eq('id', id)
      .eq('userId', user.id)
      .eq('type', 'LINK')

    if (error) {
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}
