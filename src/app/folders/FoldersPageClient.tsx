'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, FolderOpen, Trash2, MoreVertical } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Folder } from '@/types'

interface FoldersPageClientProps {
  initialFolders: Folder[]
}

export default function FoldersPageClient({ initialFolders }: FoldersPageClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [folders, setFolders] = useState<Folder[]>(initialFolders)

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
      setFolders(folders.filter(f => f.id !== folderId))
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Folders</h1>
          <p className="text-muted-foreground">
            Organize your videos and playlists into folders
          </p>
        </div>

        {folders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-md transition-shadow cursor-pointer min-h-[140px] flex flex-col"
                onClick={() => router.push(`/folders/${folder.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-amber-500" />
                      <CardTitle className="text-base line-clamp-1">{folder.title}</CardTitle>
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
                <CardContent className="mt-auto">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {folder.description || 'No description'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No folders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create folders from the dashboard to organize your content
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
