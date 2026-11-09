import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

type PatchBody = {
  folderId?: string | null
  title?: string
  description?: string
}

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
    const body = (await request.json()) as PatchBody

    // Validate the target folder belongs to this user when set.
    if (body.folderId) {
      const { data: folder } = await db
        .from('Folder')
        .select('id')
        .eq('id', body.folderId)
        .eq('userId', user.id)
        .maybeSingle()
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 400 })
      }
    }

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if ('folderId' in body) update.folderId = body.folderId ?? null
    if (typeof body.title === 'string' && body.title.trim()) update.title = body.title.trim().slice(0, 300)
    if (typeof body.description === 'string') {
      const metadata = { description: body.description.trim().slice(0, 1000) || null }
      update.metadata = metadata
    }

    const { data, error } = await db
      .from('LibraryItem')
      .update(update)
      .eq('id', id)
      .eq('userId', user.id)
      .eq('type', 'LINK')
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Error updating resource:', error)
      return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data, error } = await db
      .from('LibraryItem')
      .delete()
      .eq('id', id)
      .eq('userId', user.id)
      .eq('type', 'LINK')
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Error deleting resource:', error)
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}
