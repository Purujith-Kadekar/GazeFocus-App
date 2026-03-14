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
    const { text, completed, reminderAt } = body

    let parsedReminderAt: Date | null | undefined
    if (reminderAt !== undefined) {
      parsedReminderAt = reminderAt ? new Date(reminderAt) : null
      if (parsedReminderAt && Number.isNaN(parsedReminderAt.getTime())) {
        return NextResponse.json({ error: 'Invalid reminder date' }, { status: 400 })
      }
    }

    const existing = await db.todo.findFirst({ where: { id, userId: user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    const todo = await db.todo.update({
      where: { id },
      data: {
        ...(text !== undefined && { text }),
        ...(completed !== undefined && { completed }),
        ...(reminderAt !== undefined && {
          reminderAt: parsedReminderAt,
        }),
      },
    })

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

    const existing = await db.todo.findFirst({ where: { id, userId: user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    await db.todo.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
