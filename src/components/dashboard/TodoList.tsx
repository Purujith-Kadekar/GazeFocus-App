'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, MoreVertical, Trash2, Circle, CheckCircle2, Bell, Clock, CalendarDays, Pencil } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTodoStore } from '@/store/useStore'
import type { Todo } from '@prisma/client'

export function TodoList() {
  const { todos, addTodo, updateTodo, removeTodo } = useTodoStore()
  const [newTodoText, setNewTodoText] = useState('')
  const [newReminderAt, setNewReminderAt] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const reminderInputRef = useRef<HTMLInputElement>(null)
  const parsedReminderDate = parseDateTimeLocalValue(newReminderAt)

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return
    if (newReminderAt && !parsedReminderDate) return

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newTodoText.trim(),
          ...(parsedReminderDate && { reminderAt: parsedReminderDate.toISOString() }),
        }),
      })
      if (res.ok) {
        const todo = await res.json()
        addTodo(todo)
        setNewTodoText('')
        setNewReminderAt('')
        setIsAdding(false)
      }
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  }

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      })
      if (res.ok) {
        const updated = await res.json()
        updateTodo(updated)
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      const res = await fetch(`/api/todos/${todoId}`, { method: 'DELETE' })
      if (res.ok) {
        removeTodo(todoId)
      }
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  const handleEditTodo = async (
    todo: Todo,
    updates: { text: string; reminderAt: string | null }
  ) => {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) return false

      const updated = await res.json()
      updateTodo(updated)
      return true
    } catch (error) {
      console.error('Failed to edit todo:', error)
      return false
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTodo()
    if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTodoText('')
      setNewReminderAt('')
    }
  }

  const openReminderPicker = () => {
    const input = reminderInputRef.current
    if (!input) return

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.click()
    input.focus()
  }

  const pendingTodos = todos.filter((t) => !t.completed)
  const completedTodos = todos.filter((t) => t.completed)
  const shouldScrollTodos = todos.length > 4
  const reminderMinValue = toLocalDateTimeInputValue(new Date())
  const isReminderInvalid = Boolean(newReminderAt) && !parsedReminderDate

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-1.5 px-4">
        <CardTitle className="text-base">
          Todos
          {todos.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({todos.length})
            </span>
          )}
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0 pb-2 px-4">
        {isAdding && (
          <div className="space-y-2 mb-2">
            <div className="flex gap-2">
              <Input
                placeholder="Add a todo..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleAddTodo} disabled={!newTodoText.trim()}>
                Add
              </Button>
            </div>
            <div className="rounded-md border bg-muted/30 p-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">Reminder</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={openReminderPicker}>
                    <CalendarDays className="h-3.5 w-3.5 mr-1" />
                    Pick
                  </Button>
                  {newReminderAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setNewReminderAt('')}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <Input
                ref={reminderInputRef}
                type="datetime-local"
                value={newReminderAt}
                onChange={(e) => setNewReminderAt(e.target.value)}
                className="h-8 text-xs"
                min={reminderMinValue}
                step={60}
              />
            </div>
            <p className={`text-[11px] pl-5 ${isReminderInvalid ? 'text-destructive' : 'text-muted-foreground'}`}>
              {newReminderAt
                ? parsedReminderDate
                  ? `Reminder set for ${format(parsedReminderDate, 'MMM d, h:mm a')}`
                  : 'Please select a valid date and time'
                : 'Optional reminder'}
            </p>
          </div>
        )}

        <div className={`${shouldScrollTodos ? 'max-h-[176px] pr-1' : ''} overflow-y-auto`}>
          <div className="space-y-2">
            {pendingTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleComplete}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
              />
            ))}

            {completedTodos.length > 0 && pendingTodos.length > 0 && (
              <p className="text-xs text-muted-foreground pt-2">Completed</p>
            )}

            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleComplete}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
              />
            ))}

            {todos.length === 0 && !isAdding && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No todos yet
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function toLocalDateTimeInputValue(date: Date) {
  const offsetInMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetInMs).toISOString().slice(0, 16)
}

function parseDateTimeLocalValue(value: string) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
}: {
  todo: Todo
  onToggle: (todo: Todo) => void
  onEdit: (todo: Todo, updates: { text: string; reminderAt: string | null }) => Promise<boolean>
  onDelete: (id: string) => void
}) {
  const isOverdue = todo.reminderAt && !todo.completed && isPast(new Date(todo.reminderAt))
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [editReminderAt, setEditReminderAt] = useState(
    todo.reminderAt ? toLocalDateTimeInputValue(new Date(todo.reminderAt)) : ''
  )
  const editReminderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setEditText(todo.text)
      setEditReminderAt(todo.reminderAt ? toLocalDateTimeInputValue(new Date(todo.reminderAt)) : '')
    }
  }, [todo, isEditing])

  const parsedEditReminderDate = parseDateTimeLocalValue(editReminderAt)
  const isEditReminderInvalid = Boolean(editReminderAt) && !parsedEditReminderDate

  const openEditReminderPicker = () => {
    const input = editReminderInputRef.current
    if (!input) return

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.click()
    input.focus()
  }

  const startEditing = () => {
    setEditText(todo.text)
    setEditReminderAt(todo.reminderAt ? toLocalDateTimeInputValue(new Date(todo.reminderAt)) : '')
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim() || isEditReminderInvalid || isSaving) return

    setIsSaving(true)
    const didSave = await onEdit(todo, {
      text: editText.trim(),
      reminderAt: parsedEditReminderDate ? parsedEditReminderDate.toISOString() : null,
    })
    setIsSaving(false)

    if (didSave) {
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditText(todo.text)
    setEditReminderAt(todo.reminderAt ? toLocalDateTimeInputValue(new Date(todo.reminderAt)) : '')
    setIsEditing(false)
  }

  const editReminderMinValue = toLocalDateTimeInputValue(new Date())

  return (
    <div className={`group flex items-start gap-2 p-2 rounded-lg transition-all ${
      isOverdue
        ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
        : 'bg-muted/50'
    }`}>
      <button onClick={() => onToggle(todo)} className="mt-0.5 shrink-0">
        {todo.completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className={`h-4 w-4 ${isOverdue ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="h-8 text-sm"
              placeholder="Todo text"
            />
            <div className="rounded-md border bg-muted/30 p-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">Reminder</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={openEditReminderPicker}>
                    <CalendarDays className="h-3.5 w-3.5 mr-1" />
                    Pick
                  </Button>
                  {editReminderAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setEditReminderAt('')}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <Input
                ref={editReminderInputRef}
                type="datetime-local"
                value={editReminderAt}
                onChange={(e) => setEditReminderAt(e.target.value)}
                className="h-8 text-xs"
                min={editReminderMinValue}
                step={60}
              />
            </div>
            <p className={`text-[11px] ${isEditReminderInvalid ? 'text-destructive' : 'text-muted-foreground'}`}>
              {editReminderAt
                ? parsedEditReminderDate
                  ? `Reminder set for ${format(parsedEditReminderDate, 'MMM d, h:mm a')}`
                  : 'Please select a valid date and time'
                : 'No reminder'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleSaveEdit}
                disabled={!editText.trim() || isEditReminderInvalid || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : isOverdue ? 'text-red-900 dark:text-red-100' : 'text-foreground'}`}>
              {todo.text}
            </p>
            {todo.reminderAt && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className={`h-3 w-3 shrink-0 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] ${
                  isOverdue
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : 'text-muted-foreground'
                }`}>
                  {isOverdue ? 'Overdue: ' : ''}
                  {format(new Date(todo.reminderAt), 'MMM d, h:mm a')}
                </span>
              </div>
            )}
          </>
        )}
      </div>
      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggle(todo)}>
              {todo.completed ? (
                <>
                  <Circle className="h-4 w-4 mr-2" />
                  Mark incomplete
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark complete
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(todo.id)}
              className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
