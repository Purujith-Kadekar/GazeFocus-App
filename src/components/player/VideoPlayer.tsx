'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import NextImage from 'next/image'
import {
  Eye, EyeOff, FileText, CheckCircle, Loader2, Coffee,
  Play, Pause, Volume2, VolumeX, Volume1, Maximize2, Minimize2,
  SkipBack, SkipForward, Settings, Link2, Check, Captions, CaptionsOff,
  Gauge, ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, Camera,
  ChevronDown, ChevronUp, List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayerStore, useEyeTrackingStore, useWatchBreakStore } from '@/store/useStore'
import { useFocusEngine } from '@/hooks/useFocusEngine'
import { formatDuration, cn } from '@/lib/utils'
import { NotesPanel } from './NotesPanel'
import type { Video, Channel } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface VideoPlayerProps {
  videoId: string
  title: string
  description?: string
  thumbnail?: string
  initialTime?: number
  onProgress?: (currentTime: number, duration: number) => void
  /** Called immediately whenever the video transitions to the paused state */
  onPause?: (currentTime: number, duration: number) => void
  onComplete?: () => void
  isCompleted?: boolean
  onMarkComplete?: () => void
  /** Videos in the same playlist/context for prev/next navigation */
  playlistVideos?: Video[]
  /** Called when user navigates to a different video */
  onNavigateToVideo?: (youtubeId: string) => void
  channel?: Channel
  viewCount?: string | null
  publishedAt?: string | null
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const QUALITY_LABELS: Record<string, string> = {
  small: '240p',
  medium: '360p',
  large: '480p',
  hd720: '720p',
  hd1080: '1080p',
  hd1440: '1440p',
  highres: '4K',
  default: 'Auto',
  auto: 'Auto',
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5]

// How close (in seconds) the player's reported time must be to the initial
// seek position before we consider the seek "confirmed" and unlock onPause
// progress saves for all positions.
const SEEK_POSITION_TOLERANCE_SECONDS = 5

export function VideoPlayer({
  videoId,
  title,
  description,
  initialTime = 0,
  onProgress,
  onPause,
  onComplete,
  isCompleted = false,
  onMarkComplete,
  playlistVideos,
  onNavigateToVideo,
  channel,
  viewCount,
  publishedAt,
}: VideoPlayerProps) {
  // ─── Core player refs ────────────────────────────────────────────────────────
  const videoAreaRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const playerElementId = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`)
  const cameraPreviewRef = useRef<HTMLVideoElement>(null)

  // Refs for callbacks to prevent re-initialization cycles
  const onProgressRef = useRef(onProgress)
  const onCompleteRef = useRef(onComplete)
  const onPauseRef = useRef(onPause)
  const initialTimeRef = useRef(initialTime)
  const playbackSpeedRef = useRef(1)
  const isPlayerReadyRef = useRef(false)
  const hasSeekedRef = useRef(false)
  // Becomes true after the first onStateChange(playing) event so we never
  // save progress from the spurious pause fired at t=0 during initialisation.
  const hasPlayedRef = useRef(false)
  // Becomes true once the progress interval confirms the player has reached
  // (or passed) the initial seek position.  Until then, onPause is blocked for
  // positions far below initialTime to prevent a spurious early pause (e.g.
  // from eye-tracking before the seek completes) from overwriting the real
  // saved position with t≈0.
  const hasMovedPastInitialRef = useRef(false)

  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { onPauseRef.current = onPause }, [onPause])
  // Keep initialTimeRef in sync so the player can seek even if the prop
  // arrives slightly after the first render (defensive measure).
  useEffect(() => { initialTimeRef.current = initialTime }, [initialTime])

  // ─── Player state ─────────────────────────────────────────────────────────────
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialTime)
  const [duration, setDuration] = useState(0)

  // ─── Custom controls state ────────────────────────────────────────────────────
  const [volume, setVolumeLocal] = useState(100)
  const [isMuted, setIsMutedLocal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [availableQualities, setAvailableQualitiesLocal] = useState<string[]>([])
  const [currentQuality, setCurrentQualityLocal] = useState('auto')
  const [captionsEnabled, setCaptionsEnabled] = useState(false)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [previewPosition, setPreviewPosition] = useState(0)

  // ─── UI state ─────────────────────────────────────────────────────────────────
  const [showNotes, setShowNotes] = useState(false)
  const [showDescriptionFull, setShowDescriptionFull] = useState(false)
  const [showTracking, setShowTracking] = useState(false)
  const [showPlaylistVideos, setShowPlaylistVideos] = useState(false)
  const [showFlash, setShowFlash] = useState(false)

  // ─── Watch break state ────────────────────────────────────────────────────────
  const continuousPlaySecondsRef = useRef(0)
  const [showWatchBreak, setShowWatchBreak] = useState(false)
  const [breakCountdown, setBreakCountdown] = useState(0)

  // ─── Controls visibility refs ─────────────────────────────────────────────────
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  // ─── Zustand stores ───────────────────────────────────────────────────────────
  const {
    isPlaying,
    setIsPlaying,
    isPausedByEyeTracking,
    setPausedByEyeTracking,
    playbackSpeed,
    setPlaybackSpeed,
    setCurrentTime: setStoreCurrentTime,
  } = usePlayerStore()

  const {
    isEnabled: eyeTrackingEnabled,
    isTracking: eyeIsTracking,
    isLookingAtScreen,
    isFaceDetected: eyeIsFaceDetected,
    cameraStream,
  } = useEyeTrackingStore()

  const {
    isEnabled: watchBreakEnabled,
    breakMinutes,
    breakDurationMinutes,
  } = useWatchBreakStore()

  // ─── Playlist navigation ──────────────────────────────────────────────────────
  const sortedPlaylist = playlistVideos
    ? [...playlistVideos].sort((a, b) => a.position - b.position)
    : []
  const currentIndex = sortedPlaylist.findIndex(v => v.youtubeId === videoId)
  const prevVideo = currentIndex > 0 ? sortedPlaylist[currentIndex - 1] : null
  const nextVideo = currentIndex >= 0 && currentIndex < sortedPlaylist.length - 1
    ? sortedPlaylist[currentIndex + 1]
    : null

  // ─── Derived ──────────────────────────────────────────────────────────────────
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const volumeBeforeMuteRef = useRef(volume)
  const volumeRef = useRef(volume)

  // Keep volumeRef in sync with state
  useEffect(() => { volumeRef.current = volume }, [volume])

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

  // 1. Initialize Focus Engine (Camera) — only when eye tracking is enabled
  const { error: eyeTrackingError } = useFocusEngine(eyeTrackingEnabled)

  // Sync camera stream to the preview video element in the tracking panel
  useEffect(() => {
    if (cameraPreviewRef.current) {
      cameraPreviewRef.current.srcObject = cameraStream ?? null
    }
  }, [cameraStream])

  // Defensive: if the player became ready after initialTime arrived, seek now.
  // Also handles the edge case where initialTime prop updates while the player
  // is already ready — reset the seek flag and seek to the new position.
  useEffect(() => {
    if (!initialTime) return
    // Reset seek flag and the "moved past initial" guard so a new initialTime
    // always triggers a fresh seek and re-enables the save guard.
    hasSeekedRef.current = false
    hasMovedPastInitialRef.current = false
    if (isPlayerReady && playerRef.current) {
      playerRef.current.seekTo(initialTime, true)
      hasSeekedRef.current = true
    }
  }, [initialTime])

  // ─── Controls visibility helpers ─────────────────────────────────────────────
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    // Auto-hide only when playing
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isDraggingRef.current) setShowControls(false)
    }, 3000)
  }, [])

  // Keep controls visible when paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [isPlaying])

  // ─── YouTube Player initialization ────────────────────────────────────────────
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
        controls: 0,         // hide YouTube native controls — we use our own
        disablekb: 1,        // disable YouTube keyboard shortcuts
        fs: 0,               // hide YouTube fullscreen button
        iv_load_policy: 3,   // hide video annotations
        cc_load_policy: 0,   // do not force captions on
        start: Math.floor(initialTimeRef.current),
      },
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true)
          isPlayerReadyRef.current = true
          const dur = event.target.getDuration()
          setDuration(dur)
          // Apply initial playback speed
          const speed = playbackSpeedRef.current
          if (speed !== 1) event.target.setPlaybackRate(speed)
          if (initialTimeRef.current > 0) {
            event.target.seekTo(initialTimeRef.current, true)
            hasSeekedRef.current = true
          }
          // Sync volume
          event.target.setVolume(volumeRef.current)
          // Try to get available qualities (may be empty until buffering starts)
          const qualities: string[] = event.target.getAvailableQualityLevels?.() ?? []
          if (qualities.length > 0) setAvailableQualitiesLocal(qualities)
          setCurrentQualityLocal(event.target.getPlaybackQuality?.() ?? 'auto')
        },
        onStateChange: (event: any) => {
          if (event.data === 1) {
            // Playing
            hasPlayedRef.current = true
            setIsPlaying(true)
            setPausedByEyeTracking(false)
            // Backup seek on first PLAYING event
            if (!hasSeekedRef.current && initialTimeRef.current > 0) {
              event.target.seekTo(initialTimeRef.current, true)
              hasSeekedRef.current = true
            }
            // Update qualities when video starts
            const qualities: string[] = event.target.getAvailableQualityLevels?.() ?? []
            if (qualities.length > 0) setAvailableQualitiesLocal(qualities)
            setCurrentQualityLocal(event.target.getPlaybackQuality?.() ?? 'auto')
          } else if (event.data === 2) {
            setIsPlaying(false)
            // Only save progress after the video has actually started playing
            // AND we have confirmed the player has reached the initial seek
            // position.  YouTube can fire a STATE_PLAYING event briefly before
            // the seek to `initialTime` completes; if something (e.g. eye-
            // tracking) pauses the video in that small window getCurrentTime()
            // may still report ~0, which would overwrite the real saved position.
            if (hasPlayedRef.current) {
              const pausedTime = event.target.getCurrentTime?.() ?? 0
              const pausedDur = event.target.getDuration?.() ?? 0
              // Allow saving if the player has confirmed being at/past initialTime,
              // OR if pausedTime is already close enough to initialTime (covers the
              // case where the first progress interval hasn't run yet).
              // For Live streams, we relax this even further: if we've played (hasPlayedRef.current),
              // we trust the user's intent to save the current position.
              if (hasMovedPastInitialRef.current || 
                  pausedTime >= initialTimeRef.current - SEEK_POSITION_TOLERANCE_SECONDS ||
                  hasPlayedRef.current) {
                console.log(`[PAUSE] Saving position: ${pausedTime}`)
                onPauseRef.current?.(pausedTime, pausedDur)
              }
            }
          } else if (event.data === 0) {
            setIsPlaying(false)
            onCompleteRef.current?.()
          }
        },
        onPlaybackQualityChange: (event: any) => {
          setCurrentQualityLocal(event.data ?? 'auto')
        },
      }
    })
  }, [videoId, setIsPlaying, setPausedByEyeTracking])

  const ensureYouTubeApiReady = useCallback((): Promise<void> => {
    if (window.YT?.Player) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady

      window.onYouTubeIframeAPIReady = () => {
        previousReady?.()
        resolve()
      }

      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      }
    })
  }, [])

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
    let cancelled = false

    ensureYouTubeApiReady().then(() => {
      if (!cancelled) {
        initPlayer()
      }
    })

    const progressInterval = setInterval(() => {
      if (playerRef.current && isPlayerReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const time = playerRef.current.getCurrentTime()
          const dur = playerRef.current.getDuration()
          setCurrentTime(time)
          setStoreCurrentTime(time)
          if (dur > 0) setDuration(dur)
          // Confirm the player has reached (or passed) the initial seek position.
          // Once confirmed, progress saves via onPause are unconditionally allowed.
          if (!hasMovedPastInitialRef.current && time >= initialTimeRef.current - SEEK_POSITION_TOLERANCE_SECONDS) {
            console.log(`[SEEK] Confirmed: Player reached initial position ${initialTimeRef.current} (current: ${time})`)
            hasMovedPastInitialRef.current = true
          }
          onProgressRef.current?.(time, dur)
        } catch (e) {}
      }
    }, 1000)

    return () => {
      cancelled = true
      clearInterval(progressInterval)
    }
  }, [videoId, initPlayer, ensureYouTubeApiReady])

  // Cleanup player only when videoId changes or component unmounts
  useEffect(() => {
    hasSeekedRef.current = false
    hasPlayedRef.current = false
    hasMovedPastInitialRef.current = false
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

  /**
   * 5. WATCH BREAK REMINDER (continuous watch timer)
   * Tracks how long the user has been playing non-stop. When playing stops
   * (paused / eye-tracking pause / tab hidden) the counter resets. When the
   * threshold is reached the mandatory break countdown begins.
   */
  useEffect(() => {
    if (!watchBreakEnabled) return

    const interval = setInterval(() => {
      if (isPlaying && !isPausedByEyeTracking && !document.hidden) {
        continuousPlaySecondsRef.current += 1
        if (continuousPlaySecondsRef.current >= breakMinutes * 60) {
          // Pause the video and start the mandatory break
          if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
            playerRef.current.pauseVideo()
          }
          setShowWatchBreak(true)
          setBreakCountdown(breakDurationMinutes * 60)
          continuousPlaySecondsRef.current = 0
        }
      } else {
        // Reset whenever not actively playing
        continuousPlaySecondsRef.current = 0
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [watchBreakEnabled, isPlaying, isPausedByEyeTracking, breakMinutes, breakDurationMinutes])

  /**
   * 6. MANDATORY BREAK COUNTDOWN
   * Counts down every second while the break overlay is visible.
   * When it hits 0 the overlay is dismissed automatically.
   */
  useEffect(() => {
    if (breakCountdown <= 0) return

    const timer = setInterval(() => {
      setBreakCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setShowWatchBreak(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [breakCountdown])

  const togglePlayManual = useCallback(() => {
    const player = playerRef.current
    if (!player || !isPlayerReadyRef.current) return
    if (isPlaying) {
      if (typeof player.pauseVideo === 'function') player.pauseVideo()
    } else {
      if (typeof player.playVideo === 'function') player.playVideo()
    }
  }, [isPlaying])

  // ─── Custom control handlers ──────────────────────────────────────────────────

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(100, newVolume))
    setVolumeLocal(clamped)
    if (clamped > 0 && isMuted) {
      setIsMutedLocal(false)
      playerRef.current?.unMute?.()
    }
    playerRef.current?.setVolume?.(clamped)
    if (clamped > 0) volumeBeforeMuteRef.current = clamped
  }, [isMuted])

  const toggleMute = useCallback(() => {
    if (isMuted) {
      const restore = volumeBeforeMuteRef.current > 0 ? volumeBeforeMuteRef.current : 50
      setIsMutedLocal(false)
      setVolumeLocal(restore)
      playerRef.current?.unMute?.()
      playerRef.current?.setVolume?.(restore)
    } else {
      volumeBeforeMuteRef.current = volume
      setIsMutedLocal(true)
      playerRef.current?.mute?.()
    }
  }, [isMuted, volume])

  const handleFullscreen = useCallback(async () => {
    const el = videoAreaRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Browser may not support fullscreen; silently ignore
    }
  }, [])

  const handleSnapshot = useCallback(async () => {
    if (!videoId) return
    
    // Trigger Camera Flash UX
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 300)
    
    // Use our internal proxy to bypass CORS restrictions on YouTube thumbnails
    const proxyUrl = `/api/thumbnail?videoId=${videoId}`
    
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous' // Now works because our proxy sends ACAO: *
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = proxyUrl
      })

      // Create a canvas to draw the snapshot
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = img.width
      canvas.height = img.height

      // 1. Draw the background image
      ctx.drawImage(img, 0, 0)

      // 2. Add a sleek gradient scrim at the bottom
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 3. Add Video Title
      ctx.fillStyle = 'white'
      ctx.font = `bold ${Math.floor(canvas.height / 20)}px Inter, system-ui, sans-serif`
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 10
      ctx.fillText(title, canvas.width * 0.05, canvas.height * 0.88)

      // 4. Add Timestamp and Logo
      ctx.font = `${Math.floor(canvas.height / 30)}px monospace`
      const timeStr = `TIME: ${formatDuration(currentTime)}`
      ctx.fillText(timeStr, canvas.width * 0.05, canvas.height * 0.94)
      
      ctx.textAlign = 'right'
      ctx.font = `italic ${Math.floor(canvas.height / 35)}px Inter, sans-serif`
      ctx.fillText('GAZEFOCUS APP   AI FOCUS ENGINE', canvas.width * 0.95, canvas.height * 0.94)

      // 5. Download the result safely using Blob (prevents large base64 href limits in browsers)
      const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 30) || 'Video'
      const timeStrSafe = formatDuration(currentTime).replace(/:/g, '-')
      
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas toBlob failed.");
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `GazeFocus_${safeTitle}_${timeStrSafe}.png`;
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }, 'image/png');

    } catch (e) {
      console.error('Snapshot failed via proxy, falling back to direct download:', e)
      // Final fallback
      window.open(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, '_blank')
    }
  }, [videoId, title, currentTime])

  const handleSetQuality = useCallback((quality: string) => {
    playerRef.current?.setPlaybackQuality?.(quality)
    setCurrentQualityLocal(quality)
    setShowQualityMenu(false)
  }, [])

  const toggleCaptions = useCallback(() => {
    if (captionsEnabled) {
      playerRef.current?.unloadModule?.('captions')
      setCaptionsEnabled(false)
    } else {
      playerRef.current?.loadModule?.('captions')
      setCaptionsEnabled(true)
    }
  }, [captionsEnabled])

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
    playerRef.current?.setPlaybackRate?.(speed)
    setShowSpeedMenu(false)
  }, [setPlaybackSpeed])

  const copyVideoUrl = useCallback(() => {
    const url = `https://www.youtube.com/watch?v=${videoId}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setUrlCopied(true)
        setTimeout(() => setUrlCopied(false), 2000)
      }).catch(() => {
        // Clipboard write failed silently — tooltip already indicates the URL
        setUrlCopied(false)
      })
    }
  }, [videoId])

  const navigatePrev = useCallback(() => {
    if (prevVideo && onNavigateToVideo) onNavigateToVideo(prevVideo.youtubeId)
  }, [prevVideo, onNavigateToVideo])

  const navigateNext = useCallback(() => {
    if (nextVideo && onNavigateToVideo) onNavigateToVideo(nextVideo.youtubeId)
  }, [nextVideo, onNavigateToVideo])

  // Progress bar seeking
  const getTimeFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    const bar = progressBarRef.current
    if (!bar || !duration) return 0
    const rect = bar.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    return (x / rect.width) * duration
  }, [duration])

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    isDraggingRef.current = true
    const t = getTimeFromEvent(e)
    setCurrentTime(t)
  }, [getTimeFromEvent])

  const handleProgressMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    setPreviewPosition((x / rect.width) * 100)
    setPreviewTime((x / rect.width) * duration)
  }, [duration])

  // Global mouse events for dragging the progress bar
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      const bar = progressBarRef.current
      if (!bar || !duration) return
      const rect = bar.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const t = (x / rect.width) * duration
      setCurrentTime(t)
      playerRef.current?.seekTo?.(t, true)
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const bar = progressBarRef.current
      if (!bar || !duration) return
      const rect = bar.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      setCurrentTime((x / rect.width) * duration)
    }
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [duration])

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Keyboard shortcuts (active when video area is focused or in fullscreen)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only intercept when focus is inside the video area or in fullscreen
      const inFullscreen = !!document.fullscreenElement
      const inVideoArea = videoAreaRef.current?.contains(document.activeElement) ?? false
      if (!inFullscreen && !inVideoArea) return
      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault()
          togglePlayManual()
          showControlsTemporarily()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (playerRef.current?.seekTo) {
            const t = Math.max(0, currentTime - 5)
            playerRef.current.seekTo(t, true)
            setCurrentTime(t)
          }
          showControlsTemporarily()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (playerRef.current?.seekTo) {
            const t = Math.min(duration, currentTime + 5)
            playerRef.current.seekTo(t, true)
            setCurrentTime(t)
          }
          showControlsTemporarily()
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(volume + 10)
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(volume - 10)
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'KeyF':
          e.preventDefault()
          handleFullscreen()
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [currentTime, duration, volume, togglePlayManual, showControlsTemporarily, handleVolumeChange, toggleMute, handleFullscreen])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu]')) {
        setShowQualityMenu(false)
        setShowSpeedMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Helper: volume icon
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2

  return (
    <div className="relative w-full">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* ── Video Area (goes fullscreen) ──────────────────────────────────── */}
        <div className="flex-1">
          <div
            ref={videoAreaRef}
            tabIndex={-1}
            onMouseMove={showControlsTemporarily}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onTouchStart={showControlsTemporarily}
            className={cn(
              "relative bg-black overflow-hidden group outline-none",
              isFullscreen
                ? "w-screen h-screen fixed inset-0 z-[9998]"
                : "aspect-video rounded-xl shadow-2xl border border-white/5"
            )}
          >
            {/* YouTube iframe — no native controls */}
            <div id={playerElementId.current} className="absolute inset-0 w-full h-full" />

            {/* Flash Effect Overlay for Snapshot */}
            <div 
              className={cn(
                "absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-300 ease-out",
                showFlash ? "opacity-100 mix-blend-screen" : "opacity-0"
              )} 
            />

            {/* Transparent click-capture layer — sits above iframe to intercept play/pause clicks */}
            <div
              role="button"
              tabIndex={0}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="absolute inset-0 z-10 cursor-pointer focus:outline-none"
              onClick={togglePlayManual}
              onDoubleClick={handleFullscreen}
              onKeyDown={(e) => {
                if (e.code === 'Space' || e.code === 'Enter') {
                  e.preventDefault()
                  togglePlayManual()
                }
              }}
            />

            {/* Loading overlay */}
            {!isPlayerReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground animate-pulse font-medium">Loading video...</p>
                </div>
              </div>
            )}

            {/* Eye tracking warning overlay */}
            {isPausedByEyeTracking && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-30 transition-all animate-in fade-in duration-500">
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

            {/* Mandatory break countdown */}
            {showWatchBreak && breakCountdown > 0 && (
              <div
                className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-lg select-none"
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Coffee className="h-24 w-24 text-orange-400 animate-bounce mb-6" />
                <h1 className="text-white text-4xl font-extrabold mb-2 tracking-tight">Time to Rest 🧘</h1>
                <p className="text-white/60 text-lg mb-10 max-w-sm text-center">
                  You&apos;ve been watching non-stop. Step away, stretch and rest your eyes. The app will unlock automatically.
                </p>
                <div className="relative flex items-center justify-center mb-6">
                  <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="54"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - breakCountdown / (breakDurationMinutes * 60))}`}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-white text-4xl font-extrabold font-mono tabular-nums">
                      {Math.floor(breakCountdown / 60).toString().padStart(2, '0')}:{(breakCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <p className="text-white/30 text-sm">Come back when the timer ends</p>
              </div>
            )}

            {/* ── Custom Controls overlay ────────────────────────────────────── */}
            <div
              className={cn(
                "absolute inset-0 z-20 flex flex-col justify-end transition-opacity duration-300 pointer-events-none",
                showControls ? "opacity-100" : "opacity-0"
              )}
            >
              {/* Gradient scrim */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              {/* Controls content */}
              <div className="relative pointer-events-auto px-3 pb-3 sm:px-4 sm:pb-4">
                {/* Progress bar */}
                <div
                  ref={progressBarRef}
                  className="relative h-4 flex items-center cursor-pointer mb-2 group/prog"
                  onMouseDown={handleProgressMouseDown}
                  onMouseMove={handleProgressMouseMove}
                  onMouseLeave={() => setPreviewTime(null)}
                >
                  {/* Track */}
                  <div className="absolute inset-x-0 h-1 group-hover/prog:h-1.5 bg-white/20 rounded-full transition-all duration-150 overflow-hidden">
                    {/* Filled */}
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {/* Thumb */}
                  <div
                    className="absolute h-3 w-3 bg-white rounded-full shadow -translate-x-1/2 opacity-0 group-hover/prog:opacity-100 transition-opacity"
                    style={{ left: `${progressPercent}%` }}
                  />
                  {/* Time preview tooltip */}
                  {previewTime !== null && (
                    <div
                      className="absolute bottom-5 -translate-x-1/2 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap"
                      style={{ left: `${previewPosition}%` }}
                    >
                      {formatDuration(previewTime)}
                    </div>
                  )}
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* ── Left controls ─────────────────────────── */}
                  {/* Play / Pause */}
                  <button
                    onClick={togglePlayManual}
                    className="text-white hover:text-white/80 transition-colors p-1 flex-shrink-0"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying
                      ? <Pause className="h-5 w-5 sm:h-6 sm:w-6 fill-white" />
                      : <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-white" />
                    }
                  </button>

                  {/* Previous video */}
                  {prevVideo && (
                    <button
                      onClick={navigatePrev}
                      className="text-white hover:text-white/80 transition-colors p-1 flex-shrink-0"
                      aria-label="Previous video"
                    >
                      <SkipBack className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                    </button>
                  )}

                  {/* Next video */}
                  {nextVideo && (
                    <button
                      onClick={navigateNext}
                      className="text-white hover:text-white/80 transition-colors p-1 flex-shrink-0"
                      aria-label="Next video"
                    >
                      <SkipForward className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                    </button>
                  )}

                  {/* Volume */}
                  <div
                    className="relative flex items-center gap-1 flex-shrink-0"
                    data-menu="volume"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-white/80 transition-colors p-1"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      <VolumeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {/* Volume slider */}
                    <div className={cn(
                      "overflow-hidden transition-all duration-200",
                      showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0"
                    )}>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-full h-1 accent-white cursor-pointer"
                        aria-label="Volume"
                      />
                    </div>
                  </div>

                  {/* Time display */}
                  <span className="text-white text-xs sm:text-sm font-mono whitespace-nowrap select-none">
                    {formatDuration(currentTime)}&nbsp;/&nbsp;{formatDuration(duration)}
                  </span>

                  {/* ── Spacer ─────────────────────────────────── */}
                  <div className="flex-1" />

                  {/* ── Right controls ────────────────────────── */}
                  <button
                    onClick={handleSnapshot}
                    className="text-white hover:text-white/80 transition-colors p-1 flex-shrink-0"
                    aria-label="Take snapshot"
                    title="Snapshot"
                  >
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* Captions toggle */}
                  <button
                    onClick={toggleCaptions}
                    className={cn(
                      "text-white hover:text-white/80 transition-colors p-1 flex-shrink-0",
                      captionsEnabled && "text-primary"
                    )}
                    aria-label={captionsEnabled ? 'Disable captions' : 'Enable captions'}
                  >
                    {captionsEnabled
                      ? <Captions className="h-4 w-4 sm:h-5 sm:w-5" />
                      : <CaptionsOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    }
                  </button>

                  {/* Quality selector */}
                  <div className="relative flex-shrink-0" data-menu="quality">
                    <button
                      onClick={() => { setShowQualityMenu(p => !p); setShowSpeedMenu(false) }}
                      className="text-white hover:text-white/80 transition-colors p-1 flex items-center gap-0.5"
                      aria-label="Video quality"
                    >
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-xl min-w-[110px] z-50 border border-white/10">
                        <p className="text-white/50 text-[10px] uppercase px-3 pt-2 pb-1 font-bold tracking-wider">Quality</p>
                        {(availableQualities.length > 0 ? availableQualities : ['default']).map((q) => (
                          <button
                            key={q}
                            onClick={() => handleSetQuality(q)}
                            className={cn(
                              "w-full text-left px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-colors",
                              currentQuality === q && "text-primary font-semibold"
                            )}
                          >
                            {QUALITY_LABELS[q] ?? q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Speed selector */}
                  <div className="relative flex-shrink-0" data-menu="speed">
                    <button
                      onClick={() => { setShowSpeedMenu(p => !p); setShowQualityMenu(false) }}
                      className="text-white hover:text-white/80 transition-colors p-1 flex items-center gap-0.5"
                      aria-label="Playback speed"
                    >
                      <Gauge className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-xl min-w-[100px] z-50 border border-white/10">
                        <p className="text-white/50 text-[10px] uppercase px-3 pt-2 pb-1 font-bold tracking-wider">Speed</p>
                        {SPEED_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSpeedChange(s)}
                            className={cn(
                              "w-full text-left px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-colors",
                              playbackSpeed === s && "text-primary font-semibold"
                            )}
                          >
                            {s === 1 ? 'Normal' : `${s}×`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video URL / copy */}
                  <button
                    onClick={copyVideoUrl}
                    className="text-white hover:text-white/80 transition-colors p-1 flex-shrink-0"
                    aria-label="Copy video URL"
                    title="Copy YouTube URL"
                  >
                    {urlCopied
                      ? <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                      : <Link2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    }
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={handleFullscreen}
                    className="text-white hover:text-white/80 transition-colors p-1 flex-shrink-0"
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen
                      ? <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      : <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Below-video content (hidden in fullscreen) ──────────────────── */}
          {!isFullscreen && (
            <>
              {/* YouTube Style Metadata & Description */}
              <div className="mt-4 space-y-4">
                {/* 1. Description Box */}
                <div
                  className={cn(
                    "bg-secondary/30 rounded-xl p-3 transition-colors hover:bg-secondary/40 cursor-default",
                    !showDescriptionFull && "cursor-pointer"
                  )}
                  onClick={() => !showDescriptionFull && setShowDescriptionFull(true)}
                >
                  <div className="flex items-center justify-end mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-background/10 px-2 py-0.5 rounded-full border border-border/10">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        !eyeTrackingEnabled ? "bg-gray-500" :
                        isLookingAtScreen ? "bg-green-500 animate-pulse" : "bg-red-500"
                      )} />
                      {eyeTrackingEnabled ? (isLookingAtScreen ? 'Focus Active' : 'Gaze Lost') : 'Tracking Off'}
                    </div>
                  </div>
                  <div className={cn(
                    "text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed",
                    !showDescriptionFull && "line-clamp-2"
                  )}>
                    {description ? (
                      description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                        /^https?:\/\//.test(part) ? (
                          <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:underline">{part}</a>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )
                    ) : 'No description provided.'}
                  </div>

                  {description && description.length > 100 && (
                    <button
                      className="text-sm font-bold mt-2 text-foreground/80 hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDescriptionFull(!showDescriptionFull);
                      }}
                    >
                      {showDescriptionFull ? 'Show less' : '...more'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right Side Panel (hidden in fullscreen) ──────────────────────── */}
        {!isFullscreen && (
          <div className="xl:w-80 flex-shrink-0 space-y-4">
            <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-5 space-y-4 shadow-sm">
              <Button
                variant={isCompleted ? "default" : "outline"}
                className={cn("w-full justify-start gap-3 h-12 rounded-xl border-dashed", isCompleted && "bg-green-500/10 text-green-500 border-green-500/50 hover:bg-green-500/20")}
                onClick={onMarkComplete}
              >
                <CheckCircle className={cn("h-5 w-5", isCompleted && "fill-green-500 text-white")} />
                <span className="font-semibold">{isCompleted ? 'Mark as Incomplete' : 'Mark Lesson Done'}</span>
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
                    eyeTrackingError ? "bg-orange-500/10 text-orange-500"
                      : isLookingAtScreen ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {eyeTrackingError ? 'Error' : isLookingAtScreen ? 'Focused' : 'Distracted'}
                  </div>
                </div>

                {eyeTrackingError && (
                  <div className="text-xs text-orange-500 bg-orange-500/10 rounded-lg px-3 py-2 leading-relaxed">
                    {eyeTrackingError.includes('Permission') || eyeTrackingError.includes('NotAllowed') || eyeTrackingError.includes('permission')
                      ? 'Camera permission denied. Please allow camera access and reload.'
                      : eyeTrackingError.includes('MediaPipe') || eyeTrackingError.includes('WASM') || eyeTrackingError.includes('Failed to load')
                        ? 'Could not load eye-tracking models. Check your internet connection.'
                        : `Eye tracking failed: ${eyeTrackingError}`
                    }
                  </div>
                )}

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

                  {/* Camera preview */}
                  {eyeTrackingEnabled && (
                    <div className="rounded-lg overflow-hidden bg-black aspect-video">
                      {cameraStream ? (
                        <video
                          ref={cameraPreviewRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs gap-2">
                          <EyeOff className="h-4 w-4" />
                          {eyeIsTracking ? 'No camera feed' : 'Camera initializing…'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Session Progress</span>
                      <span className="font-mono">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Playlist Videos Accordion */}
            {playlistVideos && playlistVideos.length > 0 && (
              <div className="bg-card/50 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <button
                  onClick={() => setShowPlaylistVideos(!showPlaylistVideos)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <List className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">Playlist Videos</span>
                      <span className="text-xs text-muted-foreground">{playlistVideos.length} videos</span>
                    </div>
                  </div>
                  {showPlaylistVideos ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground mr-1" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground mr-1" />
                  )}
                </button>

                {showPlaylistVideos && (
                  <div className="border-t max-h-[400px] overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {sortedPlaylist.map((v, idx) => {
                        const isCurrent = v.youtubeId === videoId;
                        return (
                          <button
                            key={v.youtubeId}
                            onClick={() => onNavigateToVideo && onNavigateToVideo(v.youtubeId)}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors group",
                              isCurrent ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-secondary"
                            )}
                          >
                            <div className="flex-shrink-0 w-6 text-center text-xs font-medium text-muted-foreground">
                              {isCurrent ? (
                                <Play className="h-3 w-3 inline text-primary" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <div className="flex-shrink-0 w-24 aspect-video rounded overflow-hidden bg-black/20 flex items-center justify-center">
                              {v.thumbnail ? (
                                <NextImage src={v.thumbnail} alt={v.title} fill sizes="96px" className="w-full h-full object-cover" />
                              ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <span className={cn(
                                "text-sm font-medium leading-tight line-clamp-2",
                                isCurrent ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                              )}>
                                {v.title}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
