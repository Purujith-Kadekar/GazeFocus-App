'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Eye, EyeOff, FileText, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayerStore, useEyeTrackingStore, useUIStore } from '@/store/useStore'
import { useFocusEngine } from '@/hooks/useFocusEngine'
import { formatDuration, cn } from '@/lib/utils'
import { NotesPanel } from './NotesPanel'

interface VideoPlayerProps {
  videoId: string
  title: string
  description?: string
  thumbnail?: string
  initialTime?: number
  onProgress?: (currentTime: number, duration: number) => void
  onComplete?: () => void
  isCompleted?: boolean
  onMarkComplete?: () => void
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function VideoPlayer({ 
  videoId, 
  title,
  description,
  initialTime = 0,
  onProgress,
  onComplete,
  isCompleted = false,
  onMarkComplete
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const playerElementId = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`)
  
  // Refs for callbacks to prevent re-initialization cycles
  const onProgressRef = useRef(onProgress)
  const onCompleteRef = useRef(onComplete)
  const initialTimeRef = useRef(initialTime)
  const playbackSpeedRef = useRef(1)
  const isPlayerReadyRef = useRef(false)

  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const [showNotes, setShowNotes] = useState(false)
  const [showDescriptionFull, setShowDescriptionFull] = useState(false)
  const [showTracking, setShowTracking] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialTime)
  const [duration, setDuration] = useState(0)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  const {
    isPlaying,
    setIsPlaying,
    isPausedByEyeTracking,
    setPausedByEyeTracking,
    playbackSpeed,
    setPlaybackSpeed,
  } = usePlayerStore()

  const {
    isEnabled: eyeTrackingEnabled,
    isLookingAtScreen,
  } = useEyeTrackingStore()

  // Load default playback speed from settings on mount
  useEffect(() => { playbackSpeedRef.current = playbackSpeed }, [playbackSpeed])
  useEffect(() => { isPlayerReadyRef.current = isPlayerReady }, [isPlayerReady])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.defaultPlaybackSpeed) {
            setPlaybackSpeed(data.defaultPlaybackSpeed)
          }
        }
      } catch (err) {
        console.error('Failed to load playback speed from settings:', err)
      }
    }
    fetchSettings()
  }, [setPlaybackSpeed])

  // 1. Initialize Focus Engine (Camera)
  useFocusEngine(true)

  // 2. Setup YouTube Player API
  const initPlayer = useCallback(() => {
    if (playerRef.current || !window.YT || !window.YT.Player) return

    playerRef.current = new window.YT.Player(playerElementId.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        start: Math.floor(initialTimeRef.current),
      },
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true)
          isPlayerReadyRef.current = true
          setDuration(event.target.getDuration())
          // Apply initial playback speed
          const speed = playbackSpeedRef.current
          if (speed !== 1) {
            event.target.setPlaybackRate(speed)
          }
          if (initialTimeRef.current > 0) {
            event.target.seekTo(initialTimeRef.current, true)
          }
        },
        onStateChange: (event: any) => {
          if (event.data === 1) {
            setIsPlaying(true)
            setPausedByEyeTracking(false)
          } else if (event.data === 2) {
            setIsPlaying(false)
          } else if (event.data === 0) {
            setIsPlaying(false)
            onCompleteRef.current?.()
          }
        }
      }
    })
  }, [videoId, setIsPlaying, setPausedByEyeTracking])

  // Apply playback speed changes when player is ready
  useEffect(() => {
    if (isPlayerReady && playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(playbackSpeed)
    }
  }, [isPlayerReady, playbackSpeed])

  // Handle Script and Instance Lifecycle
  useEffect(() => {
    if (!window.YT || !window.YT.Player) {
      // Only inject the script tag once across all renders
      const scriptSrc = "https://www.youtube.com/iframe_api"
      if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
        const tag = document.createElement('script')
        tag.src = scriptSrc
        const firstScriptTag = document.getElementsByTagName('script')[0]
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        } else {
          document.head.appendChild(tag)
        }
      }
      // Always update the callback so the latest initPlayer closure is used
      window.onYouTubeIframeAPIReady = initPlayer
    } else {
      initPlayer()
    }

    const progressInterval = setInterval(() => {
      if (playerRef.current && isPlayerReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime()
          const dur = playerRef.current.getDuration()
          setCurrentTime(time)
          if (dur > 0) setDuration(dur)
          onProgressRef.current?.(time, dur)
        } catch (e) {}
      }
    }, 1000)

    return () => {
      clearInterval(progressInterval)
    }
  }, [videoId, initPlayer])

  // Cleanup player only when videoId changes or component unmounts
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {}
        playerRef.current = null
        setIsPlayerReady(false)
        isPlayerReadyRef.current = false
      }
    }
  }, [videoId])

  /**
   * 3. TAB VISIBILITY LOGIC (Minimize/Switch Tab)
   * Pauses video when user leaves the tab, resumes when they return.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const player = playerRef.current
      if (!isPlayerReady || !player) return

      if (document.hidden && isPlaying) {
        // User minimized tab or switched away
        if (typeof player.pauseVideo === 'function') {
          player.pauseVideo()
          setPausedByEyeTracking(true)
        }
      } else if (!document.hidden && isPausedByEyeTracking) {
        // User returned to tab
        if (typeof player.playVideo === 'function') {
          player.playVideo()
          setPausedByEyeTracking(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isPlayerReady, isPlaying, isPausedByEyeTracking, setPausedByEyeTracking])

  /**
   * 4. SMART PAUSE LOGIC (Eye Tracking)
   */
  useEffect(() => {
    const player = playerRef.current
    if (!isPlayerReady || !player || !eyeTrackingEnabled) return

    // Only trigger if tab is visible (Visibility logic handles hidden tab)
    if (document.hidden) return

    if (!isLookingAtScreen && isPlaying) {
      if (typeof player.pauseVideo === 'function') {
        player.pauseVideo()
        setPausedByEyeTracking(true)
      }
    } else if (isLookingAtScreen && isPausedByEyeTracking) {
      if (typeof player.playVideo === 'function') {
        player.playVideo()
        setPausedByEyeTracking(false)
      }
    }
  }, [isLookingAtScreen, isPlaying, isPausedByEyeTracking, eyeTrackingEnabled, isPlayerReady])

  const togglePlayManual = () => {
    const player = playerRef.current
    if (!player || !isPlayerReady) return
    
    if (isPlaying) {
      if (typeof player.pauseVideo === 'function') player.pauseVideo()
    } else {
      if (typeof player.playVideo === 'function') player.playVideo()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Video Container */}
        <div className="flex-1">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-white/5">
            <div id={playerElementId.current} className="absolute inset-0 w-full h-full" />
            
            {!isPlayerReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground animate-pulse font-medium">Loading video...</p>
                </div>
              </div>
            )}

            {/* Eye tracking warning overlay */}
            {isPausedByEyeTracking && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-20 transition-all animate-in fade-in duration-500">
                <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
                  <div className="relative mb-6">
                    <EyeOff className="h-20 w-20 mx-auto text-yellow-500 animate-pulse" />
                    <div className="absolute -top-1 -right-1 flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-[10px] font-bold text-white">!</span>
                    </div>
                  </div>
                  <h2 className="text-white text-3xl font-bold mb-2 tracking-tight">Distracted!</h2>
                  <p className="text-white/60 text-lg mb-8 max-w-xs">We paused the video because you looked away or left the page.</p>
                  <Button 
                    onClick={togglePlayManual} 
                    size="lg" 
                    className="px-10 h-14 text-lg font-bold rounded-full bg-primary hover:scale-105 transition-transform"
                  >
                    Resume Now
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Video Title */}
          <div className="mt-6">
            <h2 className="font-bold text-2xl tracking-tight text-foreground">{title}</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                <div className={cn("h-2 w-2 rounded-full animate-pulse", isLookingAtScreen ? "bg-green-500" : "bg-red-500")} />
                {isLookingAtScreen ? 'Tracking Active' : 'Waiting for focus...'}
              </div>
              {eyeTrackingEnabled && (
                <span className="text-xs text-muted-foreground italic">
                  Smart-pause active
                </span>
              )}
              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-mono">
                {playbackSpeed}x
              </div>
            </div>
          </div>

          {/* Video Description */}
          {description && (
            <div className="mt-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl p-4 transition-colors cursor-pointer" onClick={() => setShowDescriptionFull(!showDescriptionFull)}>
              <div className={cn("text-sm text-foreground/80 whitespace-pre-wrap break-words", !showDescriptionFull && "line-clamp-3")}>
                {description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                  /^https?:\/\//.test(part) ? (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">{part}</a>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
              {description.length > 200 && (
                <button className="text-xs font-semibold text-primary mt-2 hover:underline">
                  {showDescriptionFull ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side Panel */}
        <div className="xl:w-80 flex-shrink-0 space-y-4">
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-5 space-y-4 shadow-sm">
            <Button
              variant={isCompleted ? "default" : "outline"}
              className={cn("w-full justify-start gap-3 h-12 rounded-xl border-dashed", isCompleted && "bg-green-500/10 text-green-500 border-green-500/50 hover:bg-green-500/20")}
              onClick={onMarkComplete}
            >
              <CheckCircle className={cn("h-5 w-5", isCompleted && "fill-green-500 text-white")} />
              <span className="font-semibold">{isCompleted ? 'Completed' : 'Mark Lesson Done'}</span>
            </Button>

            <Button
              variant={showNotes ? "default" : "secondary"}
              className="w-full justify-start gap-3 h-12 rounded-xl"
              onClick={() => {
                setShowNotes(!showNotes)
                if (!showNotes) setShowTracking(false)
              }}
            >
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Take Notes</span>
            </Button>

            <Button
              variant={showTracking ? "default" : "secondary"}
              className={cn("w-full justify-start gap-3 h-12 rounded-xl", eyeTrackingEnabled && !showTracking && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20")}
              onClick={() => {
                setShowTracking(!showTracking)
                if (!showTracking) setShowNotes(false)
              }}
            >
              <Eye className="h-5 w-5" />
              <span className="font-semibold">Tracking Status</span>
            </Button>
          </div>

          {showNotes && (
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
              <NotesPanel videoId={videoId} onSeekToTimestamp={(ts) => {
                if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                  playerRef.current.seekTo(ts)
                }
                setCurrentTime(ts)
              }} />
            </div>
          )}

          {showTracking && (
            <div className="bg-card border rounded-2xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-tight">Eye Tracking</h3>
                <div className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase",
                  isLookingAtScreen ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {isLookingAtScreen ? 'Focused' : 'Distracted'}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Smart Pause</span>
                  <Button 
                    variant={eyeTrackingEnabled ? "default" : "outline"} 
                    size="sm" 
                    className="h-7 px-3 rounded-full"
                    onClick={() => useEyeTrackingStore.getState().setEnabled(!eyeTrackingEnabled)}
                  >
                    {eyeTrackingEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Session Progress</span>
                    <span className="font-mono">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500 ease-out"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
