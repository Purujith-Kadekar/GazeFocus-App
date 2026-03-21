import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import { TodoType } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const todos = await db.todo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(todos)
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

    // Use raw query to bypass client-side validation since prisma generate is failing on Windows
    const textTrimmed = text.trim()
    const todoType = (type as TodoType) || TodoType.TASK
    const reminderIso = parsedReminderAt ? parsedReminderAt.toISOString() : null

    const { randomUUID } = await import('crypto')
    const todoId = randomUUID()

    await db.$executeRaw`
      INSERT INTO "Todo" (id, text, "userId", type, "reminderAt", "updatedAt")
      VALUES (${todoId}, ${textTrimmed}, ${user.id}, ${todoType}::"TodoType", ${reminderIso}::timestamp, NOW())`

    const todo = await db.todo.findUnique({
      where: { id: todoId }
    })

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
