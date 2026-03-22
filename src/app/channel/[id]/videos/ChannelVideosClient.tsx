'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Play, Loader2, RefreshCw, Users, Grid, List } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Channel, Video } from '@/types'

interface ChannelVideosClientProps {
  channel: Channel
  initialVideos: Video[]
}

export default function ChannelVideosClient({ channel: initialChannel, initialVideos }: ChannelVideosClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [channel, setChannel] = useState<Channel>(initialChannel)
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [isSyncing, setIsSyncing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleSyncChannel = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/channels/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.id }),
      })
      if (response.ok) {
        fetchVideos()
      }
    } catch (error) {
      console.error('Failed to sync channel:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const fetchVideos = async () => {
    try {
      const response = await fetch(`/api/videos?channelId=${channel.id}`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    }
  }

  const handleVideoClick = (youtubeId: string) => {
    router.push(`/channel/${channel.id}/videos/${youtubeId}`)
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
          <Button variant="ghost" onClick={() => router.push('/channels')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Channels
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/channel/${channel.id}/videos`)}
            >
              <Play className="h-4 w-4 mr-2" />
              Videos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/channel/${channel.id}/live`)}
            >
              Live
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 shrink-0">
            {channel.thumbnail ? (
              <img
                src={channel.thumbnail}
                alt={channel.title}
                className={cn(
                  'w-full aspect-square object-cover rounded-lg',
                  channel.isLive && 'ring-4 ring-red-500'
                )}
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-muted rounded-lg">
                <Users className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{channel.title}</h1>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {channel.subscriberCount && (
                <span>{formatSubscriberCount(channel.subscriberCount)} subscribers</span>
              )}
              {channel.videoCount && (
                <span>{channel.videoCount} videos</span>
              )}
              <span>{videos.length} synced videos</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Play className="h-5 w-5" />
              Videos
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSyncChannel} disabled={isSyncing}>
                <RefreshCw className={cn('h-4 w-4 mr-2', isSyncing && 'animate-spin')} />
                Sync
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {videos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Play className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No videos synced yet</p>
                <Button onClick={handleSyncChannel} disabled={isSyncing}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', isSyncing && 'animate-spin')} />
                  Sync Videos
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} onClick={() => handleVideoClick(video.youtubeId)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map((video) => (
                <VideoListItem key={video.id} video={video} onClick={() => handleVideoClick(video.youtubeId)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-all group overflow-hidden" onClick={onClick}>
      <CardContent className="p-0">
        <div className="relative aspect-video">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {video.duration > 0 && (
            <Badge className="absolute bottom-1 right-1 text-[10px] px-1" variant="secondary">
              {formatDuration(video.duration)}
            </Badge>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium line-clamp-2 text-sm">{video.title}</h3>
        </div>
      </CardContent>
    </Card>
  )
}

function VideoListItem({ video, onClick }: { video: Video; onClick: () => void }) {
  return (
    <div
      className="flex gap-4 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="relative w-40 aspect-video shrink-0 rounded overflow-hidden">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
        {video.duration > 0 && (
          <Badge className="absolute bottom-1 right-1 text-[10px] px-1" variant="secondary">
            {formatDuration(video.duration)}
          </Badge>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium line-clamp-2">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{video.description}</p>
        )}
      </div>
    </div>
  )
}

function formatSubscriberCount(count: string): string {
  const num = parseInt(count)
  if (isNaN(num)) return count
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
