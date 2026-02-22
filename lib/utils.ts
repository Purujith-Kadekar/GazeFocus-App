import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely (handles conflicts)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Generate a short base64-encoded beep tone (440Hz, 0.3s)
 * Used as HTML5 Audio source for inactivity alerts.
 * This is a minimal WAV file encoded in base64.
 */
export function getBeepAudioSrc(): string {
  // 440Hz sine wave, 0.5s, 8-bit PCM WAV — generated offline
  // This is a real minimal WAV header + PCM data for a beep
  const sampleRate = 8000;
  const frequency = 440;
  const duration = 0.5;
  const numSamples = Math.floor(sampleRate * duration);

  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);   // PCM
  view.setUint16(22, 1, true);   // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);   // 8-bit
  writeString(36, "data");
  view.setUint32(40, numSamples, true);

  // PCM samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Fade in/out to avoid clicks
    const envelope =
      t < 0.05
        ? t / 0.05
        : t > duration - 0.05
        ? (duration - t) / 0.05
        : 1;
    const sample = Math.round(128 + 127 * Math.sin(2 * Math.PI * frequency * t) * envelope);
    view.setUint8(44 + i, sample);
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
