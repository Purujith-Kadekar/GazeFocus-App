'use client'

import { useRouter } from 'next/navigation'
import { FolderOpen, Plus, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FolderCard } from '@/components/folders/FolderCard'
import { useUIStore } from '@/store/useStore'
import type { Folder } from '@prisma/client'

interface RecentFoldersProps {
  folders: (Folder & { _count?: { playlists: number } })[]
}

export function RecentFolders({ folders }: RecentFoldersProps) {
  const router = useRouter()
  const { setAddModalOpen } = useUIStore()

  const handleFolderClick = (folder: Folder) => {
    router.push(`/folders/${folder.id}`)
  }

  if (folders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No folders yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create folders to organize your playlists
            </p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Your Folders</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => router.push('/folders')}>
          View All
        </Button>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} onClick={() => handleFolderClick(folder)} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
