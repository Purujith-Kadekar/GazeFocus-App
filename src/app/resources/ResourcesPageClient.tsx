'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Link2, ExternalLink, Loader2, Trash2, MoreVertical, Plus, FolderOpen, Search } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { readRouteCache, writeRouteCache } from '@/lib/route-data-cache'
import type { Folder, Resource } from '@/types'

const RESOURCES_CACHE_KEY = 'gazefocus:resources-page-cache'

type ResourcesCache = { resources: Resource[]; folders: Folder[] }

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** First letter avatar tile — no external favicon service needed. */
function LinkTile({ host }: { host: string }) {
  const letter = (host[0] || '?').toUpperCase()
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/40 dark:to-blue-900/20">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-sm">
        {letter}
      </div>
    </div>
  )
}

export default function ResourcesPageClient() {
  const { status } = useSession()
  const router = useRouter()

  const cached = useMemo(() => readRouteCache<ResourcesCache>(RESOURCES_CACHE_KEY), [])
  const [resources, setResources] = useState<Resource[]>(cached?.payload.resources || [])
  const [folders, setFolders] = useState<Folder[]>(cached?.payload.folders || [])
  const [isLoading, setIsLoading] = useState(!cached?.payload)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const persistCache = useCallback((next: { resources?: Resource[]; folders?: Folder[] }) => {
    writeRouteCache(RESOURCES_CACHE_KEY, {
      resources: next.resources ?? resources,
      folders: next.folders ?? folders,
    })
  }, [resources, folders])

  const loadAll = useCallback(async () => {
    try {
      const [resourcesRes, foldersRes] = await Promise.all([
        fetch('/api/resources'),
        fetch('/api/folders'),
      ])
      if (resourcesRes.ok) {
        const data = await resourcesRes.json()
        const next = Array.isArray(data) ? data : []
        setResources(next)
        persistCache({ resources: next })
      }
      if (foldersRes.ok) {
        const data = await foldersRes.json()
        const next = Array.isArray(data) ? data : []
        setFolders(next)
        persistCache({ folders: next })
      }
    } catch {
      // keep cached data
    } finally {
      setIsLoading(false)
    }
  }, [persistCache])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated') void loadAll()
  }, [status, router, loadAll])

  // Another surface added/changed a link — refresh.
  useEffect(() => {
    const handleRefresh = () => {
      fetch('/api/resources')
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const next = Array.isArray(data) ? data : []
          setResources(next)
          persistCache({ resources: next })
        })
        .catch(() => {})
    }
    window.addEventListener('refresh-resources', handleRefresh)
    return () => window.removeEventListener('refresh-resources', handleRefresh)
  }, [persistCache])

  const handleDelete = async (resource: Resource, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await fetch(`/api/resources/${resource.id}`, { method: 'DELETE' })
      if (res.ok) {
        const next = resources.filter((r) => r.id !== resource.id)
        setResources(next)
        persistCache({ resources: next })
      }
    } catch (error) {
      console.error('Failed to delete resource:', error)
    }
  }

  const handleMoveToFolder = async (resource: Resource, folderId: string | null, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      })
      if (res.ok) {
        const next = resources.map((r) =>
          r.id === resource.id
            ? { ...r, folderId, folder: folderId ? (folders.find((f) => f.id === folderId) ? { id: folderId, title: folders.find((f) => f.id === folderId)!.title } : r.folder) : null }
            : r
        )
        setResources(next)
        persistCache({ resources: next })
        window.dispatchEvent(new CustomEvent('refresh-folders'))
      }
    } catch (error) {
      console.error('Failed to move resource:', error)
    }
  }

  const q = searchQuery.trim().toLowerCase()
  const visible = q
    ? resources.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.externalId.toLowerCase().includes(q) ||
          (r.folder?.title || '').toLowerCase().includes(q)
      )
    : resources

  const unfiledCount = resources.filter((r) => !r.folderId).length
  const filedCount = resources.length - unfiledCount

  const handleOpen = (resource: Resource) => {
    const url = resource.metadata?.url || resource.externalId
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="px-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">Resources</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {resources.length} link{resources.length !== 1 ? 's' : ''} saved
              {resources.length > 0 && (
                <> · {filedCount} in folders · {unfiledCount} unfiled</>
              )}
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} id="onboarding-add-resource">
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search links by title, URL, or folder..."
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/50" />
          </div>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No links yet — save websites, docs, articles, and courses here
              </p>
              <Button onClick={() => setIsAddOpen(true)}>Add your first link</Button>
            </CardContent>
          </Card>
        ) : visible.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No links match &quot;{searchQuery.trim()}&quot;</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {visible.map((resource) => {
              const host = hostOf(resource.externalId)
              return (
                <div key={resource.id} className="relative group">
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all h-full"
                    onClick={() => handleOpen(resource)}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-video rounded-t-lg overflow-hidden bg-muted">
                        <LinkTile host={host} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <ExternalLink className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium line-clamp-2">{resource.title || host}</h3>
                        <p className="text-sm text-muted-foreground mt-1 truncate">{host}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                            Link
                          </Badge>
                          {resource.folder?.title && (
                            <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <FolderOpen className="h-3 w-3" />
                              {resource.folder.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-8 w-8 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuLabel>Move to folder</DropdownMenuLabel>
                      {folders.length === 0 ? (
                        <DropdownMenuItem disabled>No folders yet</DropdownMenuItem>
                      ) : (
                        folders.map((folder) => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={(e) => handleMoveToFolder(resource, folder.id, e as unknown as React.MouseEvent)}
                          >
                            <FolderOpen className="mr-2 h-4 w-4" />
                            {folder.title}
                          </DropdownMenuItem>
                        ))
                      )}
                      {resource.folderId && (
                        <DropdownMenuItem onClick={(e) => handleMoveToFolder(resource, null, e as unknown as React.MouseEvent)}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Remove from folder
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                        onClick={(e) => handleDelete(resource, e as unknown as React.MouseEvent)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddLinkModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        folders={folders}
        onAdded={() => {
          void loadAll()
          window.dispatchEvent(new CustomEvent('refresh-folders'))
        }}
      />
    </MainLayout>
  )
}

// ─── Add Link Modal ───────────────────────────────────────────────

interface AddLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: Folder[]
  onAdded: () => void
}

export function AddLinkModal({ open, onOpenChange, folders, onAdded }: AddLinkModalProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [folderId, setFolderId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setUrl('')
      setTitle('')
      setDescription('')
      setFolderId('')
      setError(null)
    }
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          folderId: folderId || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to add link' }))
        setError(typeof data?.error === 'string' ? data.error : 'Failed to add link')
        return
      }

      onOpenChange(false)
      onAdded()
    } catch {
      setError('Network error — please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = url.trim().length > 3 && !isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Resource Link</DialogTitle>
          <DialogDescription>
            Save any website — docs, articles, GitHub repos, courses — to your library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://docs.python.org/3/tutorial"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-title">Title (optional)</Label>
            <Input
              id="link-title"
              placeholder="Python 3 tutorial"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-desc">Note (optional)</Label>
            <Input
              id="link-desc"
              placeholder="What is this link for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-folder">Folder (optional)</Label>
            <select
              id="link-folder"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">No folder (keep on Resources page)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.title}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
