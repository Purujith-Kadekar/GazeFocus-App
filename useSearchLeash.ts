"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/stores/useStore";

/**
 * Search Leash Hook
 *
 * Manages the 15-minute countdown when user enters search mode.
 * - Ticks every second
 * - Warning at 5 minutes remaining
 * - Locks search UI at 0
 */

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
  const { searchLeash, startSearchLeash, tickSearchLeash, resetSearchLeash } =
    useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    intervalRef.current = setInterval(() => {
      tickSearchLeash();
    }, 1000);
  }, [tickSearchLeash, stopTick]);

  // Start ticking when leash becomes active
  useEffect(() => {
    if (searchLeash.active && !searchLeash.locked) {
      startTick();
    } else {
      stopTick();
    }
    return stopTick;
  }, [searchLeash.active, searchLeash.locked, startTick, stopTick]);

  // Format remaining time as MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Warning levels
  const getWarningLevel = (): "none" | "warning" | "critical" => {
    if (!searchLeash.active) return "none";
    if (searchLeash.remainingSeconds <= 60) return "critical";   // last 1 minute
    if (searchLeash.remainingSeconds <= 300) return "warning";   // last 5 minutes
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
