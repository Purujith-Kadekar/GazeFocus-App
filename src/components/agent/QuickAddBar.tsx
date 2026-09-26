'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Sparkles, Loader2, Calendar, Check, X, AlertTriangle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTodoStore } from '@/store/useStore'
import { requestReminderNotificationPermission } from '@/lib/notifications'
import type { Todo } from '@/types'

interface ParsedPreview {
  title: string
  deadlineAt: string
  matchedText: string
}

/** Smart "when" suggestions when the user didn't type a date. */
function smartTimeChips(): { label: string; get: () => Date }[] {
  const at = (base: Date, h: number, m = 0) => {
    const d = new Date(base)
    d.setHours(h, m, 0, 0)
    return d
  }
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const saturday = new Date()
  saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7 || 7))
  const monday = new Date()
  monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7 || 7))

  const tonight = at(new Date(), 18)
  if (tonight.getTime() < Date.now()) tonight.setDate(tonight.getDate() + 1)

  return [
    { label: 'Tonight 6 PM', get: () => tonight },
    { label: 'Tomorrow 9 AM', get: () => at(tomorrow, 9) },
    { label: `Sat ${format(saturday, 'MMM d')} 10 AM`, get: () => at(saturday, 10) },
    { label: `Mon ${format(monday, 'MMM d')} 9 AM`, get: () => at(monday, 9) },
  ]
}

export function QuickAddBar() {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<ParsedPreview | null>(null)
  const [noDateFound, setNoDateFound] = useState(false)
  const [customWhen, setCustomWhen] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addTodo = useTodoStore((s) => s.addTodo)
  const todos = useTodoStore((s) => s.todos)

  // Effective draft = NLP parse result, or (title, manually-chosen time).
  const draft: ParsedPreview | null = useMemo(() => {
    if (preview) return preview
    const text = input.trim()
    if (!text || !noDateFound || text.length < 3) return null
    if (!customWhen) return null
    const ts = new Date(customWhen).getTime()
    if (Number.isNaN(ts) || ts <= Date.now()) return null
    return { title: text.slice(0, 500), deadlineAt: new Date(ts).toISOString(), matchedText: format(new Date(ts), 'MMM d, h:mm a') }
  }, [preview, input, noDateFound, customWhen])

  // Deadline-conflict detection: another open task due within ±60 min.
  const conflict = useMemo(() => {
    if (!draft) return null
    const ts = Date.parse(draft.deadlineAt)
    return (
      todos.find((t) => {
        if (t.completed || !t.deadlineAt || !t.deadlineAt) return false
        const other = Date.parse(t.deadlineAt as string)
        return !Number.isNaN(other) && Math.abs(other - ts) <= 60 * 60 * 1000
      }) || null
    )
  }, [draft, todos])

  // Debounced live NLP preview.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const text = input.trim()
    if (!text || text.length < 5) {
      setPreview(null)
      setNoDateFound(false)
      setCustomWhen('')
      return
    }

    setIsParsing(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/agent/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: text }),
        })
        if (res.ok) {
          const data = await res.json()
          setPreview(data)
          setNoDateFound(false)
          setCustomWhen('')
        } else if (res.status === 422) {
          // No date in the text — offer smart "when" chips instead of an error.
          setPreview(null)
          setNoDateFound(true)
        } else {
          setPreview(null)
          setNoDateFound(false)
        }
      } catch {
        setPreview(null)
        setNoDateFound(false)
      } finally {
        setIsParsing(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input])

  const handleCreate = useCallback(async () => {
    if (!draft) return
    setIsCreating(true)
    // The user is creating a task with a due time — the right
    // moment to ask for browser notification permission.
    requestReminderNotificationPermission()
    try {
      const res = await fetch('/api/agent/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          deadlineAt: draft.deadlineAt,
          source: 'NLP',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.todo) addTodo(data.todo as Todo)
        reset()
        window.dispatchEvent(new CustomEvent('refresh-calendar'))
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      }
    } catch (err) {
      console.error('Failed to create agent task:', err)
    } finally {
      setIsCreating(false)
    }
  }, [draft, addTodo])

  const reset = () => {
    setInput('')
    setPreview(null)
    setNoDateFound(false)
    setCustomWhen('')
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && draft && !isCreating) {
        e.preventDefault()
        void handleCreate()
      }
    },
    [draft, isCreating, handleCreate]
  )

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "Physics lab report due Friday at 4 PM"'
            className="pl-9 pr-9 h-10"
          />
          {input && (
            <button
              onClick={reset}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          size="sm"
          disabled={!draft || isCreating}
          onClick={handleCreate}
          className="gap-1.5 shrink-0"
        >
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Add Task
        </Button>
      </div>

      {/* Parsing indicator */}
      {isParsing && input.trim().length >= 5 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground px-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Parsing...
        </div>
      )}

      {/* No date found → smart "when?" suggestions (assistant behavior) */}
      {noDateFound && !isParsing && !customWhen && (
        <div className="mt-2 px-1">
          <p className="text-xs text-muted-foreground mb-1.5">
            When should I nag you about &quot;{input.trim().slice(0, 60)}&quot;?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {smartTimeChips().map((chip) => (
              <button
                key={chip.label}
                onClick={() => setCustomWhen(chip.get().toISOString())}
                className="px-2.5 py-1 text-xs rounded-full border bg-card hover:bg-accent transition-colors"
              >
                {chip.label}
              </button>
            ))}
            <label className="px-2.5 py-1 text-xs rounded-full border bg-card hover:bg-accent transition-colors cursor-pointer">
              Pick a time…
              <input
                type="datetime-local"
                className="sr-only"
                onChange={(e) => e.target.value && setCustomWhen(new Date(e.target.value).toISOString())}
              />
            </label>
          </div>
        </div>
      )}

      {/* Draft preview */}
      {draft && !isParsing && (
        <div className="mt-2 px-3 py-2 bg-muted/50 rounded-lg border animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{draft.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(draft.deadlineAt), { addSuffix: true })}
                {' · '}
                <span className="text-primary/80">{draft.matchedText}</span>
              </p>
            </div>
          </div>
          {conflict && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Heads up — this overlaps with &quot;{conflict.text.slice(0, 40)}&quot; around the same time.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
