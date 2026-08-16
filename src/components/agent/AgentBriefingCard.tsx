'use client'

import { useMemo, useState, useEffect } from 'react'
import { format, formatDistanceToNow, isToday } from 'date-fns'
import {
  Sparkles,
  AlertTriangle,
  CalendarClock,
  Crosshair,
  Zap,
  ChevronDown,
  ChevronUp,
  Bell,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAgentStore, useAuthStore, useTodoStore } from '@/store/useStore'
import type { Todo } from '@/types'

const DISMISS_KEY = 'gazefocus:briefing-dismissed'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Burning the midnight oil'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstName(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) return name.trim().split(' ')[0]
  if (email) return email.split('@')[0]
  return 'there'
}

/**
 * The agent's daily voice on the dashboard: a greeting, a
 * situation summary (overdue / due today / in focus), the
 * single highest-urgency task it recommends starting now, and
 * when the next nag fires. Dismissing hides it until tomorrow.
 */
export function AgentBriefingCard() {
  const [mounted, setMounted] = useState(false)
  const [dismissedFor, setDismissedFor] = useState<string | null>(null)
  const [starting, setStarting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const todos = useTodoStore((s) => s.todos)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const user = useAuthStore((s) => s.user)
  const upcoming = useAgentStore((s) => s.upcomingReminders)
  const setFocusTodoId = useAgentStore((s) => s.setFocusTodoId)

  useEffect(() => {
    setMounted(true)
    setDismissedFor(localStorage.getItem(DISMISS_KEY))
  }, [])

  const today = format(new Date(), 'yyyy-MM-dd')

  const analysis = useMemo(() => {
    const now = Date.now()
    const open = todos.filter((t) => !t.completed && t.deadlineAt)

    const overdue = open
      .filter((t) => Date.parse(t.deadlineAt!) < now)
      .sort((a, b) => Date.parse(a.deadlineAt!) - Date.parse(b.deadlineAt!))

    const dueToday = open.filter((t) => {
      const ts = Date.parse(t.deadlineAt!)
      return ts >= now && isToday(new Date(ts))
    })

    const inFocus = todos.filter((t) => !t.completed && (t as Todo).isInFocus)

    // Highest-urgency recommendation: overdue first, then soonest deadline.
    const nextUp = [...overdue, ...open
      .filter((t) => Date.parse(t.deadlineAt!) >= now)
      .sort((a, b) => Date.parse(a.deadlineAt!) - Date.parse(b.deadlineAt!))
    ].find((t) => !inFocus.some((f) => f.id === t.id)) || null

    return { overdue, dueToday, inFocus, nextUp }
  }, [todos])

  const nextNag = upcoming.length > 0 ? upcoming[0] : null

  const handleStart = async (todoId: string) => {
    setStarting(todoId)
    try {
      const res = await fetch('/api/agent/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, action: 'start' }),
      })
      if (res.ok) {
        setFocusTodoId(todoId)
        const todo = todos.find((t) => t.id === todoId)
        if (todo) updateTodo({ ...todo, isInFocus: true } as Todo)
      }
    } catch (err) {
      console.error('Failed to start focus from briefing:', err)
    } finally {
      setStarting(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, today)
    setDismissedFor(today)
  }

  if (!mounted || dismissedFor === today) return null

  const name = firstName(user?.name, user?.email)
  const { overdue, dueToday, inFocus, nextUp } = analysis
  const nothingPending = overdue.length === 0 && dueToday.length === 0 && inFocus.length === 0

  return (
    <Card className="reveal-stagger-item border-l-4" style={{ borderLeftColor: '#D4870A' }}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              {greeting()}, {name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {nothingPending ? (
                <>Nothing is due today — your agent is watching your deadlines. Add a task, or enjoy the calm.</>
              ) : (
                <>
                  You have{' '}
                  {overdue.length > 0 && (
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {overdue.length} overdue{dueToday.length + inFocus.length > 0 ? ', ' : ''}
                    </span>
                  )}
                  {dueToday.length > 0 && (
                    <span className="font-medium">
                      {dueToday.length} due today{inFocus.length > 0 ? ', ' : ''}
                    </span>
                  )}
                  {inFocus.length > 0 && (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {inFocus.length} in focus mode
                    </span>
                  )}
                  .
                </>
              )}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="shrink-0 text-xs text-muted-foreground">
            Dismiss
          </Button>
        </div>

        {!nothingPending && (
          <div className="mt-4 space-y-2">
            {/* Recommended next action */}
            {nextUp && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Zap className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">I&apos;d start with</p>
                  <p className="text-sm font-medium truncate">{nextUp.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {Date.parse(nextUp.deadlineAt!) < Date.now()
                      ? <span className="text-red-600 dark:text-red-400 font-medium">Overdue</span>
                      : `Due ${formatDistanceToNow(new Date(nextUp.deadlineAt!), { addSuffix: true })}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={starting === nextUp.id}
                  onClick={() => handleStart(nextUp.id)}
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  {starting === nextUp.id ? 'Starting…' : 'Start now'}
                </Button>
              </div>
            )}

            {/* In-focus tasks */}
            {inFocus.slice(0, 2).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                <Crosshair className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.text}</p>
                  <p className="text-xs text-muted-foreground">In focus mode — I check in every 15 min</p>
                </div>
                <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-700 dark:text-amber-300">
                  tracking
                </Badge>
              </div>
            ))}

            {/* Details toggle */}
            {(overdue.length > 0 || dueToday.length > 1 || nextNag) && (
              <>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {expanded ? 'Hide details' : 'Show all today & overdue'}
                </button>

                {expanded && (
                  <div className="space-y-1.5 pt-1">
                    {[...overdue, ...dueToday].map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-muted/40">
                        {Date.parse(t.deadlineAt!) < Date.now() ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        ) : (
                          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate flex-1">{t.text}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(t.deadlineAt!), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Next scheduled nag */}
            {nextNag && !nextUp && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Bell className="h-3 w-3" />
                Next check-in: &quot;{nextNag.title}&quot; {formatDistanceToNow(new Date(nextNag.fireAt), { addSuffix: true })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
