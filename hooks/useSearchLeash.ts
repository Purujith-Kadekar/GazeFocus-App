"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { getBeepAudioSrc } from "@/lib/utils";

interface UseSearchLeashReturn {
  remainingSeconds: number;
  isLocked: boolean;
  isActive: boolean;
  formattedTime: string;
  warningLevel: "none" | "warning" | "critical";
  startLeash: () => void;
  resetLeash: () => void;
}

export function useSearchLeash(): UseSearchLeashReturn {
  const { searchLeash, settings, startSearchLeash, tickSearchLeash, resetSearchLeash } =
    useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track which beeps have already fired so we don't repeat
  const firedWarningBeep = useRef(false);
  const firedCriticalBeep = useRef(false);
  const firedLockBeep = useRef(false);

  // ─── Audio ────────────────────────────────────────────────────────────────

  const initAudio = useCallback(() => {
    if (typeof window === "undefined" || audioRef.current) return;
    try {
      audioRef.current = new Audio(getBeepAudioSrc());
      audioRef.current.volume = 0.7;
    } catch {
      // ignore
    }
  }, []);

  const playBeep = useCallback((volume = 0.7) => {
    if (!audioRef.current) return;
    try {
      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  // ─── Beep logic based on remaining seconds ────────────────────────────────

  const checkBeeps = useCallback(
    (remaining: number, locked: boolean) => {
      // Lock beep
      if (locked && !firedLockBeep.current) {
        firedLockBeep.current = true;
        if (settings.searchLeashLockBeep) playBeep(1.0); // loudest
        return;
      }

      // Critical beep (under 60s) — fires once
      if (remaining <= 60 && remaining > 0 && !firedCriticalBeep.current) {
        firedCriticalBeep.current = true;
        if (settings.searchLeashCriticalBeep) playBeep(0.9);
        return;
      }

      // Warning beep (under 300s = 5min) — fires once
      if (remaining <= 300 && remaining > 60 && !firedWarningBeep.current) {
        firedWarningBeep.current = true;
        if (settings.searchLeashWarningBeep) playBeep(0.6);
        return;
      }
    },
    [settings, playBeep]
  );

  // ─── Reset beep flags when leash resets ──────────────────────────────────

  useEffect(() => {
    if (!searchLeash.active) {
      firedWarningBeep.current = false;
      firedCriticalBeep.current = false;
      firedLockBeep.current = false;
    }
  }, [searchLeash.active]);

  // ─── Tick interval ────────────────────────────────────────────────────────

  const stopTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    initAudio();
    intervalRef.current = setInterval(() => {
      tickSearchLeash();
    }, 1000);
  }, [tickSearchLeash, stopTick, initAudio]);

  useEffect(() => {
    if (searchLeash.active && !searchLeash.locked) {
      startTick();
    } else {
      stopTick();
    }
    return stopTick;
  }, [searchLeash.active, searchLeash.locked, startTick, stopTick]);

  // ─── Check beeps on every tick ────────────────────────────────────────────

  useEffect(() => {
    checkBeeps(searchLeash.remainingSeconds, searchLeash.locked);
  }, [searchLeash.remainingSeconds, searchLeash.locked, checkBeeps]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getWarningLevel = (): "none" | "warning" | "critical" => {
    if (!searchLeash.active) return "none";
    if (searchLeash.remainingSeconds <= 60) return "critical";
    if (searchLeash.remainingSeconds <= 300) return "warning";
    return "none";
  };

  return {
    remainingSeconds: searchLeash.remainingSeconds,
    isLocked: searchLeash.locked,
    isActive: searchLeash.active,
    formattedTime: formatTime(searchLeash.remainingSeconds),
    warningLevel: getWarningLevel(),
    startLeash: startSearchLeash,
    resetLeash: resetSearchLeash,
  };
}
