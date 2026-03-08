'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useEyeTrackingStore, usePlayerStore } from '@/store/useStore'
import { GazeEngine } from '@/lib/eye-tracking/GazeEngine'
import { DEFAULT_CONFIG } from '@/lib/eye-tracking/types'

export function useFocusEngine(isActive: boolean = true) {
  const {
    isEnabled,
    setTracking,
    setLookingAtScreen,
    setIsFaceDetected,
    thresholdSeconds,
    setCameraStream,
    incrementDistractionCount,
  } = useEyeTrackingStore()

  const { isPlaying } = usePlayerStore()
  
  const [error, setError] = useState<string | null>(null)
  
  const engineRef = useRef<GazeEngine | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const isTrackingRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  
  // MediaPipe strict timestamp management
  const lastTimestampRef = useRef<number>(-1)
  
  // Buffering for "Distracted" state
  const unfocusStartRef = useRef<number | null>(null)
  const lastLookingStateRef = useRef(true)

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false
    setTracking(false)
    setLookingAtScreen(true)
    setCameraStream(null)
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current = null
    }

    if (engineRef.current) {
      engineRef.current.dispose()
      engineRef.current = null
    }
    lastTimestampRef.current = -1
  }, [setTracking, setLookingAtScreen, setCameraStream])

  const startTracking = useCallback(async () => {
    if (isTrackingRef.current) return
    setError(null)

    try {
      console.log('Initializing Gaze Focus Engine...')
      
      // 1. Setup hidden video
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.width = 640
      video.height = 480
      videoRef.current = video

      // 2. Get stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user' 
        },
        audio: false
      })
      
      streamRef.current = mediaStream
      setCameraStream(mediaStream)
      video.srcObject = mediaStream
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true)
      })
      await video.play()

      // 3. Init engine
      const engine = new GazeEngine({
        unfocusPauseDelay: thresholdSeconds * 1000
      })
      await engine.initialize()
      engineRef.current = engine

      // 4. Start loop
      isTrackingRef.current = true
      setTracking(true)

      const loop = (time: number) => {
        if (!isTrackingRef.current || !videoRef.current || !engineRef.current) return

        let timestamp = performance.now()
        if (timestamp <= lastTimestampRef.current) {
          timestamp = lastTimestampRef.current + 1
        }
        lastTimestampRef.current = timestamp

        const result = engineRef.current.detect(videoRef.current, timestamp)
        
        setIsFaceDetected(result.isFaceDetected)
        
        const isLooking = result.isLookingAtScreen && result.isFaceDetected

        if (isLooking) {
          unfocusStartRef.current = null
          if (!lastLookingStateRef.current) {
            setLookingAtScreen(true)
            lastLookingStateRef.current = true
          }
        } else {
          // IMMEDIATE RESPONSE if threshold is 0
          if (thresholdSeconds === 0) {
            if (lastLookingStateRef.current) {
              setLookingAtScreen(false)
              lastLookingStateRef.current = false
              incrementDistractionCount()
            }
          } else {
            // Otherwise use buffered logic
            if (unfocusStartRef.current === null) {
              unfocusStartRef.current = timestamp
            }

            const elapsed = timestamp - unfocusStartRef.current
            if (elapsed >= (thresholdSeconds * 1000)) {
              if (lastLookingStateRef.current) {
                setLookingAtScreen(false)
                lastLookingStateRef.current = false
                incrementDistractionCount()
              }
            }
          }
        }

        rafRef.current = requestAnimationFrame(loop)
      }

      rafRef.current = requestAnimationFrame(loop)
    } catch (err: any) {
      console.error('Focus Engine Error:', err)
      setError(err.message || 'Failed to start eye tracking')
      stopTracking()
    }
  }, [thresholdSeconds, setTracking, setIsFaceDetected, setLookingAtScreen, setCameraStream, incrementDistractionCount, stopTracking])

  useEffect(() => {
    const shouldBeTracking = isEnabled && isActive

    if (shouldBeTracking && !isTrackingRef.current) {
      startTracking()
    } else if (!shouldBeTracking && isTrackingRef.current) {
      stopTracking()
    }

    return () => {
      if (isTrackingRef.current) stopTracking()
    }
  }, [isEnabled, isActive, startTracking, stopTracking])

  return { stream: streamRef.current, error }
}
