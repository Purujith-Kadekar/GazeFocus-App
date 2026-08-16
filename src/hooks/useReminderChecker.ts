'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { isPast } from 'date-fns'
import { useTodoStore } from '@/store/useStore'
import type { Todo } from '@/types'

const CHECK_INTERVAL = 30_000

export function useReminderChecker() {
  const shownRef = useRef<Set<string>>(new Set<string>())
  const [dueTodos, setDueTodos] = useState<Todo[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const checkReminders = useCallback(() => {
    const { todos } = useTodoStore.getState()
    const newlyDue: Todo[] = []

    for (const todo of todos) {
      if (!todo.reminderAt || todo.completed || shownRef.current.has(todo.id)) {
        continue
      }

      // Agent-managed tasks (with deadlines) are handled by the
      // agent daemon's Reminder rows — skip them here to avoid
      // double dialogs.
      if (todo.deadlineAt) {
        continue
      }

      const reminderTime = new Date(todo.reminderAt)
      if (isPast(reminderTime)) {
        newlyDue.push(todo)
        shownRef.current.add(todo.id)
      }
    }

    if (newlyDue.length > 0) {
      setDueTodos(prev => [...prev, ...newlyDue])
      setDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    const initialTimeout = setTimeout(checkReminders, 2000)
    const interval = setInterval(checkReminders, CHECK_INTERVAL)
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [checkReminders])

  useEffect(() => {
    const unsub = useTodoStore.subscribe((state) => {
      setDueTodos(prev =>
        prev.filter(dt =>
          state.todos.some(t => t.id === dt.id && !t.completed)
        )
      )
    })
    return unsub
  }, [])

  const dismissReminder = useCallback((todoId: string) => {
    setDueTodos(prev => prev.filter(t => t.id !== todoId))
    // Already in shownRef.current from the check loop
  }, [])

  const dismissAll = useCallback(() => {
    // Make sure all current ones are added to shownRef so they don't pop up again next interval
    dueTodos.forEach(t => shownRef.current.add(t.id))
    setDueTodos([])
    setDialogOpen(false)
  }, [dueTodos])

  return { dueTodos, dialogOpen, setDialogOpen, dismissReminder, dismissAll }
}
