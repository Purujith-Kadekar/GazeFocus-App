'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Button } from '@/components/ui/button'
import type { Video } from '@/types'

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [video, setVideo] = useState<Video | null>(null)
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [initialTime, setInitialTime] = useState(0)
  const videoId = params.id as string
  const lastProgressSaveRef = useRef(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (!videoId) return

    const fetchData = async () => {
      try {
        const [videoRes, progressRes] = await Promise.all([
          fetch(`/api/videos?youtubeId=${videoId}`),
          fetch(`/api/progress?youtubeId=${videoId}`)
        ])

        if (videoRes.ok) {
          const videoData = await videoRes.json()
          let foundVideo = Array.isArray(videoData)
            ? videoData.find((v: Video) => v.youtubeId === videoId)
            : videoData;

          if (!foundVideo) {
            const directVideoRes = await fetch(`/api/videos/${videoId}`)
            if (directVideoRes.ok) {
              foundVideo = await directVideoRes.json()
            }
          }

          if (foundVideo) {
            setVideo(foundVideo)

            // Fetch playlist siblings for prev/next navigation
            if (foundVideo.playlistId) {
              try {
                const siblingRes = await fetch(`/api/videos?playlistId=${foundVideo.playlistId}`)
                if (siblingRes.ok) {
                  const siblings: Video[] = await siblingRes.json()
                  setPlaylistVideos(siblings)
                }
              } catch {
                // Non-critical; prev/next just won't show
              }
            }
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
        console.error('Failed to fetch video data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [videoId])

  const handleMarkComplete = async () => {
    if (!video) return

    const newCompleted = !isCompleted
    setIsCompleted(newCompleted)

    try {
      const res = await fetch(`/api/progress/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: video.youtubeId,
          completed: newCompleted
        }),
      })
      if (!res.ok) throw new Error('Server error')
    } catch (error) {
      console.error('Failed to update completion status:', error)
      setIsCompleted(!newCompleted) // Rollback on error
    }
  }

  const handleNavigateToVideo = useCallback((youtubeId: string) => {
    router.push(`/video/${youtubeId}`)
  }, [router])

  if (status === 'loading') {
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

  if (!video && !isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <p className="text-muted-foreground mb-4">The video you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="hover:bg-accent/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {video && (
          <VideoPlayer
            videoId={video.youtubeId}
            title={video.title}
            description={video.description || undefined}
            thumbnail={video.thumbnail || undefined}
            initialTime={initialTime}
            isCompleted={isCompleted}
            onMarkComplete={handleMarkComplete}
            playlistVideos={playlistVideos.length > 0 ? playlistVideos : undefined}
            onNavigateToVideo={handleNavigateToVideo}
            onProgress={(currentTime, duration) => {
              // Save progress at most once every 5 seconds to avoid excessive API calls
              const now = Date.now()
              if (now - lastProgressSaveRef.current < 5000) return
              lastProgressSaveRef.current = now
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
        )}
      </div>
    </MainLayout>
  )
}
