'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from '@/components/ui/StableImage'
import { ArrowLeft, Play, Loader2, Radio, Users, Grid, List, Eye, RefreshCw } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Channel, Video } from '@/types'

interface LiveVideo {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  liveBroadcastContent: string
  actualStartTime?: string
  actualEndTime?: string
  scheduledStartTime?: string
  viewerCount?: string | null
}

interface ChannelDetailClientProps {
  channel: Channel
  initialVideos: Video[]
}

export default function ChannelDetailClient({ channel: initialChannel, initialVideos }: ChannelDetailClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [channel, setChannel] = useState<Channel>(initialChannel)
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [liveVideos, setLiveVideos] = useState<LiveVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // If initialVideos is empty, try to fetch from API as fallback
  useEffect(() => {
    if (initialVideos.length === 0 && channel.id) {
      fetch(`/api/videos?channelId=${channel.id}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (data.length > 0) {
            setVideos(data)
          }
        })
        .catch(() => {})
    }
  }, [initialVideos.length, channel.id])

  const fetchLiveVideos = useCallback(async () => {
    setIsLoading(true)
    setLiveError(null)
    try {
      const response = await fetch(`/api/channels/${channel.id}/live?mode=refresh`)
      if (response.ok) {
        const data = await response.json()
        setLiveVideos(Array.isArray(data) ? data : (data.videos || []))
      } else {
        const errorData = await response.json().catch(() => ({}))
        setLiveError(errorData.error || 'Failed to load live streams')
      }
    } catch (error) {
      console.error('Failed to fetch live videos:', error)
      setLiveError('Failed to load live streams')
    } finally {
      setIsLoading(false)
    }
  }, [channel.id])

  useEffect(() => {
    // Auto-fetch live videos on load to check for live status
    fetchLiveVideos()
  }, [fetchLiveVideos])

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
      <div className="space-y-6 overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.push('/channels')} className="min-w-0">
            <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">Back to Channels</span>
          </Button>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
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
              <Radio className="h-4 w-4 mr-2" />
              Live
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 shrink-0 flex justify-center md:justify-start">
            {channel.thumbnail?.trim() ? (
              <Image
                src={channel.thumbnail.trim()}
                alt={channel.title}
                width={256}
                height={256}
                className={cn(
                  'w-32 h-32 md:w-64 md:h-64 object-cover rounded-full',
                  channel.isLive && 'ring-4 ring-red-500'
                )}
              />
            ) : (
              <div className="w-32 h-32 md:w-64 md:h-64 flex items-center justify-center bg-muted rounded-full">
                <Users className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold truncate">{channel.title}</h1>
              {channel.isLive && (
                <Badge className="bg-red-600 text-white animate-pulse shrink-0">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  LIVE
                </Badge>
              )}
            </div>
            {channel.description && (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-sm md:text-base">{channel.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs md:text-sm text-muted-foreground">
              {channel.subscriberCount && (
                <span>{formatSubscriberCount(channel.subscriberCount)} subscribers</span>
              )}
              {channel.videoCount && (
                <span>{channel.videoCount} videos</span>
              )}
            </div>
            {channel.isLive && channel.liveTitle && (
              <div className="mt-4 p-3 md:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start md:items-center gap-3">
                  <Radio className="h-5 w-5 text-red-500 animate-pulse mt-1 md:mt-0 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-500 text-sm">Currently Live</p>
                    <p className="text-xs md:text-sm line-clamp-1">{channel.liveTitle}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 shrink-0"
                    onClick={() => channel.liveVideoId && router.push(`/channel/${channel.id}/live/${channel.liveVideoId}`)}
                  >
                    <Play className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Watch Now</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 min-w-0">
                <Play className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                <span className="truncate">Recent Videos</span>
              </h2>
              <Button variant="outline" size="sm" onClick={() => router.push(`/channel/${channel.id}/videos`)} className="shrink-0 text-xs">
                View All
              </Button>
            </div>

            {videos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Play className="h-8 w-8 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-2">No videos synced yet</p>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/channel/${channel.id}/videos`)}>
                    Go to Videos Page
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {videos.slice(0, 8).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => router.push(`/channel/${channel.id}/videos/${video.youtubeId}`)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Live & Past Streams
              </h2>
              <Button variant="outline" size="sm" onClick={() => router.push(`/channel/${channel.id}/live`)}>
                View All Live
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Checking for live videos...</span>
              </div>
            ) : liveError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Radio className="h-8 w-8 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">{liveError}</p>
                  <Button variant="outline" size="sm" onClick={fetchLiveVideos}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : liveVideos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Radio className="h-8 w-8 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">No current or recent live streams</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {liveVideos.slice(0, 4).map((video) => (
                  <LiveVideoCard
                    key={video.youtubeId}
                    video={video}
                    onClick={() => router.push(`/channel/${channel.id}/live/${video.youtubeId}`)}
                  />
                ))}
              </div>
            )}
          </div>
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
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
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
          <Image src={video.thumbnail} alt={video.title} fill sizes="160px" className="w-full h-full object-cover" />
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

function LiveVideoCard({ video, onClick }: { video: LiveVideo; onClick: () => void }) {
  const isLive = video.liveBroadcastContent === 'live'
  const isUpcoming = video.liveBroadcastContent === 'upcoming'

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all group overflow-hidden" onClick={onClick}>
      <CardContent className="p-0">
        <div className="relative aspect-video">
          {video.thumbnail ? (
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Radio className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="absolute top-2 left-2 flex items-center gap-2">
            {isLive && (
              <Badge className="bg-red-600 text-white animate-pulse">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                LIVE
              </Badge>
            )}
            {isUpcoming && (
              <Badge className="bg-blue-600 text-white">
                UPCOMING
              </Badge>
            )}
            {!isLive && !isUpcoming && (
              <Badge variant="secondary" className="bg-black/70 text-white">
                PAST STREAM
              </Badge>
            )}
          </div>
          {video.viewerCount && isLive && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="bg-black/70 text-white">
                <Eye className="h-3 w-3 mr-1" />
                {formatViewerCount(video.viewerCount)}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium line-clamp-2 text-sm">{video.title}</h3>
          {isLive && video.viewerCount && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatViewerCount(video.viewerCount)} watching
            </p>
          )}
          {isUpcoming && video.scheduledStartTime && (
            <p className="text-xs text-muted-foreground mt-1">
              Starts {formatDate(video.scheduledStartTime)}
            </p>
          )}
          {!isLive && !isUpcoming && (video.actualStartTime || video.publishedAt) && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(video.actualStartTime || video.publishedAt)}
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

function formatViewerCount(count: string): string {
  const num = parseInt(count)
  if (isNaN(num)) return count
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
