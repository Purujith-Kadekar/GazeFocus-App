'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit3, Clock, Star, FileText, Play, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/MainLayout'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import type { Note } from '@prisma/client'

interface NotesPageClientProps {
  initialNotes: Note[]
}

export default function NotesPageClient({ initialNotes }: NotesPageClientProps) {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleDelete = async (noteId: string) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      setNotes(notes.filter(n => n.id !== noteId))
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return
    
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      })
      
      if (res.ok) {
        const updated = await res.json()
        setNotes(notes.map(n => n.id === noteId ? updated : n))
        setEditingNoteId(null)
        setEditContent('')
      }
    } catch (err) {
      console.error('Failed to update note:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditContent('')
  }

  const handleToggleImportant = async (note: Note) => {
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isImportant: !note.isImportant })
      })
      
      if (res.ok) {
        const updated = await res.json()
        setNotes(notes.map(n => n.id === note.id ? updated : n))
      }
    } catch (err) {
      console.error('Failed to toggle important:', err)
    }
  }

  const formatTimestamp = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Notes</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notes yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="group hover:bg-muted/50 transition-colors">
              <CardContent className="pt-4">
                {editingNoteId === note.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={isUpdating}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimestamp(note.timestampSeconds || 0)}</span>
                        {note.youtubeId && (
                          <>
                            <span>•</span>
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-sm text-blue-500"
                              onClick={() => router.push(`/video/${note.youtubeId}`)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Watch
                            </Button>
                          </>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      {note.isImportant && (
                        <Badge variant="secondary" className="mt-2">
                          <Star className="h-3 w-3 mr-1" />
                          Important
                        </Badge>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleToggleImportant(note)}
                        >
                          <Star className={`mr-2 h-4 w-4 ${note.isImportant ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          {note.isImportant ? 'Remove from important' : 'Mark as important'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStartEdit(note)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </MainLayout>
  )
}
