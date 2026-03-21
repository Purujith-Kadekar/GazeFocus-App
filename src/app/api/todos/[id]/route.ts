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
    const { text, completed, reminderAt, type } = body

    let parsedReminderAt: Date | null | undefined
    if (reminderAt !== undefined) {
      parsedReminderAt = reminderAt ? new Date(reminderAt) : null
      if (parsedReminderAt && Number.isNaN(parsedReminderAt.getTime())) {
        return NextResponse.json({ error: 'Invalid reminder date' }, { status: 400 })
      }
    }

    const { data: existing } = await db.from('Todo').select('id').eq('id', id).eq('userId', user.id).single()
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (text !== undefined) updateData.text = text
    if (completed !== undefined) updateData.completed = completed
    if (type !== undefined) updateData.type = type
    if (reminderAt !== undefined) updateData.reminderAt = parsedReminderAt ? parsedReminderAt.toISOString() : null

    const { data: todo, error } = await db.from('Todo').update(updateData).eq('id', id).select().single()

    if (error) throw error

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error updating todo:', error)
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
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

    const { data: existing } = await db.from('Todo').select('id').eq('id', id).eq('userId', user.id).single()
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    await db.from('Todo').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
