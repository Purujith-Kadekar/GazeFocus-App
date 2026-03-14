import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

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
    const { text, reminderAt } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const parsedReminderAt = reminderAt ? new Date(reminderAt) : null
    if (reminderAt && Number.isNaN(parsedReminderAt?.getTime())) {
      return NextResponse.json({ error: 'Invalid reminder date' }, { status: 400 })
    }

    const todo = await db.todo.create({
      data: {
        text: text.trim(),
        userId: user.id,
        ...(parsedReminderAt && { reminderAt: parsedReminderAt }),
      },
    })

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
