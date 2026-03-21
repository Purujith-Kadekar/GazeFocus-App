'use client'

import { Bell, CheckCircle2, Clock, X } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTodoStore } from '@/store/useStore'
import type { Todo } from '@/types'

interface ReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dueTodos: Todo[]
  onDismiss: (todoId: string) => void
  onDismissAll: () => void
}

export function ReminderDialog({
  open,
  onOpenChange,
  dueTodos,
  onDismiss,
  onDismissAll,
}: ReminderDialogProps) {
  const { updateTodo } = useTodoStore()

  const handleMarkComplete = async (todo: Todo) => {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      if (res.ok) {
        const updated = await res.json()
        updateTodo(updated)
        onDismiss(todo.id)
      }
    } catch (error) {
      console.error('Failed to complete todo:', error)
    }
  }

  if (dueTodos.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Todo Reminders
          </DialogTitle>
          <DialogDescription>
            {dueTodos.length === 1
              ? 'You have a todo reminder.'
              : `You have ${dueTodos.length} todo reminders.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {dueTodos.map((todo) => {
            const overdue = todo.reminderAt && isPast(new Date(todo.reminderAt))
            return (
              <div
                key={todo.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  overdue
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${overdue ? 'text-red-900 dark:text-red-100' : 'text-foreground'}`}>
                    {todo.text}
                  </p>
                  {todo.reminderAt && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className={`h-3 w-3 shrink-0 ${overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
                      <span className={`text-xs ${
                        overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                      }`}>
                        {overdue ? 'Overdue by ' : ''}
                        {formatDistanceToNow(new Date(todo.reminderAt))}
                        {overdue ? '' : ' from now'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMarkComplete(todo)}
                    title="Mark complete"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDismiss(todo.id)}
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onDismissAll}>
            Dismiss All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
