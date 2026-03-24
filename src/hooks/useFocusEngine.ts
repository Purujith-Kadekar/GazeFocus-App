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
    sensitivityMode,
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
    setIsFaceDetected(false)
    setCameraStream(null)
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    const globalStream = useEyeTrackingStore.getState().cameraStream
    if (globalStream) {
      globalStream.getTracks().forEach(t => t.stop())
      useEyeTrackingStore.getState().setCameraStream(null)
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause()
        videoRef.current.srcObject = null
        // Remove from DOM
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.removeChild(videoRef.current)
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      videoRef.current = null
    }

    if (engineRef.current) {
      engineRef.current.dispose()
      engineRef.current = null
    }
    lastTimestampRef.current = -1
    unfocusStartRef.current = null
    lastLookingStateRef.current = true
  }, [setTracking, setLookingAtScreen, setIsFaceDetected, setCameraStream])

  const startTracking = useCallback(async () => {
    if (isTrackingRef.current) {
      console.log('startTracking: already tracking, returning')
      return
    }
    setError(null)

    try {
      console.log('Initializing Gaze Focus Engine...', { isActive })
      
      // 2. Setup hidden video
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.autoplay = true
      video.width = 640
      video.height = 480
      video.style.display = 'none'
      document.body.appendChild(video)
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
      
      // Wait for video to be ready with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video metadata timeout')), 10000)
        video.onloadedmetadata = () => {
          clearTimeout(timeout)
          resolve(true)
        }
        video.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('Video load error'))
        }
      })
      
      // Ensure video is playing
      if (video.paused) {
        await video.play().catch(() => {
          console.warn('Video autoplay failed, continuing anyway')
        })
      }

      // Verify video is actually ready
      if (video.readyState < 2) {
        throw new Error('Video not ready - readyState: ' + video.readyState)
      }

      // 3. Init engine
      const engine = new GazeEngine({
        unfocusPauseDelay: thresholdSeconds * 1000,
        sensitivityMode: sensitivityMode,
      })
      await engine.initialize()
      engineRef.current = engine

      // 4. Start loop
      isTrackingRef.current = true
      setTracking(true)

      const loop = (time: number) => {
        if (!isTrackingRef.current || !videoRef.current || !engineRef.current) return

        // Check if video is ready for processing
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }

        let timestamp = performance.now()
        if (timestamp <= lastTimestampRef.current) {
          timestamp = lastTimestampRef.current + 16 // Minimum frame time ~60fps
        }
        lastTimestampRef.current = timestamp

        try {
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
        } catch (detectError) {
          console.warn('Detection error, continuing:', detectError)
        }

        rafRef.current = requestAnimationFrame(loop)
      }

      rafRef.current = requestAnimationFrame(loop)
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start eye tracking'
      console.error('Focus Engine Error:', errorMessage)
      setError(errorMessage)

      stopTracking()
    }
  }, [thresholdSeconds, setTracking, setIsFaceDetected, setLookingAtScreen, setCameraStream, incrementDistractionCount, stopTracking])

  // When isActive is true, always start tracking regardless of isEnabled
  // This ensures eye tracking works when video player is open
  useEffect(() => {
    // Always try to start when isActive is true
    if (isActive && !isTrackingRef.current) {
      startTracking()
    }
    // Only stop when isActive becomes false
    if (!isActive) {
      stopTracking()
    }
  }, [isActive, startTracking, stopTracking])

  return { stream: streamRef.current, error }
}
