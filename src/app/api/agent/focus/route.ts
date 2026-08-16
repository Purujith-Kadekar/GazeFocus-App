import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { markGoogleEventDone } from '@/lib/calendar/google'
import {
  abandonFocus,
  completeFocusTodo,
  continueFocus,
  startFocus,
} from '@/lib/agent/reminders'

/**
 * POST /api/agent/focus
 * Body: { todoId, action }
 *
 * action:
 *  'start'    -> "I will do it now": enter 15-minute audit mode
 *  'continue' -> "No, keep nagging": queue the next audit check
 *  'complete' -> "Yes, mark complete": finish task, kill all nags,
 *                update the Google Calendar event
 *  'abandon'  -> leave audit mode, fall back to dynamic nags
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { todoId, action } = body || {}

    if (!todoId || typeof todoId !== 'string') {
      return NextResponse.json({ error: 'todoId is required' }, { status: 400 })
    }

    const validActions = ['start', 'continue', 'complete', 'abandon'] as const
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    switch (action) {
      case 'start': {
        const audit = await startFocus(user.id, todoId)
        return NextResponse.json({ ok: true, nextAuditAt: audit?.fireAt ?? null })
      }
      case 'continue': {
        const audit = await continueFocus(user.id, todoId)
        return NextResponse.json({ ok: true, nextAuditAt: audit?.fireAt ?? null })
      }
      case 'complete': {
        const todo = await completeFocusTodo(user.id, todoId)
        if (todo) {
          // Best-effort mirror of the completion into Google Calendar.
          void markGoogleEventDone(user.id, todo)
        }
        return NextResponse.json({ ok: true, todo })
      }
      case 'abandon': {
        const next = await abandonFocus(user.id, todoId)
        return NextResponse.json({ ok: true, next: next ? { id: next.id, fireAt: next.fireAt } : null })
      }
    }
  } catch (error) {
    console.error('Error updating focus state:', error)
    return NextResponse.json({ error: 'Failed to update focus state' }, { status: 500 })
  }
}
