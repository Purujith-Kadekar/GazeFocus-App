"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useStore } from "@/stores/useStore";

/**
 * Gaze Detection Hook using MediaPipe Face Landmarker
 *
 * Runs entirely locally via WebAssembly.
 * No camera feed is transmitted anywhere.
 */

// Face landmark indices for eyes (MediaPipe 468-point mesh)
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263];
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];

interface UseGazeDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  onGazeAway: () => void;
  onGazeReturn: () => void;
  enabled: boolean;
}

export function useGazeDetection({
  videoRef,
  onGazeAway,
  onGazeReturn,
  enabled,
}: UseGazeDetectionOptions) {
  const { settings, gazeStatus, setGazeStatus, setGazeAwayStart, gazeAwayStartedAt } =
    useStore();

  const faceLandmarkerRef = useRef<unknown>(null);
  const animFrameRef = useRef<number>(0);
  const lastProcessTime = useRef<number>(0);
  const gazeAwayRef = useRef<boolean>(false);
  const [debugMsg, setDebugMsg] = useState<string>("");

  // ─── Initialize MediaPipe ────────────────────────────────────────────────────

  const initMediaPipe = useCallback(async () => {
    if (!enabled) {
      setGazeStatus("disabled");
      return;
    }

    // Ensure we have webcam access first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
       try {
         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
         if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", () => {
               // Only start detection once video is actually playing data
               if (gazeStatus === "loading" || gazeStatus === "no-camera") {
                  // Ready to detect
               }
            });
         }
       } catch (err) {
         console.error("Camera permission denied or error:", err);
         setGazeStatus("no-camera");
         return;
       }
    } else {
        console.error("getUserMedia not supported");
        setGazeStatus("no-camera");
        return;
    }

    try {
      setGazeStatus("loading");

      // Lazy import MediaPipe to avoid SSR issues
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1,
        }
      );

      faceLandmarkerRef.current = faceLandmarker;
      setGazeStatus("active");
    } catch (err) {
      console.error("[GazeDetection] Failed to initialize MediaPipe:", err);
      setGazeStatus("no-camera"); // Fallback status
    }
  }, [enabled, setGazeStatus, videoRef, gazeStatus]);

  // ─── Check if eyes are on screen ────────────────────────────────────────────

  const isLookingAtScreen = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (landmarks: any[]): boolean => {
      if (!landmarks || landmarks.length === 0) return false;

      const face = landmarks[0];
      if (!face) return false;

      // Check iris landmarks (if available — indicates eyes open and visible)
      try {
        const leftIris = LEFT_IRIS.map((i) => face[i]).filter(Boolean);
        const rightIris = RIGHT_IRIS.map((i) => face[i]).filter(Boolean);

        if (leftIris.length === 0 && rightIris.length === 0) {
           // Fallback to basic eye check if iris not found
          return true; // Assume looking if we at least found a face but no iris (rare)
        }

        // Calculate average iris position
        const irisPoints = [...leftIris, ...rightIris];
        const avgX = irisPoints.reduce((s, p) => s + p.x, 0) / irisPoints.length;
        const avgY = irisPoints.reduce((s, p) => s + p.y, 0) / irisPoints.length;

        // If iris is within reasonable screen-looking range (normalized 0-1 coords)
        // x: 0.2-0.8, y: 0.2-0.8 means roughly looking at the screen
        // Relaxed constraints for better UX
        const isLooking = avgX > 0.05 && avgX < 0.95 && avgY > 0.1 && avgY < 0.9;
        return isLooking;
      } catch {
        return false;
      }
    },
    []
  );

  // ─── Detection Loop ──────────────────────────────────────────────────────────

  const runDetection = useCallback(() => {
    if (!faceLandmarkerRef.current || !videoRef.current || !enabled) return;
    
    // Ensure video is playing
    if (videoRef.current.videoWidth === 0 || videoRef.current.paused) {
         animFrameRef.current = requestAnimationFrame(runDetection);
         return;
    }

    const now = performance.now();
    // Process at ~15fps to save CPU
    if (now - lastProcessTime.current < 66) {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }
    lastProcessTime.current = now;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (faceLandmarkerRef.current as any).detectForVideo(
        videoRef.current,
        now
      );

      const isLooking = isLookingAtScreen(result?.faceLandmarks ?? []);
      // Debug helper
      // console.log("Looking:", isLooking, result?.faceLandmarks?.length);

      if (!isLooking) {
        // Started looking away
        if (!gazeAwayRef.current) {
          gazeAwayRef.current = true;
          setGazeAwayStart(Date.now());
        } else {
          // Check if buffer exceeded
          const awayMs = gazeAwayStartedAt
            ? Date.now() - gazeAwayStartedAt
            : Date.now() - (Date.now() - 1); // fallback
          const bufferMs = settings.gazeBufferSeconds * 1000;

          if (awayMs >= bufferMs && gazeStatus !== "paused" && gazeStatus !== "away") {
            setGazeStatus("away");
            onGazeAway();
          }
        }
      } else {
        // Looking at screen
        if (gazeAwayRef.current || gazeStatus === "away") {
          gazeAwayRef.current = false;
          setGazeAwayStart(null);
          if (gazeStatus === "away") {
              setGazeStatus("active");
              onGazeReturn();
          }
        }
      }
    } catch (e) {
      // Silent fail — detection errors are non-critical
      console.warn("Detection error", e);
    }

    animFrameRef.current = requestAnimationFrame(runDetection);
  }, [
    enabled,
    videoRef,
    isLookingAtScreen,
    gazeAwayStartedAt,
    gazeStatus,
    settings.gazeBufferSeconds,
    setGazeAwayStart,
    setGazeStatus,
    onGazeAway,
    onGazeReturn,
  ]);

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  useEffect(() => {
    initMediaPipe();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [initMediaPipe]);

  useEffect(() => {
    if (gazeStatus === "active" || gazeStatus === "away" || gazeStatus === "paused") {
      animFrameRef.current = requestAnimationFrame(runDetection);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gazeStatus, runDetection]);

  return { gazeStatus };
}
