'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAgentStore, useTodoStore } from '@/store/useStore'
import { AGENT_POLL_INTERVAL_MS } from '@/lib/agent/schedule'
import type { DueReminder } from '@/types'

/**
 * Proactive scheduling daemon.
 *
 * On mount:
 *   1. Records sessionStartedAtMs so the API can tell which
 *      reminders were "missed while offline" (laptop-off logic).
 *   2. Immediately polls for due reminders.
 *   3. Starts a 30-second polling loop that atomically claims
 *      overdue PENDING reminders via the API.
 *   4. Fires a browser Notification for each newly due item.
 *
 * When the user dismisses / defers / completes a reminder through
 * the AgentInbox dialogs, those components call the PATCH / POST
 * agent API routes directly and update the store; the daemon only
 * adds new items.
 */
export function useAgentDaemon() {
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deliveredRef = useRef<Set<string>>(new Set())
  const hasBootedRef = useRef(false)

  const {
    daemonActive,
    dueReminders,
    setDaemonActive,
    setDueReminders,
    addDueReminder,
    setUpcomingReminders,
    setLastPollAt,
    initSessionStart,
    focusTodoId,
  } = useAgentStore()

  const setTodos = useTodoStore((s) => s.setTodos)

  // Request browser notification permission on first interaction.
  const requestPermission = useCallback(() => {
    if (typeof window === 'undefined') return
    if (Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  }, [])

  // Fire a native browser notification for a due reminder.
  const fireBrowserNotification = useCallback((reminder: DueReminder) => {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return

    const isAudit = reminder.kind === 'AUDIT'
    const title = isAudit
      ? 'GazeFocus: Are you done yet?'
      : reminder.missed
        ? 'GazeFocus: You missed an alert'
        : 'GazeFocus: Upcoming Deadline'

    const body = isAudit
      ? `"${reminder.title}" — have you completed this?`
      : reminder.title

    try {
      const notif = new Notification(title, {
        body,
        tag: reminder.id,
        requireInteraction: true,
      })
      notif.onclick = () => {
        window.focus()
        notif.close()
      }
    } catch {
      // Notification constructor may throw in some contexts.
    }
  }, [])

  // Core poll: call the API, push new items into the store.
  const poll = useCallback(async () => {
    try {
      const { sessionStartedAtMs } = useAgentStore.getState()
      const res = await fetch(
        `/api/agent/reminders?sessionStart=${sessionStartedAtMs}`
      )
      if (!res.ok) return

      const data = await res.json()
      const due: DueReminder[] = data.due ?? []
      const upcoming = data.upcoming ?? []

      setDueReminders(due)
      setUpcomingReminders(upcoming)
      setLastPollAt(Date.now())

      // Fire browser notifications for brand-new items.
      for (const reminder of due) {
        if (!deliveredRef.current.has(reminder.id)) {
          deliveredRef.current.add(reminder.id)
          fireBrowserNotification(reminder)
        }
      }

      // Sync todo list (the daemon may have created agent tasks).
      const todosRes = await fetch('/api/todos')
      if (todosRes.ok) {
        const todos = await todosRes.json()
        if (Array.isArray(todos)) setTodos(todos)
      }
    } catch (err) {
      console.warn('Agent daemon poll failed:', err)
    }
  }, [setDueReminders, setUpcomingReminders, setLastPollAt, setTodos, fireBrowserNotification])

  // Start / stop the polling loop.
  useEffect(() => {
    if (!daemonActive) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    // First poll immediately on activation.
    if (!hasBootedRef.current) {
      hasBootedRef.current = true
      initSessionStart()
      requestPermission()
      void poll()
    }

    pollTimerRef.current = setInterval(poll, AGENT_POLL_INTERVAL_MS)
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [daemonActive, poll, initSessionStart, requestPermission])

  // Auto-activate the daemon when the hook is mounted inside
  // an authenticated page (the middleware already guarantees auth).
  useEffect(() => {
    setDaemonActive(true)
    return () => {
      setDaemonActive(false)
    }
  }, [setDaemonActive])

  // Track deliveries so we never re-notify for the same reminder
  // within a session.
  useEffect(() => {
    for (const r of dueReminders) {
      deliveredRef.current.add(r.id)
    }
  }, [dueReminders])

  return {
    isActive: daemonActive,
    focusTodoId,
  }
}
