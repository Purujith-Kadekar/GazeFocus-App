'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Button } from '@/components/ui/button'
import type { Channel, Video } from '@/types'

interface ChannelVideoPlayerClientProps {
  channel: Channel
  video: Video
}

export default function ChannelVideoPlayerClient({ channel, video }: ChannelVideoPlayerClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)
  const [initialTime, setInitialTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const lastProgressSaveRef = useRef(Date.now())
  // Track latest playback position for unmount / beforeunload saves.
  const latestTimeRef = useRef(0)
  const latestDurationRef = useRef(0)

  const saveProgress = useCallback((currentTime: number, duration: number) => {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtubeId: video.youtubeId,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
      }),
    })
  }, [video.youtubeId])

  /** Fire-and-forget progress save suitable for page-unload / unmount. */
  const sendProgressBeacon = useCallback(() => {
    if (latestTimeRef.current > 0) {
      const body = JSON.stringify({
        youtubeId: video.youtubeId,
        currentTime: Math.floor(latestTimeRef.current),
        duration: Math.floor(latestDurationRef.current),
      })
      navigator.sendBeacon('/api/progress', new Blob([body], { type: 'application/json' }))
    }
  }, [video.youtubeId])

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
    const fetchProgress = async () => {
      try {
        const progressRes = await fetch(`/api/progress?youtubeId=${video.youtubeId}`)
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          if (progressData.progress) {
            setInitialTime(progressData.progress.secondsWatched || 0)
            setIsCompleted(progressData.progress.completed || false)
          }
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProgress()
  }, [video.youtubeId])

  const handleMarkComplete = async () => {
    const newCompleted = !isCompleted
    setIsCompleted(newCompleted)
    try {
      await fetch(`/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: video.youtubeId,
          completed: newCompleted
        }),
      })
    } catch (error) {
      console.error('Failed to update completion status:', error)
      setIsCompleted(!newCompleted)
    }
  }

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

        <VideoPlayer
          videoId={video.youtubeId}
          title={video.title}
          description={video.description || undefined}
          thumbnail={video.thumbnail || undefined}
          initialTime={initialTime}
          isCompleted={isCompleted}
          onMarkComplete={handleMarkComplete}
          onProgress={(currentTime, duration) => {
            // Always track latest position for unmount / beforeunload saves.
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
            console.log('Video completed!')
            setIsCompleted(true)
          }}
        />
      </div>
    </MainLayout>
  )
}
