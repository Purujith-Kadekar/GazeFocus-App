'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, Radio } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Channel } from '@/types'

interface LiveVideoInfo {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  liveBroadcastContent: string
  viewerCount?: string | null
}

interface ChannelLivePlayerClientProps {
  channel: Channel
  videoId: string
}

export default function ChannelLivePlayerClient({ channel, videoId }: ChannelLivePlayerClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videoInfo, setVideoInfo] = useState<LiveVideoInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchLiveVideoInfo = async () => {
      try {
        const response = await fetch(`/api/channels/${channel.id}/live`)
        if (response.ok) {
          const videos = await response.json()
          const found = videos.find((v: LiveVideoInfo) => v.youtubeId === videoId)
          if (found) {
            setVideoInfo(found)
          }
        }
      } catch (error) {
        console.error('Failed to fetch live video info:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLiveVideoInfo()
  }, [channel.id, videoId])

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  const isLive = videoInfo?.liveBroadcastContent === 'live'
  const isUpcoming = videoInfo?.liveBroadcastContent === 'upcoming'

  return (
    <MainLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/channel/${channel.id}`)}
          className="hover:bg-accent/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {channel.title}
        </Button>

        {(isLive || isUpcoming) && (
          <div className="flex items-center gap-3">
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
            {isLive && videoInfo?.viewerCount && (
              <Badge variant="secondary">
                <Radio className="h-3 w-3 mr-1" />
                {videoInfo.viewerCount} watching
              </Badge>
            )}
          </div>
        )}

        <VideoPlayer
          videoId={videoId}
          title={videoInfo?.title || 'Live Stream'}
          description={videoInfo?.description || undefined}
          thumbnail={videoInfo?.thumbnail || undefined}
          initialTime={0}
          isCompleted={false}
          onMarkComplete={() => {}}
          onProgress={() => {}}
          onComplete={() => {}}
        />
      </div>
    </MainLayout>
  )
}
