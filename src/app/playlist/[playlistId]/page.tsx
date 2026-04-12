'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { ArrowLeft, Play, Loader2, ListVideo, MoreVertical, Trash2, FolderInput, CheckCircle, Circle, RefreshCw } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Video, Playlist, Folder } from '@/types'

interface PlaylistWithVideos extends Playlist {
  videos: Video[]
}

interface PlaylistDetailProps {
  params: Promise<{ playlistId: string }>
}

export default function PlaylistDetailPage({ params }: PlaylistDetailProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [playlist, setPlaylist] = useState<PlaylistWithVideos | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [playlistId, setPlaylistId] = useState<string>('')
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set())
  const [isPlaylistCompleted, setIsPlaylistCompleted] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    params.then(p => setPlaylistId(p.playlistId))
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    async function loadCompletedVideos() {
      if (status !== 'authenticated') return
      try {
        const res = await fetch('/api/progress/complete')
        if (res.ok) {
          const data = await res.json()
          setCompletedVideos(new Set(data.completedVideos || []))
        }
      } catch (error) {
        console.error('Failed to load completed videos:', error)
      }
    }
    loadCompletedVideos()
  }, [status])

  const loadPlaylist = useCallback(async () => {
    if (!playlistId || status !== 'authenticated') return

    try {
      const res = await fetch(`/api/playlists/${playlistId}`)
      if (res.status === 404) {
        setPlaylist(null)
        setIsLoading(false)
        return
      }
      if (res.ok) {
        const data = await res.json()
        setPlaylist(data)
      } else {
        console.error('Failed to fetch playlist')
      }

      const foldersRes = await fetch('/api/folders')
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json()
        setFolders(foldersData)
      }

      const completedRes = await fetch(`/api/playlists/complete?playlistId=${playlistId}`)
      if (completedRes.ok) {
        const completedData = await completedRes.json()
        setIsPlaylistCompleted(completedData.completed || false)
      }
    } catch (error) {
      console.error('Failed to load playlist:', error)
      setPlaylist(null)
    } finally {
      setIsLoading(false)
    }
  }, [playlistId, status])

  useEffect(() => {
    if (playlistId) {
      loadPlaylist()
    }
  }, [playlistId, loadPlaylist])

  const handleManualSync = async () => {
    if (!playlistId) return

    setIsSyncing(true)
    try {
      const res = await fetch('/api/playlists/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId }),
      })

      if (!res.ok) {
        throw new Error('Failed to sync playlist')
      }

      await loadPlaylist()
      window.dispatchEvent(new CustomEvent('refresh-playlists'))
    } catch (error) {
      console.error('Failed to sync playlist:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDeletePlaylist = async () => {
    if (!playlistId) return
    
    try {
      await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      })
      router.push('/')
    } catch (error) {
      console.error('Failed to delete playlist:', error)
    }
  }

  const handleMoveToFolder = async (folderId: string) => {
    if (!playlistId || !playlist) return
    
    try {
      await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PLAYLIST',
          externalId: playlistId,
          folderId,
          title: playlist.title,
        }),
      })
      window.dispatchEvent(new CustomEvent('refresh-playlists'))
    } catch (error) {
      console.error('Failed to move playlist to folder:', error)
    }
  }

  const handleVideoClick = (video: Video) => {
    router.push(`/playlist/${playlistId}/video/${video.youtubeId}`)
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
          completed: !isCompleted 
        }),
      })
      if (res.ok) {
        const newCompleted = new Set(completedVideos)
        if (isCompleted) {
          newCompleted.delete(video.youtubeId)
        } else {
          newCompleted.add(video.youtubeId)
        }
        setCompletedVideos(newCompleted)
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error)
    }
  }

  const handleTogglePlaylistComplete = async () => {
    try {
      const res = await fetch('/api/playlists/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playlistId, 
          completed: !isPlaylistCompleted 
        }),
      })
      if (res.ok) {
        setIsPlaylistCompleted(!isPlaylistCompleted)
        window.dispatchEvent(new CustomEvent('refresh-playlists'))
      }
    } catch (error) {
      console.error('Failed to toggle playlist completion:', error)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  if (!playlist) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Playlist not found</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{playlist.title}</h1>
              {playlist.channelName && (
                <p className="text-muted-foreground">{playlist.channelName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleManualSync} disabled={isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Refreshing...' : 'Refresh'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleTogglePlaylistComplete}>
                  {isPlaylistCompleted ? (
                    <>
                      <Circle className="mr-2 h-4 w-4" />
                      Mark as incomplete
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as complete
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeletePlaylist} className="bg-destructive text-white focus:bg-destructive/80 focus:text-white">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Playlist Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {playlist.thumbnail && (
                <Image
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  width={192}
                  height={108}
                  className="w-full md:w-48 h-auto rounded-lg object-cover"
                />
              )}
              <div className="flex-1 space-y-3">
                {playlist.description && (
                  <p className="text-muted-foreground line-clamp-3">
                    {playlist.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Play className="h-4 w-4" />
                    {playlist.videos?.length || 0} videos
                  </span>
                  {playlist.totalDuration > 0 && (
                    <span>
                      {Math.floor(playlist.totalDuration / 3600)}h {Math.floor((playlist.totalDuration % 3600) / 60)}m
                    </span>
                  )}
                </div>
                <Select onValueChange={handleMoveToFolder}>
                  <SelectTrigger className="w-[200px]">
                    <FolderInput className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Move to folder..." />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.title}
                      </SelectItem>
                    ))}
                    {folders.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground text-center">
                        No folders yet
                      </p>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos List */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Videos</h2>
          {playlist.videos && playlist.videos.length > 0 ? (
            <div className="grid gap-3">
              {playlist.videos.map((video, index) => {
                const isCompleted = completedVideos.has(video.youtubeId)
                return (
                <Card
                  key={video.id}
                  className={`cursor-pointer transition-colors ${
                    isCompleted ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleVideoClick(video)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground font-mono w-8">
                        {index + 1}
                      </span>
                      {video.thumbnail && (
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          width={160}
                          height={96}
                          className="w-40 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor((video.duration || 0) / 60)}:{((video.duration || 0) % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleToggleComplete(video, e)}>
                              {isCompleted ? (
                                <>
                                  <Circle className="mr-2 h-4 w-4" />
                                  Mark as incomplete
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as complete
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          ) : (
            <div className="text-center py-12">
              <ListVideo className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No videos in this playlist</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
