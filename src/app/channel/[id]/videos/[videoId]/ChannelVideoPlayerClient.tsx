'use client'

import { useEffect, useState } from 'react'
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
            fetch('/api/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                youtubeId: video.youtubeId,
                currentTime: Math.floor(currentTime),
                duration: Math.floor(duration),
              }),
            })
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
