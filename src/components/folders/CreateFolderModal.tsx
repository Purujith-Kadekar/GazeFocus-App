'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useFolderStore } from '@/store/useStore'

interface CreateFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: { id: string; title: string; description?: string | null }
}

interface FolderForm {
  title: string
  description: string
}

export function CreateFolderModal({ open, onOpenChange, folder }: CreateFolderModalProps) {
  const { addFolder, updateFolder } = useFolderStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FolderForm>({
    defaultValues: folder ? {
      title: folder.title,
      description: folder.description || '',
    } : {
      title: '',
      description: '',
    },
  })

  const onSubmit = async (data: FolderForm) => {
    setIsSubmitting(true)
    try {
      const url = folder ? `/api/folders/${folder.id}` : '/api/folders'
      const method = folder ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const savedFolder = await response.json()
        if (folder) {
          updateFolder(savedFolder)
        } else {
          addFolder(savedFolder)
        }
        onOpenChange(false)
        reset()
      }
    } catch (error) {
      console.error('Failed to save folder:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{folder ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
          <DialogDescription>
            {folder
              ? 'Update your folder details.'
              : 'Create a folder to organize your playlists and videos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Name</Label>
            <Input
              id="title"
              placeholder="My Learning Playlist"
              {...register('title', { required: 'Name is required' })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A brief description of this folder..."
              {...register('description')}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : folder ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
