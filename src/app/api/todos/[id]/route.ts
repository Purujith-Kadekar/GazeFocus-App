import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import { TodoType } from '@/types'

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

    let parsedReminderAt: string | null | undefined
    if (reminderAt !== undefined) {
      if (reminderAt) {
        const date = new Date(reminderAt)
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json({ error: 'Invalid reminder date' }, { status: 400 })
        }
        parsedReminderAt = date.toISOString()
      } else {
        parsedReminderAt = null
      }
    }

    const existingResult = await db.from('Todo').select('id').eq('id', id).eq('userId', user.id).maybeSingle()
    if (!existingResult.data) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (text !== undefined) updateData.text = text
    if (completed !== undefined) updateData.completed = completed
    if (type !== undefined) updateData.type = type as TodoType
    if (reminderAt !== undefined) updateData.reminderAt = parsedReminderAt

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date().toISOString()
    }

    await db.from('Todo').update(updateData).eq('id', id)

    const todoResult = await db.from('Todo').select('*').eq('id', id).single()

    return NextResponse.json(todoResult.data)
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

    const existingResult = await db.from('Todo').select('id').eq('id', id).eq('userId', user.id).maybeSingle()
    if (!existingResult.data) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    await db.from('Todo').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
