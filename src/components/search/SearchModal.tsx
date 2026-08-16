'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from '@/components/ui/StableImage'
import { Search, X, Loader2, List, Video, Users, Library } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { Video as VideoRow, Playlist as PlaylistRow, Channel as ChannelRow } from '@/types'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type LibraryItem = {
  type: 'video' | 'playlist' | 'channel'
  id: string
  title: string
  subtitle: string | null
  thumbnail: string | null
  duration?: number | null
  href: string
}

/**
 * Library search — searches the user's OWN videos, playlists,
 * and channels (fetched in one call from the dashboard bootstrap
 * endpoint) and navigates to the item on click. Searching YouTube
 * to add new content lives on the /search page and the + button.
 */
export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [library, setLibrary] = useState<LibraryItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const inputRef = useRef<HTMLInputElement>(null)

  const loadLibrary = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/dashboard/bootstrap', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load library')
      const data = await res.json()

      const items: LibraryItem[] = [
        ...((data.videos || []) as VideoRow[]).map((v) => ({
          type: 'video' as const,
          id: v.id,
          title: v.title,
          subtitle: null,
          thumbnail: v.thumbnail,
          duration: v.duration,
          href: `/video/${v.youtubeId}`,
        })),
        ...((data.playlists || []) as PlaylistRow[]).map((p) => ({
          type: 'playlist' as const,
          id: p.id,
          title: p.title,
          subtitle: p.channelName || null,
          thumbnail: p.thumbnail,
          href: `/playlist/${p.id}`,
        })),
        ...((data.channels || []) as ChannelRow[]).map((c) => ({
          type: 'channel' as const,
          id: c.id,
          title: c.title,
          subtitle: null,
          thumbnail: c.thumbnail,
          href: `/channel/${c.id}`,
        })),
      ]
      setLibrary(items)
    } catch (error) {
      console.error('Library search failed to load:', error)
      setLibrary([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      if (!library) void loadLibrary()
    }
  }, [open, library, loadLibrary])

  const q = query.trim().toLowerCase()
  const results = q
    ? (library || []).filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          (item.subtitle?.toLowerCase().includes(q) ?? false) ||
          item.id.toLowerCase().includes(q)
      )
    : []

  const counts = {
    all: results.length,
    video: results.filter((r) => r.type === 'video').length,
    playlist: results.filter((r) => r.type === 'playlist').length,
    channel: results.filter((r) => r.type === 'channel').length,
  }

  const visible = activeTab === 'all' ? results : results.filter((r) => r.type === activeTab)

  const goTo = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] grid-rows-[auto_auto_1fr]">
        <DialogHeader>
          <DialogTitle>Search your library</DialogTitle>
          <DialogDescription>
            Find videos, playlists, and channels you&apos;ve saved. Use the + button to add new content.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search your library..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {(isLoading || !library) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {library && q && results.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="overflow-hidden flex flex-col min-h-0">
            <TabsList className="shrink-0">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="video">Videos ({counts.video})</TabsTrigger>
              <TabsTrigger value="playlist">Playlists ({counts.playlist})</TabsTrigger>
              <TabsTrigger value="channel">Channels ({counts.channel})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 overflow-y-auto min-h-0 flex-1">
              <div className="space-y-3 pr-2">
                {visible.map((item) => (
                  <LibraryResultCard key={`${item.type}-${item.id}`} item={item} onClick={() => goTo(item.href)} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {library && q && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No matches for &quot;{query.trim()}&quot; in your library</p>
          </div>
        )}

        {library && !q && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Library className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Start typing to search your saved videos, playlists, and channels</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function LibraryResultCard({ item, onClick }: { item: LibraryItem; onClick: () => void }) {
  return (
    <div
      className="flex gap-3 rounded-lg border p-3 transition-colors cursor-pointer hover:bg-accent"
      onClick={onClick}
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-muted sm:h-20 sm:w-32">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 96px, 128px"
            className={item.type === 'channel' ? 'w-full h-full object-cover rounded-full' : 'w-full h-full object-cover'}
            onError={(e) => {
              e.currentTarget.src = '/placeholder.png'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            {item.type === 'video' ? (
              <Video className="h-8 w-8 text-muted-foreground" />
            ) : item.type === 'playlist' ? (
              <List className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Users className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        )}
        {item.type === 'playlist' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex items-center gap-1 text-white">
              <List className="h-4 w-4" />
            </div>
          </div>
        )}
        {item.type === 'video' && item.duration ? (
          <Badge className="absolute bottom-1 right-1 text-[10px] px-1" variant="secondary">
            {formatDuration(item.duration)}
          </Badge>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 self-center">
        <h4 className="font-medium line-clamp-2">{item.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
          {item.subtitle && <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
