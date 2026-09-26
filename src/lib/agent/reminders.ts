// ============================================
// GazeFocus Agent — reminder state machine
// ============================================
// Server-side persistence layer for the proactive scheduling
// agent (spec Modules A + B). Every alert is a row in the
// "Reminder" table, so anything that comes due while the
// user's device is off is recovered on the next app boot
// instead of being silently lost.

import { db } from '@/lib/db'
import type { DueReminder, Reminder, Todo } from '@/types'
import { AUDIT_INTERVAL_MS, computeDeferralIso, computeInitialFireIso } from './schedule'

const TODO_COLUMNS = 'id,text,type,completed,reminderAt,deadlineAt,isInFocus,source,createdAt,updatedAt,userId'

function toDueReminder(
  reminder: Reminder,
  todo: Todo | null,
  missed: boolean
): DueReminder | null {
  if (!todo) return null
  return {
    id: reminder.id,
    todoId: todo.id,
    kind: reminder.kind,
    fireAt: reminder.fireAt,
    retryCount: reminder.retryCount,
    title: todo.text,
    deadlineAt: todo.deadlineAt,
    todoType: todo.type,
    missed,
  }
}

/**
 * Atomically claim every PENDING reminder whose fire time has
 * passed (PENDING -> FIRED in a single UPDATE ... RETURNING),
 * then return them joined with their tasks. Atomicity prevents
 * two browser tabs from both firing the same reminder.
 *
 * `missed` is true when the reminder came due before this
 * session started (the laptop-was-off recovery path).
 */
export async function claimDueReminders(userId: string, sessionStartedAtMs: number) {
  const nowIso = new Date().toISOString()

  const { data: claimed, error } = await db
    .from('Reminder')
    .update({ status: 'FIRED', firedAt: nowIso })
    .eq('userId', userId)
    .eq('status', 'PENDING')
    .lte('fireAt', nowIso)
    .select('*, Todo!inner(*)')

  if (error) throw error

  const rows = (claimed || []) as Array<Reminder & { Todo: Todo | null }>

  const due: DueReminder[] = []
  for (const row of rows) {
    const item = toDueReminder(row, row.Todo, Date.parse(row.fireAt) < sessionStartedAtMs - 60_000)
    if (item) due.push(item)
  }
  return due
}

/** Peek at upcoming PENDING reminders (for UI: "next nag at ..."). */
export async function getUpcomingReminders(userId: string, limit = 5) {
  const nowIso = new Date().toISOString()
  const { data } = await db
    .from('Reminder')
    .select('*, Todo!inner(text,deadlineAt)')
    .eq('userId', userId)
    .eq('status', 'PENDING')
    .gt('fireAt', nowIso)
    .order('fireAt', { ascending: true })
    .limit(limit)
  return (data || []).map((r: { id: string; todoId: string; kind: 'DEADLINE' | 'AUDIT'; fireAt: string; Todo?: { text: string; deadlineAt: string | null } }) => ({
    id: r.id,
    todoId: r.todoId,
    kind: r.kind,
    fireAt: r.fireAt,
    title: r.Todo?.text ?? 'Task',
    deadlineAt: r.Todo?.deadlineAt ?? null,
  }))
}

/**
 * Create a deadline task plus its first PENDING reminder.
 * Also mirrors reminderAt on the Todo row so the existing
 * calendar/dashboard views keep working.
 */
export async function createAgentTask(
  userId: string,
  input: { title: string; deadlineAt: string; firstFireAt?: string | null; source?: 'NLP' | 'MANUAL' }
): Promise<{ todo: Todo; reminder: Reminder }> {
  const now = new Date().toISOString()
  const deadlineIso = new Date(input.deadlineAt).toISOString()
  const fireIso = input.firstFireAt
    ? new Date(input.firstFireAt).toISOString()
    : computeInitialFireIso(deadlineIso)

  const todoId = crypto.randomUUID()
  const { data: todo, error: todoError } = await db
    .from('Todo')
    .insert({
      id: todoId,
      userId,
      text: input.title.trim().slice(0, 500),
      type: 'TASK',
      completed: false,
      reminderAt: fireIso,
      deadlineAt: deadlineIso,
      isInFocus: false,
      source: input.source || 'MANUAL',
      updatedAt: now,
    })
    .select(TODO_COLUMNS)
    .single()
  if (todoError) throw todoError

  const { data: reminder, error: reminderError } = await db
    .from('Reminder')
    .insert({
      id: crypto.randomUUID(),
      userId,
      todoId,
      kind: 'DEADLINE',
      status: 'PENDING',
      fireAt: fireIso,
      createdAt: now,
    })
    .select('*')
    .single()
  if (reminderError) throw reminderError

  return { todo: todo as unknown as Todo, reminder: reminder as unknown as Reminder }
}

/**
 * "Remind me later" (spec Scenario A): schedule the next nag
 * using the dynamic compression tiers based on time remaining.
 */
export async function deferReminder(userId: string, reminderId: string) {
  const { data: reminder } = await db
    .from('Reminder')
    .select('*')
    .eq('id', reminderId)
    .eq('userId', userId)
    .maybeSingle()
  if (!reminder) return null

  const { data: todo } = await db
    .from('Todo')
    .select(TODO_COLUMNS)
    .eq('id', reminder.todoId)
    .maybeSingle()
  if (!todo || todo.completed) {
    await db.from('Reminder').update({ status: 'SKIPPED' }).eq('id', reminderId)
    return null
  }

  const nextFireIso = computeDeferralIso(todo.deadlineAt)
  const now = new Date().toISOString()

  const { data: next, error } = await db
    .from('Reminder')
    .insert({
      id: crypto.randomUUID(),
      userId,
      todoId: reminder.todoId,
      kind: 'DEADLINE',
      status: 'PENDING',
      fireAt: nextFireIso,
      retryCount: (reminder.retryCount || 0) + 1,
      createdAt: now,
    })
    .select('*')
    .single()
  if (error) throw error

  // Keep the Todo.reminderAt mirror in sync for calendar display.
  await db.from('Todo').update({ reminderAt: nextFireIso, updatedAt: now }).eq('id', reminder.todoId)

  return next as unknown as Reminder
}

/** Permanently dismiss one reminder without rescheduling. */
export async function skipReminder(userId: string, reminderId: string) {
  await db
    .from('Reminder')
    .update({ status: 'SKIPPED' })
    .eq('id', reminderId)
    .eq('userId', userId)
}

/**
 * "I will do it now" (spec Scenario B): enter audit mode.
 * Sets isInFocus and schedules the first 15-minute AUDIT
 * reminder. AUDIT reminders are ordinary rows, so the loop
 * survives reloads and device restarts.
 */
export async function startFocus(userId: string, todoId: string) {
  const now = new Date().toISOString()
  const fireIso = new Date(Date.now() + AUDIT_INTERVAL_MS).toISOString()

  await db
    .from('Todo')
    .update({ isInFocus: true, updatedAt: now })
    .eq('id', todoId)
    .eq('userId', userId)

  // Replace any stale PENDING reminders for this task.
  await db
    .from('Reminder')
    .update({ status: 'SKIPPED' })
    .eq('todoId', todoId)
    .eq('userId', userId)
    .eq('status', 'PENDING')

  const { data: audit, error } = await db
    .from('Reminder')
    .insert({
      id: crypto.randomUUID(),
      userId,
      todoId,
      kind: 'AUDIT',
      status: 'PENDING',
      fireAt: fireIso,
      createdAt: now,
    })
    .select('*')
    .single()
  if (error) throw error
  return audit as unknown as Reminder
}

/** "No, keep nagging": queue the next 15-minute audit. */
export async function continueFocus(userId: string, todoId: string) {
  const now = new Date().toISOString()
  const { data: audit, error } = await db
    .from('Reminder')
    .insert({
      id: crypto.randomUUID(),
      userId,
      todoId,
      kind: 'AUDIT',
      status: 'PENDING',
      fireAt: new Date(Date.now() + AUDIT_INTERVAL_MS).toISOString(),
      createdAt: now,
    })
    .select('*')
    .single()
  if (error) throw error
  return audit as unknown as Reminder
}

/**
 * "Yes, mark complete": complete the task, kill every pending
 * reminder and clear focus state. Returns the updated todo so
 * the caller can sync the completion to Google Calendar.
 */
export async function completeFocusTodo(userId: string, todoId: string): Promise<Todo | null> {
  const now = new Date().toISOString()
  const { data: todo, error } = await db
    .from('Todo')
    .update({ completed: true, isInFocus: false, updatedAt: now })
    .eq('id', todoId)
    .eq('userId', userId)
    .select(TODO_COLUMNS)
    .single()

  await db
    .from('Reminder')
    .update({ status: 'SKIPPED' })
    .eq('todoId', todoId)
    .eq('userId', userId)
    .eq('status', 'PENDING')

  if (error) return null
  return todo as unknown as Todo
}

/**
 * User abandoned focus mode mid-audit: drop out of audit mode
 * and fall back to the standard dynamic deferral nags.
 */
export async function abandonFocus(userId: string, todoId: string) {
  const now = new Date().toISOString()

  const { data: todo } = await db
    .from('Todo')
    .select(TODO_COLUMNS)
    .eq('id', todoId)
    .eq('userId', userId)
    .maybeSingle()
  if (!todo) return null

  await db
    .from('Todo')
    .update({ isInFocus: false, updatedAt: now })
    .eq('id', todoId)
    .eq('userId', userId)

  await db
    .from('Reminder')
    .update({ status: 'SKIPPED' })
    .eq('todoId', todoId)
    .eq('userId', userId)
    .eq('status', 'PENDING')

  const nextFireIso = computeDeferralIso(todo.deadlineAt)
  const { data: next } = await db
    .from('Reminder')
    .insert({
      id: crypto.randomUUID(),
      userId,
      todoId,
      kind: 'DEADLINE',
      status: 'PENDING',
      fireAt: nextFireIso,
      createdAt: now,
    })
    .select('*')
    .single()

  await db.from('Todo').update({ reminderAt: nextFireIso, updatedAt: now }).eq('id', todoId)
  return next as unknown as Reminder | null
}
