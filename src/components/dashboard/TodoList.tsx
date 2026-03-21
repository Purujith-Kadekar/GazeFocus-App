'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, MoreVertical, Trash2, Circle, CheckCircle2, Bell, Clock, CalendarDays, Pencil, Play, ListVideo, Film, ClipboardList, X, Check } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTodoStore, useVideoStore, usePlaylistStore } from '@/store/useStore'
import type { Todo, Video, Playlist } from '@/types'

type UnifiedItem = {
  id: string
  text: string
  completed: boolean
  reminderAt: Date | null
  type: 'TASK' | 'PLAN' | 'EVENT' | 'VIDEO' | 'PLAYLIST'
  originalItem: Todo | Video | Playlist
}

export function TodoList() {
  const router = useRouter()
  const { todos, addTodo, updateTodo, removeTodo } = useTodoStore()
  const { videos } = useVideoStore()
  const { playlists } = usePlaylistStore()
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
          reminderAt: parsedReminderDate ? parsedReminderDate.toISOString() : null,
          type: 'TASK',
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

  // Combine todos with scheduled items for a unified view
  const unifiedItems: UnifiedItem[] = [
    ...todos.map(t => ({
      id: t.id,
      text: t.text,
      completed: t.completed,
      reminderAt: t.reminderAt ? new Date(t.reminderAt) : null,
      type: (t as any).type as any || 'TASK',
      originalItem: t
    })),
    ...videos.filter(v => v.scheduledAt).map(v => ({
      id: v.id,
      text: v.title,
      completed: false,
      reminderAt: new Date(v.scheduledAt!),
      type: 'VIDEO' as const,
      originalItem: v
    })),
    ...playlists.filter(p => p.scheduledAt).map(p => ({
      id: p.id,
      text: p.title,
      completed: false,
      reminderAt: new Date(p.scheduledAt!),
      type: 'PLAYLIST' as const,
      originalItem: p
    }))
  ].sort((a, b) => {
    // Sort by reminder time first
    if (a.reminderAt && b.reminderAt) return a.reminderAt.getTime() - b.reminderAt.getTime()
    if (a.reminderAt) return -1
    if (b.reminderAt) return 1
    return 0
  })

  const pendingItems = unifiedItems.filter((t) => !t.completed)
  const completedItems = unifiedItems.filter((t) => t.completed)
  const shouldScroll = unifiedItems.length > 4
  const reminderMinValue = toLocalDateTimeInputValue(new Date())

  return (
    <Card className="h-[280px] flex flex-col overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-1 px-4 shrink-0 bg-muted/5">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 leading-tight">
          <CalendarDays className="h-4 w-4 text-primary" />
          Schedule & Tasks
          {unifiedItems.length > 0 && (
            <span className="ml-2 text-[11px] font-normal text-muted-foreground align-middle">
              ({unifiedItems.length})
            </span>
          )}
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0 pb-1 px-2 flex-1 flex flex-col min-h-0">
        {isAdding && (
          <div className="space-y-2 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2">
              <Input
                placeholder="Add a task..."
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
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-1 py-1 px-1">
            {pendingItems.map((item) => (
              <UnifiedTodoItem
                key={`${item.type}-${item.id}`}
                item={item}
                onToggle={() => item.type !== 'VIDEO' && item.type !== 'PLAYLIST' && handleToggleComplete(item.originalItem as Todo)}
                onEdit={async (updates) => {
                  if (item.type !== 'VIDEO' && item.type !== 'PLAYLIST') {
                    return await handleEditTodo(item.originalItem as Todo, updates)
                  } else {
                    const endpoint = item.type === 'VIDEO' ? `/api/videos/${item.id}` : `/api/playlists/${item.id}`
                    const res = await fetch(endpoint, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        scheduledAt: updates.reminderAt ? new Date(updates.reminderAt).toISOString() : null
                      }),
                    })
                    if (res.ok) {
                      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
                      window.dispatchEvent(new CustomEvent('refresh-calendar'))
                      return true
                    }
                  }
                  return false
                }}
                onDelete={() => {
                  if (item.type !== 'VIDEO' && item.type !== 'PLAYLIST') {
                    handleDeleteTodo(item.id)
                  } else {
                    const endpoint = item.type === 'VIDEO' ? `/api/videos/${item.id}` : `/api/playlists/${item.id}`
                    fetch(endpoint, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ scheduledAt: null }),
                    }).then(res => {
                      if (res.ok) {
                        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
                        window.dispatchEvent(new CustomEvent('refresh-calendar'))
                      }
                    })
                  }
                }}
              />
            ))}

            {completedItems.length > 0 && pendingItems.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2">Completed</p>
            )}

            {completedItems.map((item) => (
              <UnifiedTodoItem
                key={`${item.type}-${item.id}`}
                item={item}
                onToggle={() => handleToggleComplete(item.originalItem as Todo)}
                onEdit={async (updates) => await handleEditTodo(item.originalItem as Todo, updates)}
                onDelete={() => handleDeleteTodo(item.id)}
              />
            ))}

            {unifiedItems.length === 0 && !isAdding && (
              <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                <ClipboardList className="h-8 w-8 mb-2" />
                <p className="text-sm">No tasks or scheduled items</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function UnifiedTodoItem({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: UnifiedItem
  onToggle: () => void
  onEdit: (updates: { text: string; reminderAt: string | null }) => Promise<boolean>
  onDelete: () => void
}) {
  const router = useRouter()
  const isOverdue = item.reminderAt && !item.completed && isPast(item.reminderAt)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editText, setEditText] = useState(item.text)
  const [editReminderAt, setEditReminderAt] = useState(
    item.reminderAt ? toLocalDateTimeInputValue(item.reminderAt) : ''
  )
  const editReminderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setEditText(item.text)
      setEditReminderAt(item.reminderAt ? toLocalDateTimeInputValue(item.reminderAt) : '')
    }
  }, [item, isEditing])

  const handleAction = () => {
    if (item.type === 'VIDEO') {
      router.push(`/watch?v=${(item.originalItem as Video).youtubeId}`)
    } else if (item.type === 'PLAYLIST') {
      router.push(`/playlist/${(item.originalItem as Playlist).youtubeId}`)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const success = await onEdit({
      text: editText,
      reminderAt: editReminderAt || null
    })
    setIsSaving(false)
    if (success) setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-2 rounded-lg border bg-accent/50 space-y-2 animate-in fade-in duration-200">
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="h-7 text-xs"
          placeholder="Task title..."
          disabled={item.type === 'VIDEO' || item.type === 'PLAYLIST'}
        />
        <div className="flex gap-2">
          <Input
            type="datetime-local"
            value={editReminderAt}
            onChange={(e) => setEditReminderAt(e.target.value)}
            className="h-7 text-[10px] flex-1"
          />
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="default" className="h-7 w-7" onClick={handleSave} disabled={isSaving}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`group flex items-start gap-2 p-2 rounded-lg transition-all border ${isOverdue
        ? 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700'
        : 'bg-muted/30 border-transparent hover:border-muted-foreground/20'
      }`}>
      {(item.type === 'VIDEO' || item.type === 'PLAYLIST') ? (
        <Button size="icon" variant="ghost" className="h-5 w-5 mt-0.5 shrink-0" onClick={handleAction}>
          {item.type === 'VIDEO' ? <Film className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> : <ListVideo className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />}
        </Button>
      ) : (
        <button onClick={onToggle} className="mt-0.5 shrink-0">
          {item.completed ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className={`h-4 w-4 ${isOverdue ? 'text-red-900 dark:text-red-100' : 'text-muted-foreground'}`} />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge variant="outline" className={cn(
              "text-[9px] px-1 py-0 h-3.5 uppercase font-bold bg-background/50",
              item.type === 'VIDEO' && "text-blue-700 border-blue-500/30",
              item.type === 'PLAYLIST' && "text-green-700 border-green-500/30",
              item.type === 'PLAN' && "text-orange-700 border-orange-500/30",
              item.type === 'EVENT' && "text-red-700 border-red-500/30",
            )}>
              {item.type}
            </Badge>
            {item.reminderAt && (
              <span className={cn(
                "text-[10px] font-bold flex items-center gap-1",
                isOverdue ? "text-red-900 dark:text-red-100" : "text-muted-foreground"
              )}>
                <Clock className="h-2.5 w-2.5" />
                {format(item.reminderAt, 'MMM d, h:mm a')}
              </span>
            )}
          </div>
          <p className={cn(
            "text-sm font-medium line-clamp-2",
            item.completed && "line-through text-muted-foreground/60",
            isOverdue && !item.completed ? "text-red-950 dark:text-white" : "text-foreground"
          )}>
            {item.text}
          </p>
        </div>
      </div>

      <div className="flex items-start">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground",
                isOverdue && "text-red-900 dark:text-red-100"
              )}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {(item.type === 'VIDEO' || item.type === 'PLAYLIST') ? (
              <>
                <DropdownMenuItem onClick={handleAction}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete}>
                  <X className="h-4 w-4 mr-2" />
                  Unschedule
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => onToggle()}>
                  {item.completed ? 'Mark incomplete' : 'Mark complete'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
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
