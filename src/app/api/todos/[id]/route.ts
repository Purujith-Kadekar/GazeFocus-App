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

    // Use raw query to bypass client-side validation
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (text !== undefined) {
      updates.push(`text = $${paramIndex++}`)
      values.push(text)
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramIndex++}`)
      values.push(completed)
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex++}::"TodoType"`)
      values.push(type as TodoType)
    }
    if (reminderAt !== undefined) {
      updates.push(`"reminderAt" = $${paramIndex++}::timestamp`)
      values.push(parsedReminderAt ? parsedReminderAt.toISOString() : null)
    }

    if (updates.length > 0) {
      updates.push(`"updatedAt" = NOW()`)
      values.push(id)
      const query = `UPDATE "Todo" SET ${updates.join(', ')} WHERE id = $${paramIndex}`
      await db.$executeRawUnsafe(query, ...values)
    }

    const todo = await db.todo.findUnique({
      where: { id }
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
