'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Play, Loader2, Radio, Users, Grid, List, Eye } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<'videos' | 'live'>('videos')
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [liveVideos, setLiveVideos] = useState<LiveVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const fetchLiveVideos = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/channels/${channel.id}/live`)
      if (response.ok) {
        const data = await response.json()
        setLiveVideos(data)
      }
    } catch (error) {
      console.error('Failed to fetch live videos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [channel.id])

  useEffect(() => {
    if (activeTab === 'live') {
      fetchLiveVideos()
    }
  }, [activeTab, fetchLiveVideos])

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
              variant={activeTab === 'videos' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('videos')}
            >
              <Play className="h-4 w-4 mr-2" />
              Videos
            </Button>
            <Button
              variant={activeTab === 'live' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('live')}
            >
              <Radio className="h-4 w-4 mr-2" />
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{channel.title}</h1>
              {channel.isLive && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  LIVE
                </Badge>
              )}
            </div>
            {channel.description && (
              <p className="text-muted-foreground mt-2 line-clamp-2">{channel.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {channel.subscriberCount && (
                <span>{formatSubscriberCount(channel.subscriberCount)} subscribers</span>
              )}
              {channel.videoCount && (
                <span>{channel.videoCount} videos</span>
              )}
            </div>
            {channel.isLive && channel.liveTitle && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                  <div className="flex-1">
                    <p className="font-medium text-red-500">Currently Live</p>
                    <p className="text-sm">{channel.liveTitle}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => channel.liveVideoId && router.push(`/channel/${channel.id}/live/${channel.liveVideoId}`)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          {activeTab === 'videos' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Videos
                </h2>
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

              {videos.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Play className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No videos synced yet</p>
                    <Button variant="outline" onClick={() => router.push(`/channel/${channel.id}/videos`)}>
                      Go to Videos Page
                    </Button>
                  </CardContent>
                </Card>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => router.push(`/channel/${channel.id}/videos/${video.youtubeId}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <VideoListItem
                      key={video.id}
                      video={video}
                      onClick={() => router.push(`/channel/${channel.id}/videos/${video.youtubeId}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Live & Past Streams
                </h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Checking for live videos...</span>
                </div>
              ) : liveVideos.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Radio className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-2">No live streams found</p>
                    <p className="text-sm text-muted-foreground/70 mb-4">This channel has no current or recent live streams</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {liveVideos.map((video) => (
                    <LiveVideoCard
                      key={video.youtubeId}
                      video={video}
                      onClick={() => router.push(`/channel/${channel.id}/live/${video.youtubeId}`)}
                    />
                  ))}
                </div>
              )}
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

function LiveVideoCard({ video, onClick }: { video: LiveVideo; onClick: () => void }) {
  const isLive = video.liveBroadcastContent === 'live'
  const isUpcoming = video.liveBroadcastContent === 'upcoming'

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
