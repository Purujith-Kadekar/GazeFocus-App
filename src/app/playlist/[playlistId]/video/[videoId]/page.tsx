'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { Button } from '@/components/ui/button'
import type { Video, Playlist } from '@/types'

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
  const [lookupExhausted, setLookupExhausted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [initialTime, setInitialTime] = useState(0)
  const lastProgressSaveRef = useRef(Date.now())
  // Track latest playback position for unmount / beforeunload saves.
  const latestTimeRef = useRef(0)
  const latestDurationRef = useRef(0)
  const videoStateRef = useRef<VideoWithPlaylist | null>(null)
  
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
      setIsLoading(true)
      setLookupExhausted(false)
      setVideo(null)
      setPlaylist(null)
      setPlaylistVideos([])

      let resolvedPlaylist = false
      let resolvedVideo = false
      
      try {
        // Fetch playlist details
        const playlistRes = await fetch(`/api/playlists/${playlistId}`)
        if (playlistRes.ok) {
          const playlistData = await playlistRes.json()
          setPlaylist(playlistData)
          resolvedPlaylist = true
        }

        // Fetch all videos in this playlist
        const videosRes = await fetch(`/api/videos?playlistId=${playlistId}`)
        if (videosRes.ok) {
          const videosData = await videosRes.json()
          setPlaylistVideos(videosData)
          
          // Find current video index
          const idx = videosData.findIndex((v: Video) => v.youtubeId === videoId || v.id === videoId)
          if (idx !== -1) {
            setCurrentIndex(idx)
            setVideo(videosData[idx])
            resolvedVideo = true
          } else {
            const directVideoRes = await fetch(`/api/videos/${videoId}`)
            if (directVideoRes.ok) {
              const directVideo = await directVideoRes.json()
              if (directVideo?.youtubeId) {
                setVideo(directVideo)
                resolvedVideo = true
                const directIdx = videosData.findIndex((v: Video) => v.youtubeId === directVideo.youtubeId)
                if (directIdx !== -1) {
                  setCurrentIndex(directIdx)
                }
              }
            }
          }
        }

        // Fetch completion and progress status
        const [progressRes] = await Promise.all([
          fetch(`/api/progress?youtubeId=${videoId}`)
        ])
        
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          if (progressData.progress) {
            setInitialTime(progressData.progress.secondsWatched || 0)
            setIsCompleted(progressData.progress.completed || false)
          }
        }
      } catch (error) {
        console.error('Failed to load video:', error)
        setLookupExhausted(true)
      } finally {
        if (!resolvedPlaylist || !resolvedVideo) {
          setLookupExhausted(true)
        }
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
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeId: video.youtubeId, completed: newCompleted }),
      })
      if (!res.ok) throw new Error('Failed')
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

  const saveProgress = useCallback((currentTime: number, duration: number) => {
    if (!video) return
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtubeId: video.youtubeId,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
      }),
    })
  }, [video])

  // Keep videoStateRef in sync so the unmount effect can read the latest video.
  useEffect(() => { videoStateRef.current = video }, [video])

  /** Fire-and-forget progress save suitable for page-unload / unmount. */
  const sendProgressBeacon = useCallback(() => {
    if (latestTimeRef.current > 0 && videoStateRef.current) {
      const body = JSON.stringify({
        youtubeId: videoStateRef.current.youtubeId,
        currentTime: Math.floor(latestTimeRef.current),
        duration: Math.floor(latestDurationRef.current),
      })
      navigator.sendBeacon('/api/progress', new Blob([body], { type: 'application/json' }))
    }
  }, [])

  // Save progress on SPA navigation and tab/window close.
  useEffect(() => {
    window.addEventListener('beforeunload', sendProgressBeacon)
    return () => {
      window.removeEventListener('beforeunload', sendProgressBeacon)
      sendProgressBeacon()
    }
  }, [sendProgressBeacon])

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
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  if ((!video || !playlist) && !isLoading && lookupExhausted) {
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

  // Type guard: video and playlist must exist from here on
  if (!video || !playlist) {
    return null
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
