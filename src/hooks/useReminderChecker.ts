'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { isPast } from 'date-fns'
import { useTodoStore } from '@/store/useStore'
import type { Todo } from '@prisma/client'

const CHECK_INTERVAL = 30_000

export function useReminderChecker() {
  const shownRef = useRef<Set<string>>(new Set())
  const [dueTodos, setDueTodos] = useState<Todo[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const checkReminders = useCallback(() => {
    const { todos } = useTodoStore.getState()
    const newlyDue: Todo[] = []

    for (const todo of todos) {
      if (!todo.reminderAt || todo.completed || shownRef.current.has(todo.id)) {
        continue
      }
      if (isPast(new Date(todo.reminderAt))) {
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
  }, [])

  const dismissAll = useCallback(() => {
    setDueTodos([])
    setDialogOpen(false)
  }, [])

  return { dueTodos, dialogOpen, setDialogOpen, dismissReminder, dismissAll }
}
