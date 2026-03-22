'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link2, Loader2, Youtube, List, Video, Users } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { extractYouTubeId } from '@/lib/utils'
import type { Folder } from '@/types'

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
  type: 'video' | 'playlist' | 'channel' | null
  id: string | null
  title: string | null
  description: string | null
  thumbnail: string | null
  channelName: string | null
  channelId: string | null
  subscriberCount?: string | null
  videoCount?: string | null
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
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddForm>({
    defaultValues: {
      url: '',
      folderId: '',
    },
  })

  const urlField = register('url', { required: 'URL is required' })

  const fetchYouTubeDetails = async (youtubeId: string, type: 'video' | 'playlist' | 'channel') => {
    setIsLoadingPreview(true)
    try {
      const response = await fetch(`/api/youtube?id=${youtubeId}&type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setPreviewData({
          type,
          id: youtubeId,
          title: data.title || `${type === 'playlist' ? 'Playlist' : type === 'channel' ? 'Channel' : 'Video'}`,
          description: data.description || '',
          thumbnail: data.thumbnail || (type === 'channel' ? '' : `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`),
          channelName: data.channelName || data.title || 'Unknown Channel',
          channelId: data.channelId || youtubeId,
          subscriberCount: data.subscriberCount,
          videoCount: data.videoCount,
        })
      } else {
        setPreviewData({
          type,
          id: youtubeId,
          title: `${type === 'playlist' ? 'Playlist' : type === 'channel' ? 'Channel' : 'Video'}`,
          description: null,
          thumbnail: type === 'channel' ? '' : `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          channelName: null,
          channelId: null,
        })
      }
    } catch (error) {
      console.error('Failed to fetch YouTube details:', error)
      setPreviewData({
        type,
        id: youtubeId,
        title: `${type === 'playlist' ? 'Playlist' : type === 'channel' ? 'Channel' : 'Video'}`,
        description: null,
        thumbnail: type === 'channel' ? '' : `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
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
        thumbnail: extracted.type === 'channel' ? '' : `https://img.youtube.com/vi/${extracted.id}/maxresdefault.jpg`,
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
      const isChannel = previewData.type === 'channel'
      const apiUrl = isChannel ? '/api/channels' : '/api/playlists'
      
      const response = await fetch(apiUrl, {
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
          subscriberCount: previewData.subscriberCount,
          videoCount: previewData.videoCount,
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
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      window.dispatchEvent(new CustomEvent('refresh-playlists'))
      window.dispatchEvent(new CustomEvent('refresh-videos'))
      window.dispatchEvent(new CustomEvent('refresh-channels'))
    } catch (error) {
      console.error('Failed to add content:', error)
      setIsAdding(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setPreviewData({ type: null, id: null, title: null, description: null, thumbnail: null, channelName: null, channelId: null, subscriberCount: null, videoCount: null })
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl overflow-x-hidden [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Add a YouTube video or playlist to your library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <div className="max-w-full px-1">
              <div className="relative max-w-full">
              <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
              <Input
                id="url"
                placeholder="https://youtube.com/watch?v=... or playlist?list=... or @channel"
                {...urlField}
                className="w-full max-w-full pl-10 pr-3"
                onChange={(e) => {
                  urlField.onChange(e)
                  detectContentType(e.target.value)
                }}
              />
              </div>
            </div>
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
          </div>

          {/* Preview */}
          {previewData.id && (
            <div className="px-1">
            <Card className="w-full min-w-0 max-w-full gap-0 overflow-hidden py-0">
              <CardContent className="min-w-0 max-w-full p-3">
                <div className="flex min-w-0 max-w-full items-start gap-3 overflow-hidden">
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded bg-muted">
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
                    ) : previewData.type === 'channel' ? (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
                        <Users className="h-6 w-6 text-blue-500" />
                      </div>
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
                    {previewData.type === 'channel' && previewData.thumbnail && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 font-medium line-clamp-2 break-words">
                        {isLoadingPreview ? 'Loading...' : previewData.title}
                      </p>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {previewData.type}
                      </Badge>
                    </div>
                    {previewData.channelName && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {previewData.channelName}
                      </p>
                    )}
                    {previewData.description && (
                      <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">
                        {previewData.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
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
            <div className="flex flex-wrap gap-2">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue('url', 'https://www.youtube.com/@GoogleDevelopers')
                  detectContentType('https://www.youtube.com/@GoogleDevelopers')
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Demo Channel
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
