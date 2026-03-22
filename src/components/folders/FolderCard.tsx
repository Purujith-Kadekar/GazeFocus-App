'use client'

import { useState } from 'react'
import { MoreVertical, Trash2, Edit, ExternalLink } from 'lucide-react'
import type { Folder } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { useFolderStore } from '@/store/useStore'
import { CreateFolderModal } from './CreateFolderModal'
import { cn } from '@/lib/utils'

interface FolderCardProps {
  folder: Folder
  onClick?: () => void
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const { removeFolder } = useFolderStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const folderColor = '#3B82F6'

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        removeFolder(folder.id)
      }
    } catch (error) {
      console.error('Failed to delete folder:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card
        className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Folder Icon */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: folderColor + '20' }}
              >
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: folderColor }}
                />
              </div>

                {/* Folder Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{folder.title}</h3>
                {folder.description && (
                  <p className="text-sm text-muted-foreground">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  setShowEditModal(true)
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{folder.title}&quot;? This will also delete all playlists
              and videos inside. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
      <CreateFolderModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        folder={folder}
      />
    </>
  )
}
