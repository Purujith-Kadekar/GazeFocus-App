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
    setIsFaceFront,
    thresholdSeconds,
    setCameraStream,
    incrementDistractionCount,
    sensitivityMode,
  } = useEyeTrackingStore()

  const { isPlaying } = usePlayerStore()
  
  const [error, setError] = useState<string | null>(null)
  // Use useState for stream so consumers get reactive updates when the camera starts
  const [stream, setStreamState] = useState<MediaStream | null>(null)
  
  const engineRef = useRef<GazeEngine | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const isTrackingRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  // Cancellation flag: set to true by stopTracking so any in-progress
  // startTracking async steps can abort cleanly.
  const isCancelledRef = useRef(false)
  
  // Use a ref for thresholdSeconds so changes don't cause the tracking loop to restart
  const thresholdSecondsRef = useRef(thresholdSeconds)
  useEffect(() => { thresholdSecondsRef.current = thresholdSeconds }, [thresholdSeconds])

  // MediaPipe strict timestamp management
  const lastTimestampRef = useRef<number>(-1)
  
  // Buffering for "Distracted" state
  const unfocusStartRef = useRef<number | null>(null)
  const lastLookingStateRef = useRef(false)

  const stopTracking = useCallback(() => {
    // Signal any in-progress startTracking to abort
    isCancelledRef.current = true
    isTrackingRef.current = false
    setTracking(false)
    // Reset to false — before tracking starts, the system should not assume
    // the user is looking at the screen
    setLookingAtScreen(false)
    setIsFaceDetected(false)
    setCameraStream(null)
    setStreamState(null)
    
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
      } catch {
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
    lastLookingStateRef.current = false
  }, [setTracking, setLookingAtScreen, setIsFaceDetected, setCameraStream, setStreamState])

  const startTracking = useCallback(async () => {
    if (isTrackingRef.current) {
      return
    }
    setError(null)
    // Reset cancellation flag for this attempt
    isCancelledRef.current = false

    try {
      
      // 2. Setup hidden video
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.autoplay = true
      video.width = 640
      video.height = 480
      video.style.display = 'none'
      video.setAttribute('data-gazefocus-video', 'true')
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

      // Abort if stopTracking was called while we awaited camera permission
      if (isCancelledRef.current) {
        mediaStream.getTracks().forEach(t => t.stop())
        if (video.parentNode) video.parentNode.removeChild(video)
        videoRef.current = null
        return
      }
      
      streamRef.current = mediaStream
      setCameraStream(mediaStream)
      setStreamState(mediaStream) // Update reactive state so consumers get the new stream
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

      // Abort if stopTracking was called while we awaited video metadata.
      // stopTracking already cleaned up streamRef and videoRef, so just return.
      if (isCancelledRef.current) return
      
      // Ensure video is playing
      if (video.paused) {
        await video.play().catch(() => {
          console.warn('Video autoplay failed, continuing anyway')
        })
      }

      // Abort if stopTracking was called while video.play() was awaited.
      // stopTracking already cleaned up streamRef and videoRef, so just return.
      if (isCancelledRef.current) return

      // Verify video is actually ready
      if (video.readyState < 2) {
        throw new Error('Video not ready - readyState: ' + video.readyState)
      }

      // 3. Init engine
      const engine = new GazeEngine({
        unfocusPauseDelay: thresholdSecondsRef.current * 1000,
        sensitivityMode: sensitivityMode,
      })
      await engine.initialize()

      // Abort if stopTracking was called while MediaPipe models were loading
      if (isCancelledRef.current) {
        engine.dispose()
        return
      }

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
          setIsFaceFront(result.isFaceDetected && result.isLookingAtScreen)
          
          const isLooking = result.isLookingAtScreen && result.isFaceDetected

          if (isLooking) {
            unfocusStartRef.current = null
            if (!lastLookingStateRef.current) {
              setLookingAtScreen(true)
              lastLookingStateRef.current = true
            }
          } else {
            // Read threshold from ref so changes take effect without restarting tracking
            const currentThreshold = thresholdSecondsRef.current
            // IMMEDIATE RESPONSE if threshold is 0
            if (currentThreshold === 0) {
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
              if (elapsed >= (currentThreshold * 1000)) {
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
      // Only report/cleanup if this attempt wasn't already cancelled by stopTracking
      if (!isCancelledRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start eye tracking'
        console.error('Focus Engine Error:', errorMessage)
        setError(errorMessage)
        stopTracking()
      }
    }
  }, [sensitivityMode, setTracking, setIsFaceDetected, setLookingAtScreen, setCameraStream, setStreamState, incrementDistractionCount, stopTracking])

  // Start tracking when both isActive (video player is open) and isEnabled
  // (user has not disabled Smart Pause) are true.
  // Stop tracking when either becomes false so resources are released and
  // re-enabling triggers a fresh camera / engine start.
  useEffect(() => {
    if (isActive && isEnabled) {
      if (!isTrackingRef.current) {
        startTracking()
      }
    } else {
      stopTracking()
    }
    return () => {
      stopTracking()
    }
  }, [isActive, isEnabled, startTracking, stopTracking])

  // stream is now reactive state (useState) so it updates after the camera starts
  return { stream, error }
}
