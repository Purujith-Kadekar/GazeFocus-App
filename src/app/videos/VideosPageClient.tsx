'use client'

import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Play, Loader2, MoreVertical, Trash2, FolderInput, CheckCircle, Circle, Plus } from 'lucide-react'
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
import { AddContentModal } from '@/components/search/AddContentModal'
import { formatDuration } from '@/lib/utils'
import { readRouteCache, writeRouteCache } from '@/lib/route-data-cache'
import { getDashboardBootstrapCache } from '@/lib/dashboard-bootstrap-cache'
import type { Video, Playlist, Folder } from '@/types'
import type React from 'react'

interface VideoWithPlaylist extends Video {
  playlist?: Playlist | null
}

interface VideosPageClientProps {
  initialVideos?: VideoWithPlaylist[]
  initialFolders?: Folder[]
}

type VideosPageCache = {
  videos: VideoWithPlaylist[]
  folders: Folder[]
  completedVideos: string[]
  videoFolderMap: Record<string, string | null>
}

const VIDEOS_CACHE_KEY = 'gazefocus:videos-page-cache'

export default function VideosPageClient({ initialVideos, initialFolders }: VideosPageClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const cached = useMemo(() => readRouteCache<VideosPageCache>(VIDEOS_CACHE_KEY), [])
  const dashboardCached = useMemo(() => getDashboardBootstrapCache()?.payload, [])
  const initialCachedVideos =
    cached?.payload.videos ||
    (Array.isArray(dashboardCached?.videos) ? (dashboardCached.videos as VideoWithPlaylist[]) : undefined) ||
    initialVideos ||
    []
  const initialCachedFolders =
    cached?.payload.folders ||
    (Array.isArray(dashboardCached?.folders) ? (dashboardCached.folders as Folder[]) : undefined) ||
    initialFolders ||
    []

  const [videos, setVideos] = useState<VideoWithPlaylist[]>(initialCachedVideos)
  const [folders, setFolders] = useState<Folder[]>(initialCachedFolders)
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set(cached?.payload.completedVideos || []))
  const [videoFolderMap, setVideoFolderMap] = useState<Record<string, string | null>>(cached?.payload.videoFolderMap || {})
  const [addModalOpen, setAddModalOpen] = useState(false)
  const hasMounted = useRef(false)
  
  const videosRef = useRef<VideoWithPlaylist[]>(initialCachedVideos)
  const foldersRef = useRef<Folder[]>(initialCachedFolders)
  const completedVideosRef = useRef<Set<string>>(new Set(cached?.payload.completedVideos || []))
  const videoFolderMapRef = useRef<Record<string, string | null>>(cached?.payload.videoFolderMap || {})

  useEffect(() => {
    videosRef.current = videos
  }, [videos])

  useEffect(() => {
    foldersRef.current = folders
  }, [folders])

  useEffect(() => {
    completedVideosRef.current = completedVideos
  }, [completedVideos])

  useEffect(() => {
    videoFolderMapRef.current = videoFolderMap
  }, [videoFolderMap])

  const persistCache = useCallback((next: {
    videos?: VideoWithPlaylist[]
    folders?: Folder[]
    completedVideos?: Set<string> | string[]
    videoFolderMap?: Record<string, string | null>
  }) => {
    const payload: VideosPageCache = {
      videos: next.videos ?? videosRef.current,
      folders: next.folders ?? foldersRef.current,
      completedVideos: Array.isArray(next.completedVideos)
        ? next.completedVideos
        : Array.from(next.completedVideos ?? completedVideosRef.current),
      videoFolderMap: next.videoFolderMap ?? videoFolderMapRef.current,
    }
    writeRouteCache(VIDEOS_CACHE_KEY, payload)
  }, [])

  useEffect(() => {
    hasMounted.current = true
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const refreshMetadata = useCallback(async () => {
    try {
      const [completedRes, libraryRes] = await Promise.all([
        fetch('/api/progress/complete'),
        fetch('/api/library-items'),
      ])

      if (completedRes?.ok) {
        const completed = await completedRes.json() as { completedVideos?: string[] }
        const nextCompleted = new Set(completed.completedVideos || [])
        setCompletedVideos(nextCompleted)
        persistCache({ completedVideos: nextCompleted })
      }

      if (libraryRes?.ok) {
        const items = await libraryRes.json() as Array<{ type: string; externalId: string; folderId: string | null }>
        const map: Record<string, string | null> = {}
        items
          .filter((item) => item.type === 'VIDEO')
          .forEach((item) => {
            map[item.externalId] = item.folderId ?? null
          })
        setVideoFolderMap(map)
        persistCache({ videoFolderMap: map })
      }
    } catch (error) {
      console.error('Failed to refresh video metadata:', error)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadVideos = async () => {
      try {
        const [videosRes, foldersRes] = await Promise.all([
          fetch('/api/videos'),
          fetch('/api/folders'),
        ])

        if (cancelled) return

        if (videosRes.ok) {
          const data = await videosRes.json()
          const nextVideos = Array.isArray(data) ? data : []
          setVideos(nextVideos)
          persistCache({ videos: nextVideos })
        }

        if (foldersRes.ok) {
          const data = await foldersRes.json()
          const nextFolders = Array.isArray(data) ? data : []
          setFolders(nextFolders)
          persistCache({ folders: nextFolders })
        }
      } catch {
        // keep cached data when offline or slow
      }
    }

    // Only fetch from API if cache doesn't exist (first load)
    if (!cached?.payload) {
      void loadVideos()
    } else {
      // Cache exists - refresh metadata in background
      void refreshMetadata()
    }

    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = async (videoId: string, youtubeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await fetch(`/api/videos/${videoId}`, { method: 'DELETE' })
      const nextVideos = videosRef.current.filter(v => v.id !== videoId)
      setVideos(nextVideos)
      persistCache({ videos: nextVideos })
      
      const nextMap = { ...videoFolderMapRef.current }
      delete nextMap[youtubeId]
      setVideoFolderMap(nextMap)
      persistCache({ videoFolderMap: nextMap })
      
      const nextCompleted = new Set(completedVideosRef.current)
      nextCompleted.delete(youtubeId)
      setCompletedVideos(nextCompleted)
      persistCache({ completedVideos: nextCompleted })
      
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
    } catch (error) {
      console.error('Failed to delete video:', error)
    }
  }

  const handleMoveToFolder = async (youtubeId: string, folderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await fetch(`/api/library-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VIDEO',
          externalId: youtubeId,
          folderId,
        }),
      })
      const response = await fetch('/api/videos')
      if (response.ok) {
        const data = await response.json()
        const nextVideos = Array.isArray(data) ? data : []
        setVideos(nextVideos)
        persistCache({ videos: nextVideos })
      }
      const nextMap = { ...videoFolderMapRef.current, [youtubeId]: folderId }
      setVideoFolderMap(nextMap)
      persistCache({ videoFolderMap: nextMap })
      
      void refreshMetadata()
      window.dispatchEvent(new CustomEvent('refresh-videos'))
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
    } catch (error) {
      console.error('Failed to move video to folder:', error)
    }
  }

  const handleRemoveFromFolder = async (youtubeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/library-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VIDEO',
          externalId: youtubeId,
          folderId: null,
        }),
      })
      const nextMap = { ...videoFolderMapRef.current, [youtubeId]: null }
      setVideoFolderMap(nextMap)
      persistCache({ videoFolderMap: nextMap })
      
      void refreshMetadata()
      window.dispatchEvent(new CustomEvent('refresh-videos'))
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
    } catch (error) {
      console.error('Failed to remove video from folder:', error)
    }
  }

  const handleToggleComplete = async (youtubeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isCompleted = completedVideosRef.current.has(youtubeId)
    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId,
          completed: !isCompleted,
        }),
      })

      if (res.ok) {
        const next = new Set(completedVideosRef.current)
        if (isCompleted) {
          next.delete(youtubeId)
        } else {
          next.add(youtubeId)
        }
        setCompletedVideos(next)
        persistCache({ completedVideos: next })
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      }
    } catch (error) {
      console.error('Failed to toggle video completion:', error)
    }
  }

  useEffect(() => {
    const handleRefresh = () => {
      if (!hasMounted.current) return
      fetch('/api/videos')
        .then(r => r.ok ? r.json() : [])
        .then((data) => {
          const nextVideos = Array.isArray(data) ? data : []
          setVideos(nextVideos)
          persistCache({ videos: nextVideos })
        })
        .catch(() => {})
      void refreshMetadata()
    }
    window.addEventListener('refresh-videos', handleRefresh)
    return () => window.removeEventListener('refresh-videos', handleRefresh)
  }, [])

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Videos</h1>
            <p className="text-muted-foreground">
              {videos.length} video{videos.length !== 1 ? 's' : ''} in your library
            </p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>

        {videos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No videos yet</p>
              <Button onClick={() => router.push('/')}>
                Add Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => {
              const isCompleted = completedVideos.has(video.youtubeId)
              const isInFolder = videoFolderMap[video.youtubeId] !== undefined && videoFolderMap[video.youtubeId] !== null
              return (
              <div key={video.id} className="relative group">
                <Card
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => router.push(`/video/${video.youtubeId}`)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video rounded-t-lg overflow-hidden bg-muted">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      {isCompleted && (
                        <div className="absolute top-2 left-2 rounded-full bg-green-600 text-white p-1 shadow-sm">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                      <Badge className="absolute bottom-1 right-1 text-[10px] px-1" variant="secondary">
                        {formatDuration(video.duration)}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium line-clamp-2">{video.title}</h3>
                      {video.playlist?.channelName && (
                        <p className="text-sm text-muted-foreground mt-1">{video.playlist.channelName}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => handleToggleComplete(video.youtubeId, e)}>
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
                      <DropdownMenuItem onClick={(e) => handleRemoveFromFolder(video.youtubeId, e)}>
                        <FolderInput className="h-4 w-4 mr-2" />
                        Remove from folder
                      </DropdownMenuItem>
                    )}
                    {folders.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Move to Folder</div>
                        {folders.map(folder => (
                          <DropdownMenuItem key={folder.id} onClick={(e) => handleMoveToFolder(video.youtubeId, folder.id, e)}>
                            <FolderInput className="h-4 w-4 mr-2" />
                            {folder.title}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                      onClick={(e) => handleDelete(video.id, video.youtubeId, e)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )})}
          </div>
        )}
        <AddContentModal open={addModalOpen} onOpenChange={setAddModalOpen} folders={folders} />
      </div>
    </MainLayout>
  )
}
