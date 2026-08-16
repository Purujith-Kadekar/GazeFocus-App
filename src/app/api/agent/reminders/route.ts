import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { getGoogleAccount, syncTodoToGoogle } from '@/lib/calendar/google'
import {
  claimDueReminders,
  createAgentTask,
  deferReminder,
  getUpcomingReminders,
  peekDueReminders,
  skipReminder,
} from '@/lib/agent/reminders'

/**
 * GET /api/agent/reminders
 *
 * Called by the client daemon on boot and every 30 seconds.
 * Atomically claims every overdue PENDING reminder (including
 * ones that came due while the device was offline) and returns
 * them plus a peek at upcoming nag times.
 *
 * Query:
 *  ?sessionStart=<epoch ms> marks which reminders were missed
 *  offline (fired before this browser session started).
 *  ?peek=1 returns due reminders WITHOUT claiming them — used
 *  by the Electron companion, which toasts and acts via the
 *  PATCH/focus endpoints itself, leaving the web dialog as a
 *  fallback for anything unactioned.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionStartParam = request.nextUrl.searchParams.get('sessionStart')
    const sessionStart = Number(sessionStartParam)
    const sessionStartedAtMs = Number.isFinite(sessionStart) && sessionStart > 0 ? sessionStart : Date.now()
    const isPeek = request.nextUrl.searchParams.get('peek') === '1'

    const due = isPeek
      ? await peekDueReminders(user.id, sessionStartedAtMs)
      : await claimDueReminders(user.id, sessionStartedAtMs)
    const upcoming = await getUpcomingReminders(user.id)

    return NextResponse.json({ due, upcoming })
  } catch (error) {
    console.error('Error fetching agent reminders:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

/**
 * POST /api/agent/reminders
 * Body: { title, deadlineAt, firstFireAt?, source? }
 *
 * Creates the task plus its first PENDING reminder, and (when a
 * primary Google account is connected) mirrors the event into
 * Google Calendar per the single-account write rule.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, deadlineAt, firstFireAt, source } = body || {}

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (title.trim().length > 500) {
      return NextResponse.json({ error: 'Title must be 500 characters or fewer' }, { status: 400 })
    }

    const deadlineMs = deadlineAt ? Date.parse(deadlineAt) : NaN
    if (!deadlineAt || Number.isNaN(deadlineMs)) {
      return NextResponse.json({ error: 'A valid deadlineAt is required' }, { status: 400 })
    }
    if (deadlineMs <= Date.now()) {
      return NextResponse.json({ error: 'Deadline must be in the future' }, { status: 400 })
    }

    let firstFireIso: string | null = null
    if (firstFireAt) {
      const fireMs = Date.parse(firstFireAt)
      if (Number.isNaN(fireMs)) {
        return NextResponse.json({ error: 'Invalid firstFireAt' }, { status: 400 })
      }
      firstFireIso = new Date(fireMs).toISOString()
    }

    const { todo, reminder } = await createAgentTask(user.id, {
      title,
      deadlineAt: new Date(deadlineMs).toISOString(),
      firstFireAt: firstFireIso,
      source: source === 'MANUAL' ? 'MANUAL' : 'NLP',
    })

    // Mirror to Google Calendar when connected. Never blocks the
    // response on the network round-trip.
    const account = await getGoogleAccount(user.id).catch(() => null)
    if (account) {
      void syncTodoToGoogle(user.id, todo)
    }

    return NextResponse.json({ todo, reminder }, { status: 201 })
  } catch (error) {
    console.error('Error creating agent task:', error)
    return NextResponse.json({ error: 'Failed to create agent task' }, { status: 500 })
  }
}

/**
 * PATCH /api/agent/reminders
 * Body: { reminderId, action: 'defer' | 'skip' }
 *
 * defer -> "Remind me later": schedules the next nag using the
 *          dynamic compression tiers (>24h left: +4h, 4-24h: +1h,
 *          <4h: +30min).
 * skip  -> dismiss without rescheduling.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reminderId, action } = body || {}

    if (!reminderId || typeof reminderId !== 'string') {
      return NextResponse.json({ error: 'reminderId is required' }, { status: 400 })
    }
    if (action !== 'defer' && action !== 'skip') {
      return NextResponse.json({ error: 'action must be "defer" or "skip"' }, { status: 400 })
    }

    if (action === 'skip') {
      await skipReminder(user.id, reminderId)
      return NextResponse.json({ ok: true })
    }

    const next = await deferReminder(user.id, reminderId)
    if (!next) {
      return NextResponse.json({ ok: true, next: null })
    }
    return NextResponse.json({ ok: true, next: { id: next.id, fireAt: next.fireAt } })
  } catch (error) {
    console.error('Error updating agent reminder:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}
