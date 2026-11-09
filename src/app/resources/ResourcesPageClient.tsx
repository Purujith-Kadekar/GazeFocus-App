'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  ExternalLink,
  FolderOpen,
  Globe,
  Link2,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { readRouteCache, writeRouteCache } from '@/lib/route-data-cache'
import { useToast } from '@/hooks/use-toast'
import type { Folder, Resource } from '@/types'

const RESOURCES_CACHE_KEY = 'gazefocus:resources-page-cache'

type FolderLite = Pick<Folder, 'id' | 'title'>
type ResourcesCache = { resources: Resource[]; folders: FolderLite[] }

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function AddLinkDialog({
  open,
  onOpenChange,
  folders,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FolderLite[]
  onAdded: () => Promise<void>
}) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [folderId, setFolderId] = useState<string>('none')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setUrl('')
      setTitle('')
      setDescription('')
      setFolderId('none')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          folderId: folderId === 'none' ? null : folderId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as Record<string, unknown>))
        const detail = typeof data?.detail === 'string' ? ` — ${data.detail}` : ''
        setError(typeof data?.error === 'string' ? `${data.error}${detail}` : 'Failed to add link')
        return
      }

      await onAdded()
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
          <DialogTitle>Add a link</DialogTitle>
          <DialogDescription>
            Paste any URL — docs, an article, a GitHub repo, a course page.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-url">URL</Label>
            <Input
              id="resource-url"
              placeholder="https://docs.python.org/3/tutorial"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-title">Title (optional)</Label>
            <Input
              id="resource-title"
              placeholder="Python Tutorial"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-desc">Description (optional)</Label>
            <Textarea
              id="resource-desc"
              placeholder="What is this link for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {folders.length > 0 && (
            <div className="space-y-2">
              <Label>Folder</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ResourcesPageClient() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [resources, setResources] = useState<Resource[]>([])
  const [folders, setFolders] = useState<FolderLite[]>([])
  // True once real data is on screen (from cache or server). The flash
  // fix: counts and empty states render only when isReady, never while
  // the first fetch is in flight.
  const [isReady, setIsReady] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const resourcesRef = useRef<Resource[]>([])
  const foldersRef = useRef<FolderLite[]>([])

  useEffect(() => {
    resourcesRef.current = resources
  }, [resources])
  useEffect(() => {
    foldersRef.current = folders
  }, [folders])

  const persistCache = useCallback(
    (next: { resources?: Resource[]; folders?: FolderLite[] }) => {
      writeRouteCache(RESOURCES_CACHE_KEY, {
        resources: next.resources ?? resourcesRef.current,
        folders: next.folders ?? foldersRef.current,
      })
    },
    []
  )

  const applyFetched = useCallback(
    (nextResources: Resource[], nextFolders: FolderLite[]) => {
      setResources(nextResources)
      setFolders(nextFolders)
      persistCache({ resources: nextResources, folders: nextFolders })
      setIsReady(true)
    },
    [persistCache]
  )

  const load = useCallback(async () => {
    const [resRes, folRes] = await Promise.all([
      fetch('/api/resources'),
      fetch('/api/folders'),
    ]).catch(() => [null, null] as const)

    if (resRes?.ok) {
      const data = await resRes.json().catch(() => null)
      if (Array.isArray(data)) {
        const folderList = folRes?.ok
          ? await folRes.json().catch(() => [] as FolderLite[])
          : foldersRef.current
        applyFetched(data as Resource[], Array.isArray(folderList) ? folderList : [])
        return
      }
    }
    // Fetch failed or returned an unexpected body: stop the loading
    // state so the page stays usable (retry by navigating). Matches how
    // the playlists page degrades when the API is unreachable.
    setIsReady(true)
  }, [applyFetched])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    const entry = readRouteCache<ResourcesCache>(RESOURCES_CACHE_KEY)
    if (entry?.payload && Array.isArray(entry.payload.resources)) {
      // Render from cache instantly — the count shown is the real
      // last-known count, not a false zero — then converge to server
      // truth in the background.
      setResources(entry.payload.resources)
      setFolders(entry.payload.folders || [])
      setIsReady(true)
      void load()
    } else {
      // First visit ever: skeleton until the fetch lands.
      void load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Re-fetch when a link is added from elsewhere (e.g. search page).
  useEffect(() => {
    const handler = () => {
      void load().then(() => {
        toast({ title: 'Resource saved', description: 'The link is now in your resources.' })
      })
    }
    window.addEventListener('gazefocus:resources-changed', handler)
    return () => window.removeEventListener('gazefocus:resources-changed', handler)
  }, [load, toast])

  const refresh = useCallback(async () => {
    await load()
    setDialogOpen(false)
    toast({ title: 'Link saved', description: 'Added to your resources.' })
  }, [load, toast])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/resources/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      const next = resourcesRef.current.filter((r) => r.id !== deleteTarget.id)
      setResources(next)
      persistCache({ resources: next })
      toast({ title: 'Link removed' })
    } catch {
      toast({ title: 'Failed to delete link', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, persistCache, toast])

  const moveResource = useCallback(
    async (resource: Resource, folderId: string | null) => {
      const prev = resourcesRef.current
      const target = folderId ? foldersRef.current.find((f) => f.id === folderId) : undefined
      const next = prev.map((r) =>
        r.id === resource.id
          ? { ...r, folderId, folder: folderId && target ? { id: folderId, title: target.title } : null }
          : r
      )
      setResources(next)
      persistCache({ resources: next })
      try {
        const res = await fetch(`/api/resources/${resource.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId }),
        })
        if (!res.ok) throw new Error('move failed')
        toast({ title: folderId ? 'Moved to folder' : 'Removed from folder' })
      } catch {
        setResources(prev)
        persistCache({ resources: prev })
        toast({ title: 'Failed to move link', variant: 'destructive' })
      }
    },
    [persistCache, toast]
  )

  const isLoading = status === 'loading' || (status === 'authenticated' && !isReady)

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} aria-label="Back to dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Resources</h1>
              <p className="text-sm text-muted-foreground">
                {resources.length} link{resources.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        </div>

        {isReady && resources.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Globe className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No links yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use “Add Link” above to save your first website.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id} className="group transition-shadow hover:shadow-md">
                <CardContent className="flex gap-3 p-4">
                  <a
                    href={resource.externalId}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    aria-label={`Open ${resource.title}`}
                  >
                    <Link2 className="h-5 w-5" />
                  </a>
                  <div className="min-w-0 flex-1">
                    <a
                      href={resource.externalId}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-medium hover:underline"
                      title={resource.title}
                    >
                      {resource.title || hostOf(resource.externalId)}
                    </a>
                    <p className="truncate text-xs text-muted-foreground">{hostOf(resource.externalId)}</p>
                    {resource.folder && (
                      <Badge variant="secondary" className="mt-1.5">
                        {resource.folder.title}
                      </Badge>
                    )}
                    {resource.metadata?.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                        {resource.metadata.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <a
                      href={resource.externalId}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Open link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Link actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {folders.length > 0 && (
                          <>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="gap-2">
                                <FolderOpen className="h-4 w-4" /> Move to folder
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {folders.map((f) => (
                                  <DropdownMenuItem key={f.id} onClick={() => moveResource(resource, f.id)}>
                                    {f.title}
                                    {resource.folder?.id === f.id && <span className="ml-auto text-primary">✓</span>}
                                  </DropdownMenuItem>
                                ))}
                                {resource.folderId && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => moveResource(resource, null)}>
                                      Remove from folder
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(resource)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        folders={folders}
        onAdded={refresh}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this link?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.title}” will be removed from your resources. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
