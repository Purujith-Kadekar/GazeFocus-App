'use client'

import { useCallback } from 'react'
import {
  Bell,
  Clock,
  AlertTriangle,
  Zap,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAgentStore, useTodoStore } from '@/store/useStore'
import type { DueReminder } from '@/types'

/**
 * Agent Inbox — the interactive surface for every due reminder.
 *
 * DEADLINE reminders offer the spec's two actions ("Remind me later"
 * / "I will do it now"); AUDIT reminders offer the 15-minute loop
 * check ("Yes, mark complete" / "No, keep nagging"). Reminders that
 * fired while the device was offline get the missed-recovery banner.
 */
export function AgentInbox() {
  const dueReminders = useAgentStore((s) => s.dueReminders)
  const removeDueReminder = useAgentStore((s) => s.removeDueReminder)
  const clearDueReminders = useAgentStore((s) => s.clearDueReminders)
  const setFocusTodoId = useAgentStore((s) => s.setFocusTodoId)
  const updateTodo = useTodoStore((s) => s.updateTodo)

  const isOpen = dueReminders.length > 0
  const missedCount = dueReminders.filter((r) => r.missed).length
  const hasMissed = missedCount > 0

  const postFocus = useCallback(
    async (todoId: string, action: 'start' | 'continue' | 'complete' | 'abandon') => {
      const res = await fetch('/api/agent/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, action }),
      })
      if (!res.ok) throw new Error(`focus ${action} failed`)
      return res.json()
    },
    []
  )

  // ── DEADLINE actions ────────────────────────────────────

  const handleDefer = useCallback(
    async (reminder: DueReminder) => {
      removeDueReminder(reminder.id)
      try {
        await fetch('/api/agent/reminders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reminderId: reminder.id, action: 'defer' }),
        })
      } catch (err) {
        console.error('Failed to defer reminder:', err)
      }
    },
    [removeDueReminder]
  )

  const handleSkip = useCallback(
    async (reminder: DueReminder) => {
      removeDueReminder(reminder.id)
      try {
        await fetch('/api/agent/reminders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reminderId: reminder.id, action: 'skip' }),
        })
      } catch (err) {
        console.error('Failed to skip reminder:', err)
      }
    },
    [removeDueReminder]
  )

  const handleStartFocus = useCallback(
    async (reminder: DueReminder) => {
      removeDueReminder(reminder.id)
      setFocusTodoId(reminder.todoId)
      try {
        await postFocus(reminder.todoId, 'start')
      } catch (err) {
        console.error('Failed to start focus:', err)
      }
    },
    [removeDueReminder, setFocusTodoId, postFocus]
  )

  const handleDismissAll = useCallback(() => {
    for (const r of dueReminders) {
      void fetch('/api/agent/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId: r.id, action: 'skip' }),
      }).catch(() => {})
    }
    clearDueReminders()
  }, [dueReminders, clearDueReminders])

  // ── AUDIT actions ───────────────────────────────────────

  const handleAuditComplete = useCallback(
    async (reminder: DueReminder) => {
      removeDueReminder(reminder.id)
      setFocusTodoId(null)
      try {
        const data = await postFocus(reminder.todoId, 'complete')
        if (data?.todo) updateTodo(data.todo)
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      } catch (err) {
        console.error('Failed to complete task:', err)
      }
    },
    [removeDueReminder, setFocusTodoId, postFocus, updateTodo]
  )

  const handleAuditContinue = useCallback(
    async (reminder: DueReminder) => {
      removeDueReminder(reminder.id)
      try {
        await postFocus(reminder.todoId, 'continue')
      } catch (err) {
        console.error('Failed to continue nagging:', err)
      }
    },
    [removeDueReminder, postFocus]
  )

  const handleAuditAbandon = useCallback(
    async (reminder: DueReminder) => {
      removeDueReminder(reminder.id)
      setFocusTodoId(null)
      try {
        await postFocus(reminder.todoId, 'abandon')
      } catch (err) {
        console.error('Failed to stop focus mode:', err)
      }
    },
    [removeDueReminder, setFocusTodoId, postFocus]
  )

  return (
    <>
      {/* Missed-while-offline banner (spec Feature 1) */}
      {isOpen && hasMissed && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg shadow-lg border border-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">
              You missed {missedCount} alert{missedCount > 1 ? 's' : ''} while offline
            </span>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismissAll() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              {hasMissed ? 'Missed Alerts Recovery' : 'GazeFocus Agent'}
            </DialogTitle>
            <DialogDescription>
              {hasMissed
                ? `Recovered ${missedCount} alert${missedCount > 1 ? 's' : ''} that came due while you were away.`
                : `${dueReminders.length} item${dueReminders.length > 1 ? 's' : ''} need your attention.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {dueReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDefer={handleDefer}
                onSkip={handleSkip}
                onStartFocus={handleStartFocus}
                onAuditComplete={handleAuditComplete}
                onAuditContinue={handleAuditContinue}
                onAuditAbandon={handleAuditAbandon}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleDismissAll}>
              Dismiss All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Per-reminder card ────────────────────────────────────

interface ReminderCardProps {
  reminder: DueReminder
  onDefer: (r: DueReminder) => void
  onSkip: (r: DueReminder) => void
  onStartFocus: (r: DueReminder) => void
  onAuditComplete: (r: DueReminder) => void
  onAuditContinue: (r: DueReminder) => void
  onAuditAbandon: (r: DueReminder) => void
}

function ReminderCard({
  reminder,
  onDefer,
  onSkip,
  onStartFocus,
  onAuditComplete,
  onAuditContinue,
  onAuditAbandon,
}: ReminderCardProps) {
  const isAudit = reminder.kind === 'AUDIT'

  return (
    <div
      className={`p-3 rounded-lg border ${
        reminder.missed
          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
          : isAudit
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
            : 'bg-muted/50 border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{reminder.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {reminder.deadlineAt && (
              <>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Deadline {formatDistanceToNow(new Date(reminder.deadlineAt), { addSuffix: true })}
                </span>
              </>
            )}
            {isAudit && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Focus check-in
              </span>
            )}
            {reminder.retryCount > 0 && (
              <span className="text-xs text-muted-foreground">· Deferred {reminder.retryCount}×</span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onSkip(reminder)}
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {isAudit ? (
          <>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onAuditComplete(reminder)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Yes, Mark Complete
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onAuditContinue(reminder)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              No, Keep Nagging
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={() => onAuditAbandon(reminder)}
            >
              <X className="h-3.5 w-3.5" />
              Stop Focus Mode
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onDefer(reminder)}
            >
              <Clock className="h-3.5 w-3.5" />
              Remind me later
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onStartFocus(reminder)}
            >
              <Zap className="h-3.5 w-3.5" />
              I&apos;ll do it now
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
