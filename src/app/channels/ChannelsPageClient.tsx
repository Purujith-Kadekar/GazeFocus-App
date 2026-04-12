'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from '@/components/ui/StableImage'
import { ArrowLeft, Play, Loader2, Radio, MoreVertical, Trash2, FolderPlus, Copy, RefreshCw, Users } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { readRouteCache, writeRouteCache } from '@/lib/route-data-cache'
import { getDashboardBootstrapCache } from '@/lib/dashboard-bootstrap-cache'
import type { Channel, Folder, ChannelWithFolder } from '@/types'

interface ChannelsPageClientProps {
  initialChannels?: ChannelWithFolder[]
  initialFolders?: Folder[]
}

type ChannelsPageCache = {
  channels: ChannelWithFolder[]
  folders: Folder[]
}

const CHANNELS_CACHE_KEY = 'gazefocus:channels-page-cache'

export default function ChannelsPageClient({ initialChannels, initialFolders }: ChannelsPageClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const cached = useMemo(() => readRouteCache<ChannelsPageCache>(CHANNELS_CACHE_KEY), [])
  const dashboardCached = useMemo(() => getDashboardBootstrapCache()?.payload, [])

  const initialCachedChannels =
    cached?.payload?.channels ||
    (Array.isArray(dashboardCached?.channels) ? (dashboardCached.channels as ChannelWithFolder[]) : undefined) ||
    initialChannels ||
    []
  const initialCachedFolders =
    cached?.payload?.folders ||
    (Array.isArray(dashboardCached?.folders) ? (dashboardCached.folders as Folder[]) : undefined) ||
    initialFolders ||
    []

  const [channels, setChannels] = useState<ChannelWithFolder[]>(initialCachedChannels)
  const [folders, setFolders] = useState<Folder[]>(initialCachedFolders)
  const [syncingChannels, setSyncingChannels] = useState<Set<string>>(new Set())
  const channelsRef = useRef<ChannelWithFolder[]>(initialCachedChannels)
  const foldersRef = useRef<Folder[]>(initialCachedFolders)

  useEffect(() => {
    channelsRef.current = channels
  }, [channels])

  useEffect(() => {
    foldersRef.current = folders
  }, [folders])

  const persistCache = useCallback((next: { channels?: ChannelWithFolder[]; folders?: Folder[] }) => {
    writeRouteCache(CHANNELS_CACHE_KEY, {
      channels: next.channels ?? channelsRef.current,
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

    const loadChannels = async () => {
      try {
        const [channelsRes, foldersRes] = await Promise.all([
          fetch('/api/channels'),
          fetch('/api/folders'),
        ])

        if (cancelled) return

        let nextChannels = channelsRef.current
        let nextFolders = foldersRef.current

        if (channelsRes.ok) {
          const data = await channelsRes.json()
          nextChannels = Array.isArray(data) ? data : []
        }

        if (foldersRes.ok) {
          const data = await foldersRes.json()
          nextFolders = Array.isArray(data) ? data : []
        }

        if (cancelled) return
        setChannels(nextChannels)
        setFolders(nextFolders)
        persistCache({ channels: nextChannels, folders: nextFolders })
      } catch {
        // keep cached channels
      }
    }

    void loadChannels()

    return () => {
      cancelled = true
    }
  }, [persistCache])

  useEffect(() => {
    const handleRefresh = () => {
      fetch('/api/channels')
        .then(r => r.ok ? r.json() : [])
        .then((data) => {
          const nextChannels = Array.isArray(data) ? data : []
          setChannels(nextChannels)
          persistCache({ channels: nextChannels })
        })
        .catch(() => {})
    }
    window.addEventListener('refresh-channels', handleRefresh)
    return () => window.removeEventListener('refresh-channels', handleRefresh)
  }, [persistCache])

  const handleRefreshLiveStatus = async () => {
    try {
      const response = await fetch('/api/channels/live-status')
      if (response.ok) {
        const data = await response.json()
        setChannels(prev => {
          const next = prev.map(channel => {
          const liveStatus = data.channels.find((c: any) => c.channelId === channel.id)
          if (liveStatus) {
            return {
              ...channel,
              isLive: liveStatus.isLive,
              liveVideoId: liveStatus.liveVideoId,
              liveTitle: liveStatus.liveTitle,
            }
          }
          return channel
          })
          persistCache({ channels: next })
          return next
        })
      }
    } catch (error) {
      console.error('Failed to refresh live status:', error)
    }
  }

  const handleSyncChannel = async (channelId: string) => {
    setSyncingChannels(prev => new Set(prev).add(channelId))
    try {
      const response = await fetch('/api/channels/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      })
      if (response.ok) {
        const data = await response.json()
        setChannels(prev => {
          const next = prev.map(channel =>
            channel.id === channelId
              ? {
                  ...channel,
                  isLive: data.isLive,
                  liveVideoId: data.liveVideoId,
                  liveTitle: data.liveTitle,
                }
              : channel
          )
          persistCache({ channels: next })
          return next
        })
      }
    } catch (error) {
      console.error('Failed to sync channel:', error)
    } finally {
      setSyncingChannels(prev => {
        const newSet = new Set(prev)
        newSet.delete(channelId)
        return newSet
      })
    }
  }

  const handleDeleteChannel = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setChannels(prev => {
          const next = prev.filter(c => c.id !== channelId)
          persistCache({ channels: next })
          return next
        })
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      }
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
  }

  const handleCopyToFolder = async (channelId: string, folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const channel = channels.find(c => c.id === channelId)
      if (!channel) return

      const response = await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CHANNEL',
          externalId: channel.id,
          folderId,
          title: channel.title,
        }),
      })
      if (response.ok) {
        console.log('Channel copied to folder')
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      }
    } catch (error) {
      console.error('Failed to copy channel:', error)
    }
  }

  const handleMoveToFolder = async (channelId: string, folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const channel = channels.find(c => c.id === channelId)
      if (!channel) return

      const response = await fetch('/api/library-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CHANNEL',
          externalId: channel.id,
          folderId,
          title: channel.title,
        }),
      })
      if (response.ok) {
        console.log('Channel moved to folder')
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
      }
    } catch (error) {
      console.error('Failed to move channel:', error)
    }
  }

  const handleChannelClick = (channel: Channel) => {
    router.push(`/channel/${channel.id}`)
  }

  const liveChannels = channels.filter(c => c.isLive)
  const offlineChannels = channels.filter(c => !c.isLive)

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshLiveStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Live Status
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">All Channels</h1>
          <p className="text-muted-foreground">
            {channels.length} channel{channels.length !== 1 ? 's' : ''} in your library
            {liveChannels.length > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                ({liveChannels.length} live now)
              </span>
            )}
          </p>
        </div>

        {channels.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No channels yet</p>
              <Button onClick={() => router.push('/dashboard')}>
                Add Channel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {liveChannels.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Live Now
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {liveChannels.map((channel) => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isSyncing={syncingChannels.has(channel.id)}
                      onClick={() => handleChannelClick(channel)}
                      onDelete={(e) => handleDeleteChannel(channel.id, e)}
                      onSync={() => handleSyncChannel(channel.id)}
                      onCopyToFolder={(folderId, e) => handleCopyToFolder(channel.id, folderId, e)}
                      onMoveToFolder={(folderId, e) => handleMoveToFolder(channel.id, folderId, e)}
                      folders={folders}
                      showLiveBadge
                    />
                  ))}
                </div>
              </div>
            )}

            {offlineChannels.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">All Channels</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {offlineChannels.map((channel) => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isSyncing={syncingChannels.has(channel.id)}
                      onClick={() => handleChannelClick(channel)}
                      onDelete={(e) => handleDeleteChannel(channel.id, e)}
                      onSync={() => handleSyncChannel(channel.id)}
                      onCopyToFolder={(folderId, e) => handleCopyToFolder(channel.id, folderId, e)}
                      onMoveToFolder={(folderId, e) => handleMoveToFolder(channel.id, folderId, e)}
                      folders={folders}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

interface ChannelCardProps {
  channel: ChannelWithFolder
  isSyncing: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  onSync: () => void
  onCopyToFolder: (folderId: string, e: React.MouseEvent) => void
  onMoveToFolder: (folderId: string, e: React.MouseEvent) => void
  folders: Folder[]
  showLiveBadge?: boolean
}

function ChannelCard({
  channel,
  isSyncing,
  onClick,
  onDelete,
  onSync,
  onCopyToFolder,
  onMoveToFolder,
  folders,
  showLiveBadge,
}: ChannelCardProps) {
  const thumbnailSrc = channel.thumbnail?.trim()

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-all group overflow-hidden',
        channel.isLive && 'ring-2 ring-red-500'
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative pt-4">
          {thumbnailSrc ? (
            <div className={cn(
              'relative w-24 h-24 rounded-full overflow-hidden bg-muted mx-auto',
              channel.isLive && 'ring-4 ring-red-500'
            )}>
              <Image
                src={thumbnailSrc}
                alt={channel.title}
                fill
                sizes="96px"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center bg-muted">
              <Users className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {channel.isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <Badge className="bg-red-600 text-white animate-pulse">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
              </Badge>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-8 w-8 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSync() }} disabled={isSyncing}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isSyncing && 'animate-spin')} />
                {isSyncing ? 'Syncing...' : 'Sync & Check Live'}
              </DropdownMenuItem>
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
                        onClick={(e) => onCopyToFolder(folder.id, e as unknown as React.MouseEvent)}
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
                        onClick={(e) => onMoveToFolder(folder.id, e as unknown as React.MouseEvent)}
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
                onClick={(e) => onDelete(e as unknown as React.MouseEvent)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Channel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="p-3">
          <h3 className="font-medium line-clamp-2">{channel.title}</h3>
          {channel.subscriberCount && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatSubscriberCount(channel.subscriberCount)} subscribers
            </p>
          )}
          {channel.videoCount && (
            <p className="text-xs text-muted-foreground">
              {channel.videoCount} videos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function formatSubscriberCount(count: string): string {
  const num = parseInt(count)
  if (isNaN(num)) return count
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
