'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FolderOpen, Trash2, MoreVertical } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { readRouteCache, writeRouteCache, clearRouteCache } from '@/lib/route-data-cache'
import { beginRouteLoading, endRouteLoading } from '@/components/layout/RouteTopLoader'
import { FoldersListSkeleton } from '@/components/folders/FoldersSkeleton'
import type { Folder } from '@/types'

const FOLDERS_CACHE_KEY = 'gazefocus:folders-page-cache'

// Defensive: API responses / stale caches should never be able to inject
// a null/id-less entry into the folders list we render — that's what
// crashed this page with "Cannot read properties of null (reading 'id')".
function sanitizeFolders(data: unknown): Folder[] {
  if (!Array.isArray(data)) return []
  return data.filter((f): f is Folder => Boolean(f && typeof f === 'object' && typeof (f as Folder).id === 'string'))
}

interface FoldersPageClientProps {
  initialFolders?: Folder[]
}

export default function FoldersPageClient({ initialFolders }: FoldersPageClientProps) {
  const { status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [folders, setFolders] = useState<Folder[]>(
    (initialFolders || []).filter((f): f is Folder => Boolean(f && typeof f.id === 'string'))
  )

  useEffect(() => {
    const cached = readRouteCache<Folder[]>(FOLDERS_CACHE_KEY)
    if (cached?.payload && cached.payload.length > 0) {
      setFolders(cached.payload)
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadFolders = async () => {
      const currentCached = readRouteCache<Folder[]>(FOLDERS_CACHE_KEY)
      // If cache exists and is not empty, show it immediately and refresh in background
      if (currentCached?.payload && currentCached.payload.length > 0) {
        setFolders(currentCached.payload)
        setIsLoading(false)
        setIsInitialLoad(false)
        
        try {
          const response = await fetch('/api/folders')
          if (!response.ok || cancelled) return

          const data = await response.json()
          const nextFolders = sanitizeFolders(data)
          setFolders(nextFolders)
          writeRouteCache(FOLDERS_CACHE_KEY, nextFolders)
        } catch {
          // keep cached data
        }
        return
      }

      // No cache or empty cache - fetch with loading indicator
      setIsLoading(true)
      beginRouteLoading()
      try {
        const response = await fetch('/api/folders')
        if (!response.ok || cancelled) return

        const data = await response.json()
        const nextFolders = sanitizeFolders(data)
        setFolders(nextFolders)
        writeRouteCache(FOLDERS_CACHE_KEY, nextFolders)
      } catch {
        // keep existing state
      } finally {
        setIsLoading(false)
        setIsInitialLoad(false)
        endRouteLoading()
      }
    }

    void loadFolders()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleRefresh = () => {
      beginRouteLoading()
      fetch('/api/folders')
        .then(r => r.ok ? r.json() : [])
        .then((data) => {
          const nextFolders = sanitizeFolders(data)
          setFolders(nextFolders)
          writeRouteCache(FOLDERS_CACHE_KEY, nextFolders)
        })
        .catch(() => {})
        .finally(() => {
          endRouteLoading()
        })
    }

    window.addEventListener('refresh-folders', handleRefresh)
    return () => window.removeEventListener('refresh-folders', handleRefresh)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
      const next = folders.filter(f => f.id !== folderId)
      setFolders(next)
      writeRouteCache(FOLDERS_CACHE_KEY, next)
      window.dispatchEvent(new CustomEvent('refresh-dashboard'))
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Folders</h1>
          <p className="text-muted-foreground">
            Organize your videos and playlists into folders
          </p>
        </div>

        <FoldersListSkeleton loading={isLoading}>
          {folders.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {folders.map((folder) => (
                <Card 
                  key={folder.id} 
                  className="aspect-square cursor-pointer transition-shadow hover:shadow-md md:aspect-auto md:min-h-[140px]"
                  onClick={() => router.push(`/folders/${folder.id}`)}
                >
                  <CardHeader className="p-2 pb-1 md:p-6 md:pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-amber-500 md:h-5 md:w-5" />
                        <CardTitle className="line-clamp-1 text-sm md:text-base">{folder.title}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFolder(folder.id)
                            }}
                            className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto p-2 pt-0 md:p-6 md:pt-0">
                    <p className="line-clamp-3 text-xs text-muted-foreground md:text-sm">
                      {folder.description || 'No description'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !isLoading && !isInitialLoad ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No folders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create folders from the dashboard to organize your content
              </p>
            </div>
          ) : null}
        </FoldersListSkeleton>
      </div>
    </MainLayout>
  )
}
