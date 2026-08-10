'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Image from '@/components/ui/StableImage'
import { Play, MoreVertical, Trash2, FolderInput, CheckCircle, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDuration } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Video, Folder } from '@/types'

interface ContinueWatchingProps {
  videos: Video[]
  folders: Folder[]
  completedVideos: Set<string>
  onVideoClick: (video: Video) => void
  onVideoCompletionChanged?: () => void | Promise<void>
  onVideoRemoved?: (videoId: string) => void
}

// Dynamic height: compact empty state, natural expand up to 5 items, then scrollable
const ITEM_HEIGHT_ESTIMATE = 88 // ~h-20 row + gap
const MAX_VISIBLE_ITEMS = 5
const MAX_SCROLL_HEIGHT = MAX_VISIBLE_ITEMS * ITEM_HEIGHT_ESTIMATE

export function ContinueWatching({ videos, folders: propFolders, completedVideos, onVideoClick, onVideoCompletionChanged, onVideoRemoved }: ContinueWatchingProps) {
  const router = useRouter()
  const [localVideos, setLocalVideos] = useState(videos)
  const [folders, setFolders] = useState<Folder[]>([])
  const [videoFolderMap, setVideoFolderMap] = useState<Record<string, string | null>>({})

  useEffect(() => {
    setLocalVideos(videos)
  }, [videos])

  useEffect(() => {
    setFolders(propFolders)
  }, [propFolders])

  const refreshFolderMap = useCallback(async () => {
    try {
      const res = await fetch('/api/library-items')
      if (res.ok) {
        const items = await res.json() as Array<{ type: string; externalId: string; folderId: string | null }>
        const map: Record<string, string | null> = {}
        items
          .filter((item) => item.type === 'VIDEO')
          .forEach((item) => {
            map[item.externalId] = item.folderId ?? null
          })
        setVideoFolderMap(map)
      }
    } catch (error) {
      console.error('Failed to refresh folder map:', error)
    }
  }, [])

  useEffect(() => {
    refreshFolderMap()
  }, [refreshFolderMap])

  const handleRemove = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })
      setLocalVideos(prev => prev.filter(v => v.id !== videoId))
      onVideoRemoved?.(videoId)
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
    } catch (error) {
      console.error('Failed to remove video:', error)
    }
  }

  const handleMoveToFolder = async (videoId: string, youtubeId: string, folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VIDEO',
          externalId: youtubeId,
          folderId,
          title: localVideos.find(v => v.id === videoId)?.title || '',
        }),
      })
      setVideoFolderMap(prev => ({ ...prev, [youtubeId]: folderId }))
      refreshFolderMap()
      window.dispatchEvent(new CustomEvent('refresh-playlists'))
      window.dispatchEvent(new CustomEvent('refresh-videos'))
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
    } catch (error) {
      console.error('Failed to move video to folder:', error)
    }
  }

  const handleRemoveFromFolder = async (videoId: string, youtubeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VIDEO',
          externalId: youtubeId,
          folderId: null,
          title: localVideos.find(v => v.id === videoId)?.title || '',
        }),
      })
      setVideoFolderMap(prev => ({ ...prev, [youtubeId]: null }))
      refreshFolderMap()
      window.dispatchEvent(new CustomEvent('refresh-playlists'))
      window.dispatchEvent(new CustomEvent('refresh-videos'))
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
    } catch (error) {
      console.error('Failed to remove video from folder:', error)
    }
  }

  const handleToggleComplete = async (video: Video, e: React.MouseEvent) => {
    e.stopPropagation()
    const isCompleted = completedVideos.has(video.youtubeId)

    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: video.youtubeId,
          completed: !isCompleted,
        }),
      })

      if (res.ok) {
        await onVideoCompletionChanged?.()
      }
    } catch (error) {
      console.error('Failed to toggle video completion:', error)
    }
  }

  // Empty state: compact, not oversized
  if (localVideos.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Videos</CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-center">
            <Play className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No videos yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Search and add videos to start learning
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Dynamic sizing: natural expand for 0-5 items, scrollable after 5
  const needsScroll = localVideos.length > MAX_VISIBLE_ITEMS
  const contentHeight = needsScroll ? MAX_SCROLL_HEIGHT : undefined

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Videos</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => router.push('/videos')}>
          View All
        </Button>
      </CardHeader>
      <CardContent className={needsScroll ? 'overflow-hidden' : ''}>
        {needsScroll ? (
          <ScrollArea className="pr-4" style={{ height: contentHeight }}>
            <div className="space-y-4">
              {localVideos.map((video) => renderVideoItem(video))}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-3">
            {localVideos.slice(0, MAX_VISIBLE_ITEMS).map((video) => renderVideoItem(video))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  function renderVideoItem(video: Video) {
    const isCompleted = completedVideos.has(video.youtubeId)
    const isInFolder = videoFolderMap[video.youtubeId] !== undefined && videoFolderMap[video.youtubeId] !== null
    return (
      <div
        key={video.id}
        className="group flex gap-3 cursor-pointer"
        onClick={() => onVideoClick(video)}
      >
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-32">
          {video.thumbnail ? (
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              sizes="(max-width: 640px) 96px, 128px"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-6 w-6 text-muted-foreground/50 sm:h-8 sm:w-8" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
            <Play className="h-6 w-6 text-white sm:h-8 sm:w-8" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => handleToggleComplete(video, e)}>
                {isCompleted ? (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    Mark as incomplete
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as complete
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isInFolder && (
                <>
                  <DropdownMenuItem onClick={(e) => handleRemoveFromFolder(video.id, video.youtubeId, e)}>
                    <FolderInput className="h-4 w-4 mr-2" />
                    Remove from folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {folders.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground font-semibold">Move to Folder</div>
                  {folders.map(folder => (
                    <DropdownMenuItem key={folder.id} onClick={(e) => handleMoveToFolder(video.id, video.youtubeId, folder.id, e)}>
                      <FolderInput className="h-4 w-4 mr-2" />
                      {folder.title}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                onClick={(e) => handleRemove(video.id, e)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge className="absolute bottom-1 right-1 text-[10px] px-1" variant="secondary">
            {formatDuration(video.duration)}
          </Badge>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium line-clamp-2 flex items-start gap-2">
            {video.title}
            {isCompleted && <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
          </h4>
          {video.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {video.description}
            </p>
          )}
        </div>
      </div>
    )
  }
}
