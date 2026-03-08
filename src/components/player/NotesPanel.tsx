'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { 
  Plus, 
  Star, 
  Trash2, 
  Edit3, 
  Clock, 
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useNoteStore, usePlayerStore, useAuthStore } from '@/store/useStore'
import { formatDuration, cn } from '@/lib/utils'
import type { Note } from '@prisma/client'

interface NotesPanelProps {
  videoId: string
  onSeekToTimestamp?: (timestamp: number) => void
}

interface NoteForm {
  content: string
}

export function NotesPanel({ videoId, onSeekToTimestamp }: NotesPanelProps) {
  const { notes, addNote, updateNote, removeNote, setNotes } = useNoteStore()
  const { currentTime, setCurrentTime } = usePlayerStore()
  const { user } = useAuthStore()
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [showImportantOnly, setShowImportantOnly] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  const videoNotes = notes.filter((n) => n.youtubeId === videoId)
  const filteredNotes = showImportantOnly 
    ? videoNotes.filter((n) => n.isImportant) 
    : videoNotes

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NoteForm>()

  const onSubmit = async (data: NoteForm) => {
    if (!data.content.trim()) return

    const newNote: Note = {
      id: `temp-${Date.now()}`,
      content: data.content,
      timestampSeconds: Math.floor(currentTime),
      isImportant: false,
      youtubeId: videoId,
      userId: user?.id || 'anonymous',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // In a real app, this would save to the database
    addNote(newNote)
    reset()
    setIsAddingNote(false)

    // Save to API
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
          timestamp: Math.floor(currentTime),
          youtubeId: videoId,
        }),
      })
      if (response.ok) {
        const savedNote = await response.json()
        // Update with the saved note from DB
        removeNote(newNote.id)
        addNote(savedNote)
      }
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const handleEditNote = async (note: Note, newContent: string) => {
    updateNote({ ...note, content: newContent })
    setEditingNoteId(null)

    try {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    removeNote(noteId)

    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const toggleImportant = async (note: Note) => {
    updateNote({ ...note, isImportant: !note.isImportant })

    try {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isImportant: !note.isImportant }),
      })
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const toggleExpand = (noteId: string) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId)
    } else {
      newExpanded.add(noteId)
    }
    setExpandedNotes(newExpanded)
  }

  const handleTimestampClick = (timestamp: number) => {
    setCurrentTime(timestamp)
    onSeekToTimestamp?.(timestamp)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
            <Badge variant="secondary" className="ml-1">
              {videoNotes.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showImportantOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowImportantOnly(!showImportantOnly)}
            >
              <Star className="h-4 w-4 mr-1" />
              Important
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Add Note Section */}
      <div className="p-4 border-b">
        {isAddingNote ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>At {formatDuration(currentTime)}</span>
            </div>
            <Textarea
              {...register('content', { required: 'Note content is required' })}
              placeholder="Write your note here..."
              rows={3}
              autoFocus
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingNote(false)
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Note
              </Button>
            </div>
          </form>
        ) : (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setIsAddingNote(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note at {formatDuration(currentTime)}
          </Button>
        )}
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">
                {showImportantOnly ? 'No important notes yet' : 'No notes yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                Add notes while watching to remember key points
              </p>
            </div>
          ) : (
            filteredNotes
              .sort((a, b) => (a.timestampSeconds || 0) - (b.timestampSeconds || 0))
              .map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    note.isImportant && "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* Timestamp */}
                    <button
                      className="shrink-0 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
                      onClick={() => handleTimestampClick(note.timestampSeconds || 0)}
                    >
                      {formatDuration(note.timestampSeconds || 0)}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {editingNoteId === note.id ? (
                        <Textarea
                          defaultValue={note.content}
                          className="min-h-[60px]"
                          autoFocus
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleEditNote(note, e.target.value)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingNoteId(null)
                            }
                          }}
                        />
                      ) : (
                        <p className={cn(
                          "text-sm",
                          !expandedNotes.has(note.id) && "line-clamp-2"
                        )}>
                          {note.content}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleImportant(note)}
                        >
                          <Star
                            className={cn(
                              "h-3 w-3",
                              note.isImportant && "fill-yellow-500 text-yellow-500"
                            )}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditingNoteId(note.id)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-white hover:text-white text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        {note.content.length > 100 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            onClick={() => toggleExpand(note.id)}
                          >
                            {expandedNotes.has(note.id) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
