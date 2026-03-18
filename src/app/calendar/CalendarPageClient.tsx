'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Video as VideoIcon,
  ListVideo,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  X,
  ClipboardList,
  ArrowLeft,
  RefreshCw,
  Pencil,
  Check,
  Play,
} from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
  parseISO,
} from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTodoStore, useVideoStore, usePlaylistStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import type { Todo, Video, Playlist } from '@prisma/client'

type CalendarEvent = {
  id: string
  title: string
  date: Date
  type: 'todo' | 'video' | 'playlist' | 'plan' | 'event' | 'task'
  completed?: boolean
  originalItem: Todo | Video | Playlist
}

export default function CalendarPageClient() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { todos, setTodos, removeTodo, updateTodo } = useTodoStore()
  const { videos, setVideos } = useVideoStore()
  const { playlists, setPlaylists } = usePlaylistStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [todosRes, videosRes, playlistsRes] = await Promise.all([
        fetch('/api/todos').then(r => r.json()),
        fetch('/api/videos').then(r => r.json()),
        fetch('/api/playlists').then(r => r.json()),
      ])
      setTodos(todosRes)
      setVideos(videosRes)
      setPlaylists(playlistsRes)
    } catch (error) {
      console.error('Failed to fetch calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setTodos, setVideos, setPlaylists])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Listen for external refresh events
  useEffect(() => {
    const handleRefresh = () => fetchData()
    window.addEventListener('refresh-dashboard', handleRefresh)
    window.addEventListener('refresh-calendar', handleRefresh)
    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh)
      window.removeEventListener('refresh-calendar', handleRefresh)
    }
  }, [fetchData])

  const events: CalendarEvent[] = [
    ...todos
      .filter(t => t.reminderAt)
      .map(t => ({
        id: t.id,
        title: t.text,
        date: new Date(t.reminderAt!),
        type: (t.type?.toLowerCase() || 'todo') as any,
        completed: t.completed,
        originalItem: t,
      })),
    ...videos
      .filter(v => v.scheduledAt)
      .map(v => ({
        id: v.id,
        title: v.title,
        date: new Date(v.scheduledAt!),
        type: 'video' as const,
        originalItem: v,
      })),
    ...playlists
      .filter(p => p.scheduledAt)
      .map(p => ({
        id: p.id,
        title: p.title,
        date: new Date(p.scheduledAt!),
        type: 'playlist' as const,
        originalItem: p,
      })),
  ]

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const onDateClick = (day: Date) => {
    setSelectedDate(day)
  }

  const renderHeader = () => {
    return (
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule / Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule Content or Create Plan</DialogTitle>
                </DialogHeader>
                <ScheduleContentForm 
                  videos={videos.filter(v => !v.scheduledAt)}
                  playlists={playlists.filter(p => !p.scheduledAt)}
                  selectedDate={selectedDate}
                  onSuccess={() => {
                    setIsScheduleDialogOpen(false)
                    fetchData()
                    window.dispatchEvent(new CustomEvent('refresh-dashboard'))
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-card border rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 h-8"
                onClick={() => {
                  const today = new Date()
                  setCurrentMonth(today)
                  setSelectedDate(today)
                }}
              >
                Today
              </Button>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">Tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Videos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Playlists</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-muted-foreground">Plans</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days: React.ReactElement[] = []
    const date = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {date[i]}
        </div>
      )
    }

    return <div className="grid grid-cols-7 mb-2">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows: React.ReactElement[] = []
    let days: React.ReactElement[] = []
    let day = startDate
    let formattedDate = ''

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd')
        const cloneDay = day
        const dayEvents = events.filter(e => isSameDay(e.date, cloneDay))

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[100px] border-t border-r last:border-r-0 p-2 transition-all hover:bg-muted/30 cursor-pointer flex flex-col gap-1 relative",
              !isSameMonth(day, monthStart) ? "text-muted-foreground/40 bg-muted/5" : "",
              isSameDay(day, selectedDate) ? "bg-primary/5 ring-2 ring-primary ring-inset z-10" : "",
              isToday(day) ? "bg-blue-50/30 dark:bg-blue-950/10" : ""
            )}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={cn(
                "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full transition-colors",
                isToday(day) ? "bg-primary text-primary-foreground shadow-sm" : 
                isSameDay(day, selectedDate) ? "text-primary font-bold" : ""
              )}>
                {formattedDate}
              </span>
              {dayEvents.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-semibold px-1.5 py-0.5 bg-muted rounded-full">
                  {dayEvents.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-hidden space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 border shadow-sm",
                    (event.type === 'todo' || event.type === 'task')
                      ? "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300" 
                      : event.type === 'video'
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                      : event.type === 'playlist'
                      ? "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                      : "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300",
                    event.completed ? "opacity-50 grayscale" : ""
                  )}
                >
                  {(event.type === 'todo' || event.type === 'task') && <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />}
                  {event.type === 'video' && <VideoIcon className="h-2.5 w-2.5 shrink-0" />}
                  {event.type === 'playlist' && <ListVideo className="h-2.5 w-2.5 shrink-0" />}
                  {(event.type === 'plan' || event.type === 'event') && <ClipboardList className="h-2.5 w-2.5 shrink-0" />}
                  <span className="truncate">{event.title}</span>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[9px] text-muted-foreground pl-1 font-medium italic">
                  + {dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 first:border-l last:border-b" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div className="border-l border-b rounded-xl overflow-hidden shadow-sm bg-card">{rows}</div>
  }

  const renderSidebar = () => {
    const dayEvents = events.filter(e => isSameDay(e.date, selectedDate))
    
    return (
      <div className="w-80 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex flex-col">
              <CardTitle className="text-xl">{format(selectedDate, 'EEEE')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {dayEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Nothing scheduled for today</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setIsScheduleDialogOpen(true)}
                    >
                      Schedule something
                    </Button>
                  </div>
                ) : (
                  dayEvents
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map(event => (
                    <Card key={event.id} className="overflow-hidden border-l-4 group shadow-sm transition-shadow hover:shadow-md" style={{ borderLeftColor: 
                      (event.type === 'todo' || event.type === 'task') ? '#a855f7' : 
                      event.type === 'video' ? '#3b82f6' : 
                      event.type === 'playlist' ? '#22c55e' : '#f97316'
                    }}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0 h-4 font-bold tracking-tight">
                                {event.type}
                              </Badge>
                              <div className="flex items-center text-[10px] text-muted-foreground font-medium">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(event.date, 'h:mm a')}
                              </div>
                            </div>
                            <h4 className={cn(
                              "text-sm font-semibold leading-tight",
                              event.completed && "line-through text-muted-foreground"
                            )}>
                              {event.title}
                            </h4>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingEvent(event)
                                setIsEditDialogOpen(true)
                              }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={async () => {
                                  if (event.type === 'video' || event.type === 'playlist') {
                                    await handleUnschedule(event)
                                  } else {
                                    try {
                                      const res = await fetch(`/api/todos/${event.id}`, { method: 'DELETE' })
                                      if (res.ok) {
                                        removeTodo(event.id)
                                        fetchData()
                                        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
                                      }
                                    } catch (error) {
                                      console.error('Failed to delete plan:', error)
                                    }
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                { (event.type === 'video' || event.type === 'playlist') ? 'Unschedule' : 'Delete' }
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {(event.type === 'video' || event.type === 'playlist') && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="w-full mt-3 h-8 text-xs font-semibold gap-2"
                            onClick={() => {
                              if (event.type === 'video') {
                                router.push(`/watch?v=${(event.originalItem as Video).youtubeId}`)
                              } else {
                                router.push(`/playlist/${(event.originalItem as Playlist).youtubeId}`)
                              }
                            }}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Start Now
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleUnschedule = async (event: CalendarEvent) => {
    const endpoint = event.type === 'video' ? `/api/videos/${event.id}` : `/api/playlists/${event.id}`
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: null }),
      })
      if (res.ok) {
        fetchData()
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      }
    } catch (error) {
      console.error('Failed to unschedule item:', error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {renderHeader()}
          <div className="hidden md:block">
            {renderDays()}
            {renderCells()}
          </div>
          <div className="md:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mobile View</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  For the best calendar experience, please use a larger screen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="lg:pt-[124px]">
          {renderSidebar()}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingEvent?.type === 'video' || editingEvent?.type === 'playlist' ? 'Schedule' : 'Plan'}</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <EditEventForm 
              event={editingEvent} 
              onSuccess={() => {
                setIsEditDialogOpen(false)
                fetchData()
                window.dispatchEvent(new CustomEvent('refresh-dashboard'))
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ScheduleContentForm({ 
  videos, 
  playlists, 
  selectedDate, 
  onSuccess 
}: { 
  videos: Video[], 
  playlists: Playlist[], 
  selectedDate: Date,
  onSuccess: () => void 
}) {
  const [type, setType] = useState<'video' | 'playlist' | 'PLAN' | 'EVENT'>('video')
  const [selectedId, setSelectedId] = useState('')
  const [planTitle, setPlanTitle] = useState('')
  const [time, setTypeTime] = useState('09:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    try {
      const [hours, minutes] = time.split(':')
      const scheduledDate = new Date(selectedDate)
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      if (type === 'video' || type === 'playlist') {
        if (!selectedId) return
        const endpoint = type === 'video' ? `/api/videos/${selectedId}` : `/api/playlists/${selectedId}`
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledAt: scheduledDate.toISOString() }),
        })
        if (res.ok) onSuccess()
      } else {
        if (!planTitle.trim()) return
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: planTitle.trim(), 
            reminderAt: scheduledDate.toISOString(),
            type: type
          }),
        })
        if (res.ok) onSuccess()
      }
    } catch (error) {
      console.error('Failed to schedule item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const items = type === 'video' ? videos : playlists

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setType('video'); setSelectedId(''); }}
          >
            <VideoIcon className="h-3.5 w-3.5 mr-1.5" />
            Video
          </Button>
          <Button
            type="button"
            variant={type === 'playlist' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setType('playlist'); setSelectedId(''); }}
          >
            <ListVideo className="h-3.5 w-3.5 mr-1.5" />
            Playlist
          </Button>
          <Button
            type="button"
            variant={type === 'PLAN' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setType('PLAN'); setPlanTitle(''); }}
          >
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
            Plan
          </Button>
          <Button
            type="button"
            variant={type === 'EVENT' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setType('EVENT'); setPlanTitle(''); }}
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
            Event
          </Button>
        </div>
      </div>

      {(type === 'video' || type === 'playlist') ? (
        <div className="space-y-2">
          <Label>Select {type === 'video' ? 'Video' : 'Playlist'}</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
          >
            <option value="">Select an item...</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>{type === 'PLAN' ? 'Plan' : 'Event'} Title</Label>
          <Input 
            placeholder={`Enter ${type.toLowerCase()} details...`}
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Time</Label>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTypeTime(e.target.value)}
          required
        />
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting || ( (type === 'video' || type === 'playlist') ? !selectedId : !planTitle.trim() )} 
          className="w-full h-10 font-bold"
        >
          {isSubmitting ? 'Processing...' : `Add to Calendar`}
        </Button>
      </div>
    </form>
  )
}

function EditEventForm({ event, onSuccess }: { event: CalendarEvent, onSuccess: () => void }) {
  const [title, setTitle] = useState(event.title)
  const [dateTime, setDateTime] = useState(format(event.date, "yyyy-MM-dd'T'HH:mm"))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const scheduledAt = new Date(dateTime).toISOString()
      const isContent = event.type === 'video' || event.type === 'playlist'
      const endpoint = isContent 
        ? (event.type === 'video' ? `/api/videos/${event.id}` : `/api/playlists/${event.id}`)
        : `/api/todos/${event.id}`

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isContent 
            ? { scheduledAt } 
            : { text: title, reminderAt: scheduledAt }
        ),
      })

      if (res.ok) onSuccess()
    } catch (error) {
      console.error('Failed to update event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {!(event.type === 'video' || event.type === 'playlist') && (
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
      )}
      <div className="space-y-2">
        <Label>Date & Time</Label>
        <Input 
          type="datetime-local" 
          value={dateTime} 
          onChange={(e) => setDateTime(e.target.value)} 
          required 
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
