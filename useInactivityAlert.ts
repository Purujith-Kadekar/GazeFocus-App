"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { getBeepAudioSrc } from "@/lib/utils";

/**
 * Inactivity Detection Hook
 *
 * Uses Page Visibility API to detect:
 * 1. Tab switches (document.hidden)
 * 2. Window blur/focus
 *
 * When inactive > threshold:
 * - Play audio beep (HTML5 Audio, generated on-device)
 * - Pause video
 * - Show alert until user returns and refocuses
 */

interface UseInactivityAlertOptions {
  onInactive: () => void;   // called after threshold
  onReturn: () => void;     // called when user returns
}

export function useInactivityAlert({
  onInactive,
  onReturn,
}: UseInactivityAlertOptions) {
  const { settings, setTabActive, isTabActive } = useStore();
  const inactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAlertedRef = useRef(false);

  // ─── Initialize Audio ────────────────────────────────────────────────────────

  const initAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    if (audioRef.current) return;
    try {
      const audio = new Audio(getBeepAudioSrc());
      audio.volume = 0.6;
      audioRef.current = audio;
    } catch {
      console.warn("[InactivityAlert] Could not initialize audio");
    }
  }, []);

  const playBeep = useCallback(() => {
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked — user hasn't interacted yet, safe to ignore
      });
    } catch {
      // ignore
    }
  }, []);

  // ─── Handle Going Inactive ────────────────────────────────────────────────────

  const handleInactive = useCallback(() => {
    setTabActive(false);
    hasAlertedRef.current = false;

    // Clear any existing timer
    if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);

    inactiveTimerRef.current = setTimeout(() => {
      if (!hasAlertedRef.current) {
        hasAlertedRef.current = true;
        playBeep();
        onInactive();
      }
    }, settings.inactivityThresholdSeconds * 1000);
  }, [settings.inactivityThresholdSeconds, setTabActive, playBeep, onInactive]);

  // ─── Handle Returning Active ─────────────────────────────────────────────────

  const handleActive = useCallback(() => {
    if (inactiveTimerRef.current) {
      clearTimeout(inactiveTimerRef.current);
      inactiveTimerRef.current = null;
    }
    setTabActive(true);
    if (hasAlertedRef.current) {
      hasAlertedRef.current = false;
      onReturn();
    }
  }, [setTabActive, onReturn]);

  // ─── Page Visibility API ─────────────────────────────────────────────────────

  useEffect(() => {
    initAudio();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleInactive();
      } else {
        handleActive();
      }
    };

    const handleWindowBlur = () => handleInactive();
    const handleWindowFocus = () => handleActive();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);
    };
  }, [handleInactive, handleActive, initAudio]);

  // Re-initialize audio when settings change (threshold)
  useEffect(() => {
    if (inactiveTimerRef.current) {
      clearTimeout(inactiveTimerRef.current);
      inactiveTimerRef.current = null;
    }
  }, [settings.inactivityThresholdSeconds]);

  return { isTabActive };
}
