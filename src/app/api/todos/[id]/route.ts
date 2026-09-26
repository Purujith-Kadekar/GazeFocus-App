import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import {
  deleteGoogleEvent,
  getGoogleAccount,
  markGoogleEventDone,
  syncTodoToGoogle,
} from '@/lib/calendar/google'
import { TodoType, Todo } from '@/types'

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

    // Completing a task cancels its pending agent reminders.
    if (completed === true) {
      await db
        .from('Reminder')
        .update({ status: 'SKIPPED' })
        .eq('todoId', id)
        .eq('userId', user.id)
        .eq('status', 'PENDING')
        .then(() => {}, () => {})
    }

    const todoResult = await db
      .from('Todo')
      .select('id,text,type,completed,reminderAt,deadlineAt,isInFocus,source,gEventId,createdAt,updatedAt,userId')
      .eq('id', id)
      .single()

    // One-way task → Google Calendar sync: rescheduling/editing a
    // task with a due time updates its event; completing marks the
    // event done; clearing the only due time removes the event.
    // All fire-and-forget — never block the response.
    const todo = todoResult.data as unknown as Todo | null
    if (todo) {
      const account = await getGoogleAccount(user.id).catch(() => null)
      if (account) {
        if (completed === true) {
          void markGoogleEventDone(user.id, todo)
        } else if (reminderAt !== undefined && parsedReminderAt === null && !todo.deadlineAt) {
          // Reminder cleared and no deadline left → remove the event.
          void deleteGoogleEvent(user.id, todo)
        } else if (todo.reminderAt || todo.deadlineAt) {
          void syncTodoToGoogle(user.id, todo)
        }
      }
    }

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

    const existingResult = await db
      .from('Todo')
      .select('id,text,reminderAt,deadlineAt,gEventId')
      .eq('id', id)
      .eq('userId', user.id)
      .maybeSingle()
    if (!existingResult.data) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    // Keep the pre-delete snapshot for the Google Calendar cleanup.
    const existingTodo = existingResult.data as unknown as Todo

    await db.from('Todo').delete().eq('id', id)

    // One-way task → Google Calendar sync: deleting a task removes
    // its event (fire-and-forget). Reminder rows cascade-delete
    // with the Todo (migration 016: ON DELETE CASCADE).
    if (existingTodo.gEventId) {
      const account = await getGoogleAccount(user.id).catch(() => null)
      if (account) {
        void deleteGoogleEvent(user.id, existingTodo)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
