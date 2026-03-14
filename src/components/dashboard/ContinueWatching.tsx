'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Play, MoreVertical, Trash2, FolderInput } from 'lucide-react'
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
import type { Video, Folder } from '@prisma/client'

interface ContinueWatchingProps {
  videos: Video[]
  folders: Folder[]
  onVideoClick: (video: Video) => void
  onVideoRemoved?: (videoId: string) => void
}

export function ContinueWatching({ videos, folders: propFolders, onVideoClick, onVideoRemoved }: ContinueWatchingProps) {
  const router = useRouter()
  const [localVideos, setLocalVideos] = useState(videos)
  const [folders, setFolders] = useState<Folder[]>([])

  useEffect(() => {
    setLocalVideos(videos)
  }, [videos])

  useEffect(() => {
    setFolders(propFolders)
  }, [propFolders])

  const handleRemove = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })
      setLocalVideos(prev => prev.filter(v => v.id !== videoId))
      onVideoRemoved?.(videoId)
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
      // Dispatch event to refresh playlists/videos in folders
      window.dispatchEvent(new CustomEvent('refresh-playlists'))
    } catch (error) {
      console.error('Failed to move video to folder:', error)
    }
  }

  if (localVideos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Play className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No videos yet</p>
            <p className="text-sm text-muted-foreground">
              Add some content to start learning
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Videos</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => router.push('/videos')}>
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {localVideos.slice(0, 4).map((video) => (
            <div
              key={video.id}
              className="group flex gap-3 cursor-pointer"
              onClick={() => router.push(`/video/${video.youtubeId}`)}
            >
              <div className="relative w-32 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>

                <Badge className="absolute bottom-1 right-1 text-[10px] px-1" variant="secondary">
                  {formatDuration(video.duration)}
                </Badge>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium line-clamp-2">
                  {video.title}
                </h4>
                {video.description && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {video.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {folders.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Move to Folder</div>
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
                    Remove from history
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}
