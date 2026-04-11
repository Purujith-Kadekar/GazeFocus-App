'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
import type { Folder, LibraryItem } from '@/types'

interface LibraryItemWithDetails extends LibraryItem {
  title: string
  type: 'VIDEO' | 'PLAYLIST'
  externalId: string
  thumbnail?: string | null
}

interface FolderDetailClientProps {
  initialFolder: Folder
  initialFolders: Folder[]
  initialItems: LibraryItemWithDetails[]
  completedPlaylists: Set<string>
}

export default function FolderDetailClient({ 
  initialFolder, 
  initialFolders, 
  initialItems,
  completedPlaylists: initialCompleted 
}: FolderDetailClientProps) {
  const { status } = useSession()
  const router = useRouter()
  
  const [folders] = useState<Folder[]>(initialFolders)
  const [selectedFolder] = useState<Folder | null>(initialFolder)
  const [folderItems, setFolderItems] = useState<LibraryItemWithDetails[]>(initialItems)
  const [completedPlaylists] = useState<Set<string>>(initialCompleted)

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
      setFolderItems(folderItems.filter(i => i.id !== item.id))
    } catch (error) {
      console.error('Failed to remove item from folder:', error)
    }
  }

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
              <h1 className="text-3xl font-bold">{selectedFolder?.title}</h1>
              <p className="text-muted-foreground">
                {folderItems.length} item{folderItems.length !== 1 ? 's' : ''}
              </p>
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

        {folderItems.length === 0 ? (
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
                        <img
                          src={item.thumbnail}
                          alt={item.title}
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
      </div>
    </MainLayout>
  )
}
