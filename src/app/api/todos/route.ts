import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import { getGoogleAccount, syncTodoToGoogle } from '@/lib/calendar/google'
import type { Todo } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: todos } = await db
      .from('Todo')
      .select('id,text,type,completed,reminderAt,deadlineAt,isInFocus,source,createdAt,updatedAt,userId')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })

    return NextResponse.json(todos || [])
  } catch (error) {
    console.error('Error fetching todos:', error)
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, reminderAt, type } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (typeof text !== 'string' || text.trim().length > 500) {
      return NextResponse.json({ error: 'Todo text must be 500 characters or fewer' }, { status: 400 })
    }

    const parsedReminderAt = reminderAt ? new Date(reminderAt) : null
    if (reminderAt && Number.isNaN(parsedReminderAt?.getTime())) {
      return NextResponse.json({ error: 'Invalid reminder date' }, { status: 400 })
    }

    const todoType = type || 'TASK'
    const reminderIso = parsedReminderAt ? parsedReminderAt.toISOString() : null

    const { data: todo, error } = await db.from('Todo').insert({
      id: crypto.randomUUID(),
      text: text.trim(),
      userId: user.id,
      type: todoType,
      completed: false,
      reminderAt: reminderIso,
    }).select('id,text,type,completed,reminderAt,deadlineAt,isInFocus,source,gEventId,createdAt,updatedAt,userId').single()

    if (error) throw error

    // Mirror a task created with a due time into the connected
    // Google Calendar (one-way task → event sync). Fire-and-
    // forget: never block the response on the network round-trip.
    if (reminderIso) {
      const account = await getGoogleAccount(user.id).catch(() => null)
      if (account) {
        void syncTodoToGoogle(user.id, todo as unknown as Todo)
      }
    }

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
