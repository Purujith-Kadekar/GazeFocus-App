'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Button } from '@/components/ui/button'
import type { Video, Playlist } from '@prisma/client'

interface VideoWithPlaylist extends Video {
  playlist?: Playlist | null
}

export default function PlaylistVideoPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [video, setVideo] = useState<VideoWithPlaylist | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  
  const playlistId = params.playlistId as string
  const videoId = params.videoId as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    async function loadData() {
      if (!playlistId || !videoId || status !== 'authenticated') return
      
      try {
        // Fetch playlist details
        const playlistRes = await fetch(`/api/playlists/${playlistId}`)
        if (playlistRes.ok) {
          const playlistData = await playlistRes.json()
          setPlaylist(playlistData)
        }

        // Fetch all videos in this playlist
        const videosRes = await fetch(`/api/videos?playlistId=${playlistId}`)
        if (videosRes.ok) {
          const videosData = await videosRes.json()
          setPlaylistVideos(videosData)
          
          // Find current video index
          const idx = videosData.findIndex((v: Video) => v.youtubeId === videoId)
          if (idx !== -1) {
            setCurrentIndex(idx)
            setVideo(videosData[idx])
          }
        }

        // Fetch completion status
        const progressRes = await fetch(`/api/progress?youtubeId=${videoId}`)
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setIsCompleted(progressData?.completed || false)
        }
      } catch (error) {
        console.error('Failed to load video:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [playlistId, videoId, status])

  const handleMarkComplete = async () => {
    if (!video) return
    
    const newCompleted = !isCompleted
    setIsCompleted(newCompleted)
    
    try {
      await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: newCompleted }),
      })
    } catch (error) {
      console.error('Failed to update completion status:', error)
      setIsCompleted(!newCompleted)
    }
  }

  const navigateToVideo = (index: number) => {
    if (index < 0 || index >= playlistVideos.length) return
    const targetVideo = playlistVideos[index]
    router.push(`/playlist/${playlistId}/video/${targetVideo.youtubeId}`)
  }

  const handlePrevious = () => {
    navigateToVideo(currentIndex - 1)
  }

  const handleNext = () => {
    navigateToVideo(currentIndex + 1)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!video || !playlist) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <p className="text-muted-foreground mb-4">The video you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/playlist/${playlistId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {playlist.title}
          </Button>
          
          {/* Playlist Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {playlistVideos.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === playlistVideos.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <VideoPlayer
          videoId={video.youtubeId}
          title={video.title}
          thumbnail={video.thumbnail || undefined}
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
            // Auto-advance to next video
            if (currentIndex < playlistVideos.length - 1) {
              handleNext()
            }
          }}
        />
      </div>
    </MainLayout>
  )
}
