'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
  const [initialTime, setInitialTime] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const lastProgressSaveRef = useRef(Date.now())
  const latestTimeRef = useRef(0)
  const latestDurationRef = useRef(0)

  const saveProgress = useCallback((currentTime: number, duration: number) => {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtubeId: videoId,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
      }),
    }).catch((error) => console.error('Failed to save progress:', error))
  }, [videoId])

  /** Fire-and-forget progress save suitable for page-unload / unmount. */
  const sendProgressBeacon = useCallback(() => {
    if (latestTimeRef.current > 0) {
      const body = JSON.stringify({
        youtubeId: videoId,
        currentTime: Math.floor(latestTimeRef.current),
        duration: Math.floor(latestDurationRef.current),
      })
      navigator.sendBeacon('/api/progress', new Blob([body], { type: 'application/json' }))
    }
  }, [videoId])

  // Save progress on SPA navigation and tab/window close.
  useEffect(() => {
    window.addEventListener('beforeunload', sendProgressBeacon)
    return () => {
      window.removeEventListener('beforeunload', sendProgressBeacon)
      sendProgressBeacon()
    }
  }, [sendProgressBeacon])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [liveRes, progressRes] = await Promise.all([
          fetch(`/api/channels/${channel.id}/live`),
          fetch(`/api/progress?youtubeId=${videoId}`),
        ])

        if (liveRes.ok) {
          const videos = await liveRes.json()
          const found = videos.find((v: LiveVideoInfo) => v.youtubeId === videoId)
          if (found) {
            setVideoInfo(found)
          }
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json()
          if (progressData.progress) {
            setInitialTime(progressData.progress.secondsWatched || 0)
            setIsCompleted(progressData.progress.completed || false)
          }
        }
      } catch (error) {
        console.error('Failed to fetch live video info or progress:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
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
          // Resume from saved position only for past/recorded streams, not for
          // currently-live or upcoming streams where seeking to a past time is
          // either unsupported or misleading.
          initialTime={isLive || isUpcoming ? 0 : initialTime}
          isCompleted={isCompleted}
          onMarkComplete={() => {
            const newCompleted = !isCompleted
            setIsCompleted(newCompleted)
            fetch('/api/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ youtubeId: videoId, completed: newCompleted }),
            }).catch((error) => {
              console.error('Failed to update completion status:', error)
              setIsCompleted(!newCompleted)
            })
          }}
          onProgress={(currentTime, duration) => {
            latestTimeRef.current = currentTime
            latestDurationRef.current = duration
            // Throttle periodic saves to once every 10 seconds
            const now = Date.now()
            if (now - lastProgressSaveRef.current < 10000) return
            lastProgressSaveRef.current = now
            saveProgress(currentTime, duration)
          }}
          onPause={(currentTime, duration) => {
            // Save immediately when the video is paused, independently of
            // the periodic throttle so both mechanisms stay on their own schedules.
            saveProgress(currentTime, duration)
          }}
          onComplete={() => {
            setIsCompleted(true)
          }}
        />
      </div>
    </MainLayout>
  )
}
