'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link2, Loader2, Youtube, List, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { extractYouTubeId, cn } from '@/lib/utils'
import type { Folder } from '@prisma/client'

interface AddContentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: Folder[]
}

interface AddForm {
  url: string
  folderId: string
}

interface PreviewData {
  type: 'video' | 'playlist' | null
  id: string | null
  title: string | null
  description: string | null
  thumbnail: string | null
  channelName: string | null
  channelId: string | null
}

export function AddContentModal({ open, onOpenChange, folders }: AddContentModalProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData>({ 
    type: null, 
    id: null, 
    title: null,
    description: null,
    thumbnail: null,
    channelName: null,
    channelId: null,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddForm>({
    defaultValues: {
      url: '',
      folderId: '',
    },
  })

  const url = watch('url')

  const fetchYouTubeDetails = async (youtubeId: string, type: 'video' | 'playlist') => {
    setIsLoadingPreview(true)
    try {
      const response = await fetch(`/api/youtube?id=${youtubeId}&type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setPreviewData({
          type,
          id: youtubeId,
          title: data.title || `${type === 'playlist' ? 'Playlist' : 'Video'}`,
          description: data.description || '',
          thumbnail: data.thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          channelName: data.channelName || 'Unknown Channel',
          channelId: data.channelId || '',
        })
      } else {
        setPreviewData({
          type,
          id: youtubeId,
          title: `${type === 'playlist' ? 'Playlist' : 'Video'}`,
          description: null,
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          channelName: null,
          channelId: null,
        })
      }
    } catch (error) {
      console.error('Failed to fetch YouTube details:', error)
      setPreviewData({
        type,
        id: youtubeId,
        title: `${type === 'playlist' ? 'Playlist' : 'Video'}`,
        description: null,
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        channelName: null,
        channelId: null,
      })
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const detectContentType = (inputUrl: string) => {
    const extracted = extractYouTubeId(inputUrl)
    if (extracted) {
      setPreviewData({
        type: extracted.type,
        id: extracted.id,
        title: isLoadingPreview ? 'Loading...' : `Sample ${extracted.type} title`,
        description: null,
        thumbnail: `https://img.youtube.com/vi/${extracted.id}/maxresdefault.jpg`,
        channelName: null,
        channelId: null,
      })
      fetchYouTubeDetails(extracted.id, extracted.type)
    } else {
      setPreviewData({ type: null, id: null, title: null, description: null, thumbnail: null, channelName: null, channelId: null })
    }
  }

  const onSubmit = async (data: AddForm) => {
    if (!previewData.id || !previewData.type) return

    setIsAdding(true)
    try {
      const endpoint = previewData.type === 'playlist' ? '/api/playlists' : '/api/videos'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: previewData.id,
          type: previewData.type,
          folderId: data.folderId || null,
          title: previewData.title,
          description: previewData.description,
          thumbnail: previewData.thumbnail,
          channelId: previewData.channelId,
          channelName: previewData.channelName,
        }),
      })

      console.log('[AddContentModal] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AddContentModal] Error response:', errorText)
        setIsAdding(false)
        alert('Failed to add content: ' + errorText)
        return
      }

      const result = await response.json()
      console.log('[AddContentModal] Success:', result)
      
      setIsAdding(false)
      onOpenChange(false)
      reset()
      setPreviewData({ type: null, id: null, title: null, description: null, thumbnail: null, channelName: null, channelId: null })
    } catch (error) {
      console.error('Failed to add content:', error)
      setIsAdding(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setPreviewData({ type: null, id: null, title: null, description: null, thumbnail: null, channelName: null, channelId: null })
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Add a YouTube video or playlist to your library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
              <Input
                id="url"
                placeholder="https://youtube.com/watch?v=... or playlist?list=..."
                {...register('url', { required: 'URL is required' })}
                className="pl-10"
                onChange={(e) => {
                  register('url').onChange(e)
                  detectContentType(e.target.value)
                }}
              />
            </div>
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
          </div>

          {/* Preview */}
          {previewData.id && (
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="relative w-32 h-20 shrink-0 rounded overflow-hidden bg-muted">
                    {isLoadingPreview ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : previewData.thumbnail ? (
                      <img
                        src={previewData.thumbnail}
                        alt={previewData.title || 'Preview'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://img.youtube.com/vi/default/maxresdefault.jpg'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-red-100 dark:bg-red-900/20">
                        {previewData.type === 'playlist' ? (
                          <List className="h-6 w-6 text-red-500" />
                        ) : (
                          <Video className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    )}
                    {previewData.type === 'playlist' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <List className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium line-clamp-2">
                        {isLoadingPreview ? 'Loading...' : previewData.title}
                      </p>
                      <Badge variant="outline" className="capitalize shrink-0">
                        {previewData.type}
                      </Badge>
                    </div>
                    {previewData.channelName && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {previewData.channelName}
                      </p>
                    )}
                    {previewData.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {previewData.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Folder Selection */}
          <div className="space-y-2">
            <Label>Folder (optional)</Label>
            <Select onValueChange={(value) => setValue('folderId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">Quick Actions</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue('url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
                  detectContentType('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
                }}
              >
                <Video className="mr-2 h-4 w-4" />
                Demo Video
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue('url', 'https://www.youtube.com/playlist?list=PLdemo123')
                  detectContentType('https://www.youtube.com/playlist?list=PLdemo123')
                }}
              >
                <List className="mr-2 h-4 w-4" />
                Demo Playlist
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!previewData.id || isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Library'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
