import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { sendAgentDigestEmail } from '@/lib/agent/email'
import type { DueReminder, Todo } from '@/types'

/**
 * POST /api/cron/agent-email
 *
 * Called by the scheduled workflow (GitHub Actions, every 15
 * minutes). Finds every reminder whose fire time has passed
 * and that hasn't been emailed yet, sends each user ONE
 * digest email, and stamps emailSentAt.
 *
 * Email is an ALWAYS-ON channel: it sends whether or not the
 * in-app daemon / Electron companion already claimed the
 * reminder, because the user may be away from whatever machine
 * displayed the toast. Only explicitly SKIPPED reminders and
 * completed tasks are excluded. Reminders stay PENDING until
 * the interactive surfaces claim them.
 */

const MAX_USERS_PER_RUN = 100

interface ReminderRow extends ReminderLite {
  Todo: Todo | null
}
interface ReminderLite {
  id: string
  todoId: string
  kind: 'DEADLINE' | 'AUDIT'
  fireAt: string
  retryCount: number
  userId: string
}
interface UserLite {
  id: string
  email: string | null
  name: string | null
  isBlocked: boolean
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured - agent-email endpoint disabled')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const expected = `Bearer ${cronSecret}`
    const isAuthed =
      authHeader &&
      expected.length === authHeader.length &&
      timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      // Not an error — email channel simply not configured.
      return NextResponse.json({ ok: true, skipped: 'smtp-not-configured', emailed: 0 })
    }

    const nowIso = new Date().toISOString()

    // Overdue, un-emailed reminders for incomplete tasks.
    // IMPORTANT: email fires regardless of whether the browser
    // daemon or the Electron companion already claimed the
    // reminder (status FIRED) — the user may be away from the
    // machine that showed the toast, so email ALWAYS delivers.
    // SKIPPED (explicitly dismissed) reminders are excluded.
    const { data: rows, error } = await db
      .from('Reminder')
      .select('id,todoId,kind,fireAt,retryCount,userId,Todo!inner(id,text,completed,deadlineAt,type)')
      .in('status', ['PENDING', 'FIRED'])
      .lte('fireAt', nowIso)
      .is('emailSentAt', null)
      .order('fireAt', { ascending: true })
      .limit(500)

    if (error) throw error
    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: true, emailed: 0 })
    }

    const reminderRows = rows as unknown as ReminderRow[]

    // Group by user, keeping only reminders whose task is still open.
    const byUser = new Map<string, DueReminder[]>()
    for (const row of reminderRows) {
      const todo = row.Todo
      if (!todo || todo.completed) continue
      const list = byUser.get(row.userId) || []
      list.push({
        id: row.id,
        todoId: todo.id,
        kind: row.kind,
        fireAt: row.fireAt,
        retryCount: row.retryCount || 0,
        title: todo.text,
        deadlineAt: todo.deadlineAt ?? null,
        todoType: todo.type ?? 'TASK',
        missed: true,
      })
      byUser.set(row.userId, list)
    }

    // Look up recipient emails.
    const userIds = [...byUser.keys()].slice(0, MAX_USERS_PER_RUN)
    if (userIds.length === 0) {
      return NextResponse.json({ ok: true, emailed: 0 })
    }

    const { data: users } = await db
      .from('User')
      .select('id,email,name,isBlocked')
      .in('id', userIds)

    const userMap = new Map<string, UserLite>(
      ((users || []) as UserLite[]).map((u) => [u.id, u])
    )

    let emailed = 0
    let sentReminders = 0
    const failures: string[] = []

    for (const userId of userIds) {
      const user = userMap.get(userId)
      const reminders = byUser.get(userId) || []
      if (!user || user.isBlocked || !user.email) continue

      const result = await sendAgentDigestEmail(user.email, user.name, reminders)
      if (result.sent) {
        emailed += 1
        sentReminders += reminders.length
        const ids = reminders.map((r) => r.id)
        await db.from('Reminder').update({ emailSentAt: nowIso }).in('id', ids)
      } else if (result.skipped === 'smtp-not-configured') {
        break
      } else {
        failures.push(userId)
      }
    }

    return NextResponse.json({
      ok: true,
      emailed,
      sentReminders,
      usersWithDue: userIds.length,
      failures: failures.length,
    })
  } catch (error) {
    console.error('Error in agent-email cron:', error)
    return NextResponse.json({ error: 'Agent email cron failed' }, { status: 500 })
  }
}
