'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Play, Loader2, ListVideo, MoreVertical, Trash2, FolderPlus, Copy } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDuration } from '@/lib/utils'
import { readRouteCache, writeRouteCache } from '@/lib/route-data-cache'
import { getDashboardBootstrapCache } from '@/lib/dashboard-bootstrap-cache'
import type { Playlist, Folder } from '@/types'

interface PlaylistWithFolder extends Playlist {
  folder?: Folder | null
}

interface PlaylistsPageClientProps {
  initialPlaylists?: Playlist[]
  initialFolders?: Folder[]
}

type PlaylistsPageCache = {
  playlists: Playlist[]
  folders: Folder[]
}

const PLAYLISTS_CACHE_KEY = 'gazefocus:playlists-page-cache'

export default function PlaylistsPageClient({ initialPlaylists, initialFolders }: PlaylistsPageClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const cached = useMemo(() => readRouteCache<PlaylistsPageCache>(PLAYLISTS_CACHE_KEY), [])
  const dashboardCached = useMemo(() => getDashboardBootstrapCache()?.payload, [])
  const initialCachedPlaylists =
    cached?.payload.playlists ||
    (Array.isArray(dashboardCached?.playlists) ? (dashboardCached.playlists as Playlist[]) : undefined) ||
    initialPlaylists ||
    []
  const initialCachedFolders =
    cached?.payload.folders ||
    (Array.isArray(dashboardCached?.folders) ? (dashboardCached.folders as Folder[]) : undefined) ||
    initialFolders ||
    []

  const [playlists, setPlaylists] = useState<Playlist[]>(initialCachedPlaylists)
  const [folders, setFolders] = useState<Folder[]>(initialCachedFolders)
  const playlistsRef = useRef<Playlist[]>(initialCachedPlaylists)
  const foldersRef = useRef<Folder[]>(initialCachedFolders)

  useEffect(() => {
    playlistsRef.current = playlists
  }, [playlists])

  useEffect(() => {
    foldersRef.current = folders
  }, [folders])

  const persistCache = useCallback((next: { playlists?: Playlist[]; folders?: Folder[] }) => {
    writeRouteCache(PLAYLISTS_CACHE_KEY, {
      playlists: next.playlists ?? playlistsRef.current,
      folders: next.folders ?? foldersRef.current,
    })
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    let cancelled = false

    const loadPlaylists = async () => {
      try {
        const [playlistsRes, foldersRes] = await Promise.all([
          fetch('/api/playlists'),
          fetch('/api/folders'),
        ])

        if (cancelled) return

        if (playlistsRes.ok) {
          const data = await playlistsRes.json()
          const nextPlaylists = Array.isArray(data) ? data : []
          setPlaylists(nextPlaylists)
          persistCache({ playlists: nextPlaylists })
        }

        if (foldersRes.ok) {
          const data = await foldersRes.json()
          const nextFolders = Array.isArray(data) ? data : []
          setFolders(nextFolders)
          persistCache({ folders: nextFolders })
        }
      } catch {
        // Keep cached data if the background refresh fails
      }
    }

    // Only fetch from API if cache doesn't exist (first load)
    if (!cached?.payload) {
      void loadPlaylists()
    } else {
      // Cache exists - refresh in background
      void loadPlaylists()
    }

    return () => {
      cancelled = true
    }
  }, [])

  // Refresh playlists when content is added from modals
  useEffect(() => {
    const handleRefresh = () => {
      fetch('/api/playlists')
        .then(r => r.ok ? r.json() : [])
        .then((data) => {
          const nextPlaylists = Array.isArray(data) ? data : []
          setPlaylists(nextPlaylists)
          persistCache({ playlists: nextPlaylists })
        })
        .catch(() => {})
    }
    window.addEventListener('refresh-playlists', handleRefresh)
    return () => window.removeEventListener('refresh-playlists', handleRefresh)
  }, [])

  const handleDeletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        const next = playlistsRef.current.filter(p => p.id !== playlistId)
        setPlaylists(next)
        persistCache({ playlists: next })
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      }
    } catch (error) {
      console.error('Failed to delete playlist:', error)
    }
  }

  const handleCopyToFolder = async (playlistId: string, folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const playlist = playlists.find(p => p.id === playlistId)
      if (!playlist) return

      const response = await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'playlist',
          externalId: playlist.id,
          folderId,
          title: playlist.title,
        }),
      })
      if (response.ok) {
        console.log('Playlist copied to folder')
      }
    } catch (error) {
      console.error('Failed to copy playlist:', error)
    }
  }

  const handleMoveToFolder = async (playlistId: string, folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const playlist = playlists.find(p => p.id === playlistId)
      if (!playlist) return

      const response = await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'playlist',
          externalId: playlist.id,
          folderId,
          title: playlist.title,
        }),
      })
      if (response.ok) {
        console.log('Playlist moved to folder')
      }
    } catch (error) {
      console.error('Failed to move playlist:', error)
    }
  }

  const handleRemoveFromFolder = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/library-items/${playlistId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPlaylists(playlists.filter(p => p.id !== playlistId))
      }
    } catch (error) {
      console.error('Failed to remove from folder:', error)
    }
  }

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

        <h1 className="text-3xl font-bold">All Playlists</h1>
        <p className="text-muted-foreground">
          {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} in your library
        </p>

        {playlists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListVideo className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No playlists yet</p>
              <Button onClick={() => router.push('/')}>
                Add Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => router.push(`/playlist/${playlist.id}`)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video rounded-t-lg overflow-hidden bg-muted">
                    {playlist.thumbnail ? (
                      <img
                        src={playlist.thumbnail}
                        alt={playlist.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ListVideo className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                    {playlist.totalDuration && playlist.totalDuration > 0 && (
                      <Badge className="absolute bottom-1 right-1 text-[10px] px-1" variant="secondary">
                        {formatDuration(playlist.totalDuration)}
                      </Badge>
                    )}
                      <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-8 w-8 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4 text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy to Folder
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {folders.length === 0 ? (
                              <DropdownMenuItem disabled>No folders</DropdownMenuItem>
                            ) : (
                              folders.map((folder) => (
                                <DropdownMenuItem 
                                  key={folder.id}
                                  onClick={(e) => handleCopyToFolder(playlist.id, folder.id, e as unknown as React.MouseEvent)}
                                >
                                  {folder.title}
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Move to Folder
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {folders.length === 0 ? (
                              <DropdownMenuItem disabled>No folders</DropdownMenuItem>
                            ) : (
                              folders.map((folder) => (
                                <DropdownMenuItem 
                                  key={folder.id}
                                  onClick={(e) => handleMoveToFolder(playlist.id, folder.id, e as unknown as React.MouseEvent)}
                                >
                                  {folder.title}
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                          onClick={(e) => handleDeletePlaylist(playlist.id, e as unknown as React.MouseEvent)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium line-clamp-2">{playlist.title}</h3>
                    {playlist.channelName && (
                      <p className="text-sm text-muted-foreground mt-1">{playlist.channelName}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
