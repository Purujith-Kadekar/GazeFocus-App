'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from '@/components/ui/StableImage'
import { Play, ListVideo, MoreVertical, Trash2, FolderInput, CheckCircle, Circle } from 'lucide-react'
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
import type { Playlist, Folder } from '@/types'

type PlaylistWithFolder = Playlist & { folderId: string | null }

interface PlaylistsSectionProps {
  playlists: PlaylistWithFolder[]
  folders: Folder[]
  completedPlaylists: Set<string>
  onPlaylistRemoved?: () => void
}

// Dynamic height: natural expand up to 5 items, then scrollable
const ITEM_HEIGHT_ESTIMATE = 88
const MAX_VISIBLE_ITEMS = 5
const MAX_SCROLL_HEIGHT = MAX_VISIBLE_ITEMS * ITEM_HEIGHT_ESTIMATE

export function PlaylistsSection({ playlists: propPlaylists, folders: propFolders, completedPlaylists: propCompleted, onPlaylistRemoved }: PlaylistsSectionProps) {
  const router = useRouter()
  const [playlists, setPlaylists] = useState<PlaylistWithFolder[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completedPlaylists, setCompletedPlaylists] = useState<Set<string>>(new Set())

  useEffect(() => {
    setPlaylists(propPlaylists)
    setFolders(propFolders)
    setCompletedPlaylists(propCompleted)
    setIsLoading(false)
  }, [propPlaylists, propFolders, propCompleted])

  const handleDelete = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      })
      setPlaylists(prev => prev.filter(p => p.id !== playlistId))
      onPlaylistRemoved?.()
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
    } catch (error) {
      console.error('Failed to delete playlist:', error)
    }
  }

  const handleMoveToFolder = async (playlistId: string, folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const playlist = playlists.find(p => p.id === playlistId)
      await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PLAYLIST',
          externalId: playlistId,
          folderId,
          title: playlist?.title || '',
        }),
      })
      // Refresh playlists to reflect the move
      const response = await fetch('/api/playlists')
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data)
      }
      onPlaylistRemoved?.()
      window.dispatchEvent(new CustomEvent('refresh-playlists'))
    } catch (error) {
      console.error('Failed to move playlist to folder:', error)
    }
  }

  const handleRemoveFromFolder = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PLAYLIST',
          externalId: playlistId,
          folderId: null,
        }),
      })
      // Refresh playlists to reflect the change
      const response = await fetch('/api/playlists')
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data)
      }
      window.dispatchEvent(new CustomEvent('refresh-playlists'))
    } catch (error) {
      console.error('Failed to remove playlist from folder:', error)
    }
  }

  const handleTogglePlaylistComplete = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isCompleted = completedPlaylists.has(playlistId)
    try {
      const res = await fetch('/api/playlists/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playlistId, 
          completed: !isCompleted 
        }),
      })
      if (res.ok) {
        const newCompleted = new Set(completedPlaylists)
        if (isCompleted) {
          newCompleted.delete(playlistId)
        } else {
          newCompleted.add(playlistId)
        }
        setCompletedPlaylists(newCompleted)
        window.dispatchEvent(new CustomEvent('refresh-playlists'))
      }
    } catch (error) {
      console.error('Failed to toggle playlist completion:', error)
    }
  }

  // Expose refresh function via custom event
  useEffect(() => {
    const refreshPlaylists = async () => {
      try {
        const response = await fetch('/api/playlists')
        if (response.ok) {
          const data = await response.json()
          setPlaylists(data)
        }
      } catch (error) {
        console.error('Failed to refresh playlists:', error)
      }
    }
    window.addEventListener('refresh-playlists', refreshPlaylists)
    return () => window.removeEventListener('refresh-playlists', refreshPlaylists)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Playlists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state: compact, not oversized
  if (playlists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Playlists</CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-center">
            <ListVideo className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No playlists yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add playlists to organize your learning
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Dynamic sizing: natural expand for 0-5 items, scrollable after 5
  const needsScroll = playlists.length > MAX_VISIBLE_ITEMS
  const contentHeight = needsScroll ? MAX_SCROLL_HEIGHT : undefined

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Playlists</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => router.push('/playlists')}>
          View All
        </Button>
      </CardHeader>
      <CardContent className={needsScroll ? 'overflow-hidden' : ''}>
        {needsScroll ? (
          <ScrollArea className="pr-4" style={{ height: contentHeight }}>
            <div className="space-y-3">
              {playlists.map((playlist) => renderPlaylistItem(playlist))}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-3">
            {playlists.slice(0, MAX_VISIBLE_ITEMS).map((playlist) => renderPlaylistItem(playlist))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  function renderPlaylistItem(playlist: PlaylistWithFolder) {
    const isCompleted = completedPlaylists.has(playlist.id)
    return (
      <div
        key={playlist.id}
        className={`group flex gap-3 cursor-pointer p-2 rounded-lg ${isCompleted ? 'bg-green-50 dark:bg-green-950/30' : ''}`}
        onClick={() => router.push(`/playlist/${playlist.id}`)}
      >
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-32">
          {playlist.thumbnail ? (
            <Image
              src={playlist.thumbnail}
              alt={playlist.title}
              fill
              sizes="(max-width: 640px) 96px, 128px"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListVideo className="h-6 w-6 text-muted-foreground/50 sm:h-8 sm:w-8" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-6 w-6 text-white sm:h-8 sm:w-8" />
          </div>
          {isCompleted && (
            <div className="absolute top-1 right-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`font-medium line-clamp-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {playlist.title}
          </h4>
          {playlist.channelName && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {playlist.channelName}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {playlist.totalVideos > 0 && (
              <Badge variant="secondary" className="text-xs">
                {playlist.totalVideos} videos
              </Badge>
            )}
            {playlist.totalDuration && playlist.totalDuration > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(playlist.totalDuration)}
              </span>
            )}
          </div>
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
            <DropdownMenuItem onClick={(e) => handleTogglePlaylistComplete(playlist.id, e)}>
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
            {playlist.folderId && (
              <DropdownMenuItem 
                onClick={(e) => handleRemoveFromFolder(playlist.id, e)}
              >
                <FolderInput className="h-4 w-4 mr-2" />
                Remove from Folder
              </DropdownMenuItem>
            )}
            {folders.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-sm text-muted-foreground">Move to Folder</div>
                {folders.map(folder => (
                  <DropdownMenuItem key={folder.id} onClick={(e) => handleMoveToFolder(playlist.id, folder.id, e)}>
                    <FolderInput className="h-4 w-4 mr-2" />
                    {folder.title}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
              onClick={(e) => handleDelete(playlist.id, e)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
}
