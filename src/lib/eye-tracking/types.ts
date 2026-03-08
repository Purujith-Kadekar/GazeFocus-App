export interface EyeTrackingConfig {
  /** Milliseconds of looking away before pausing video */
  unfocusPauseDelay: number;
  /** Milliseconds of looking away before showing warning */
  warningDelay: number;
  /** Detection interval in milliseconds */
  detectionIntervalMs: number;
  /** Preferred camera facing mode */
  facingMode: 'user' | 'environment';
  /** Eye vs Face fallback confidence threshold */
  minEyeConfidence: number;
}

export const DEFAULT_CONFIG: EyeTrackingConfig = {
  unfocusPauseDelay: 2000,
  warningDelay: 1000,
  detectionIntervalMs: 100,
  facingMode: 'user',
  minEyeConfidence: 0.4,
};

export interface GazeResult {
  isLookingAtScreen: boolean;
  isFaceDetected: boolean;
  trackingMode: 'eye' | 'face' | 'none';
  confidence: number;
  timestamp: number;
}
