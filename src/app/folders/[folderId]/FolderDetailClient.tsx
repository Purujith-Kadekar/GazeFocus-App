'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from '@/components/ui/StableImage'
import { ArrowLeft, FolderOpen, Play, ListVideo, Trash2, MoreVertical, CheckCircle, Circle } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { readRouteCache, writeRouteCache } from '@/lib/route-data-cache'
import { beginRouteLoading, endRouteLoading } from '@/components/layout/RouteTopLoader'
import { FolderDetailSkeleton } from '@/components/folders/FoldersSkeleton'
import type { Folder, LibraryItem } from '@/types'

interface LibraryItemWithDetails extends LibraryItem {
  title: string
  type: 'VIDEO' | 'PLAYLIST'
  externalId: string
  thumbnail?: string | null
}

interface FolderDetailClientProps {
  folderId: string
}

type FolderDetailCache = {
  folder: Folder | null
  allFolders: Folder[]
  items: LibraryItemWithDetails[]
  completedPlaylists: string[]
}

export default function FolderDetailClient({ 
  folderId,
}: FolderDetailClientProps) {
  const { status } = useSession()
  const router = useRouter()

  const cacheKey = useMemo(() => `gazefocus:folder-detail:${folderId}`, [folderId])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [folderItems, setFolderItems] = useState<LibraryItemWithDetails[]>([])
  const [completedPlaylists, setCompletedPlaylists] = useState<Set<string>>(new Set())

  // Initial cache load to prevent flicker, but safely inside useEffect to avoid hydration error
  useEffect(() => {
    const cached = readRouteCache<FolderDetailCache>(cacheKey)
    if (cached?.payload && (cached.payload.items?.length > 0 || cached.payload.folder)) {
      setFolders(cached.payload.allFolders || [])
      setSelectedFolder(cached.payload.folder || null)
      setFolderItems(cached.payload.items || [])
      setCompletedPlaylists(new Set(cached.payload.completedPlaylists || []))
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }, [cacheKey])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    let cancelled = false

    const loadFolderDetails = async () => {
      const currentCached = readRouteCache<FolderDetailCache>(cacheKey)
      // If we have valid cache, we already set isLoading(false) in the other useEffect
      // But we still want to refresh in background.
      
      if (!currentCached?.payload) {
        setIsLoading(true)
        beginRouteLoading()
      }

      try {
        const [folderRes, allFoldersRes, completedRes] = await Promise.all([
          fetch(`/api/folders/${folderId}`),
          fetch('/api/folders'),
          fetch('/api/progress/complete').catch(() => null),
        ])

        if (cancelled) return

        if (!folderRes.ok) {
          router.push('/folders')
          return
        }

        const folderData = await folderRes.json()
        const allFoldersData = allFoldersRes.ok ? await allFoldersRes.json() : []
        const completedData = completedRes && completedRes.ok ? await completedRes.json() : { completedPlaylists: [] }

        const folder: Folder | null = folderData ? {
          id: folderData.id,
          userId: folderData.userId,
          title: folderData.title,
          description: folderData.description,
          parentId: folderData.parentId ?? null,
          position: folderData.position,
          createdAt: folderData.createdAt,
          updatedAt: folderData.updatedAt,
        } : null

        const items: LibraryItemWithDetails[] = Array.isArray(folderData?.items)
          ? folderData.items
          : []

        const nextFolders = Array.isArray(allFoldersData) ? allFoldersData : []
        const nextCompleted = new Set<string>(completedData?.completedPlaylists || [])

        setSelectedFolder(folder)
        setFolderItems(items)
        setFolders(nextFolders)
        setCompletedPlaylists(nextCompleted)

        writeRouteCache(cacheKey, {
          folder,
          allFolders: nextFolders,
          items,
          completedPlaylists: Array.from(nextCompleted),
        })
      } catch {
        // Keep cached content if refresh fails.
      } finally {
        setIsLoading(false)
        setIsInitialLoad(false)
        endRouteLoading()
      }
    }

    void loadFolderDetails()

    return () => {
      cancelled = true
    }
  }, [folderId, cacheKey, router])

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
      router.push('/folders')
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  const handleItemClick = (item: LibraryItemWithDetails) => {
    if (item.type === 'PLAYLIST') {
      router.push(`/playlist/${item.externalId}`)
    } else {
      router.push(`/video/${item.externalId}`)
    }
  }

  const handleRemoveFromFolder = async (item: LibraryItemWithDetails) => {
    try {
      await fetch(`/api/library-items/${item.id}`, { method: 'DELETE' })
      const nextItems = folderItems.filter(i => i.id !== item.id)
      setFolderItems(nextItems)
      writeRouteCache(cacheKey, {
        folder: selectedFolder,
        allFolders: folders,
        items: nextItems,
        completedPlaylists: Array.from(completedPlaylists),
      })
    } catch (error) {
      console.error('Failed to remove item from folder:', error)
    }
  }

  useEffect(() => {
    const handleRefresh = () => {
      beginRouteLoading()
      fetch(`/api/folders/${folderId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return
          const folder: Folder = {
            id: data.id,
            userId: data.userId,
            title: data.title,
            description: data.description,
            parentId: data.parentId ?? null,
            position: data.position,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          }
          const items = Array.isArray(data.items) ? data.items : []
          setSelectedFolder(folder)
          setFolderItems(items)
          writeRouteCache(cacheKey, {
            folder,
            allFolders: folders,
            items,
            completedPlaylists: Array.from(completedPlaylists),
          })
        })
        .catch(() => {})
        .finally(() => {
          endRouteLoading()
        })
    }

    window.addEventListener('refresh-folders', handleRefresh)
    return () => window.removeEventListener('refresh-folders', handleRefresh)
  }, [folderId, cacheKey, folders, completedPlaylists])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/folders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Folders
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold">{selectedFolder?.title || (isLoading ? 'Loading...' : 'Folder')}</h1>
              {!isLoading && (
                <p className="text-muted-foreground">
                  {folderItems.length} item{folderItems.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                onClick={() => handleDeleteFolder(selectedFolder?.id || '')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <FolderDetailSkeleton loading={isLoading}>
          {(!isInitialLoad && folderItems.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">This folder is empty</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add videos or playlists to this folder from the dashboard
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {folderItems.map((item) => (
                <div key={item.id} className="relative group">
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleItemClick(item)}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-video rounded-t-lg overflow-hidden bg-muted">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.type === 'PLAYLIST' ? (
                              <ListVideo className="h-12 w-12 text-muted-foreground/50" />
                            ) : (
                              <Play className="h-12 w-12 text-muted-foreground/50" />
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center">
                          {item.type === 'PLAYLIST' ? (
                            <ListVideo className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                          ) : (
                            <Play className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        {item.type === 'PLAYLIST' && completedPlaylists.has(item.externalId) && (
                          <div className="absolute top-2 left-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.type === 'PLAYLIST' ? 'Playlist' : 'Video'}
                        </p>
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
                      <DropdownMenuItem
                        className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFromFolder(item)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove from Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </FolderDetailSkeleton>
      </div>
    </MainLayout>
  )
}
