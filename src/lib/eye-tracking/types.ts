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
  /** Sensitivity mode for face/eye detection thresholds */
  sensitivityMode: 'strict' | 'moderate' | 'light';
}

export const DEFAULT_CONFIG: EyeTrackingConfig = {
  unfocusPauseDelay: 2000,
  warningDelay: 1000,
  detectionIntervalMs: 100,
  facingMode: 'user',
  minEyeConfidence: 0.4,
  sensitivityMode: 'moderate',
};

export const SENSITIVITY_THRESHOLDS = {
  // Strict: smaller allowed deviations → pauses for any minor head/eye movement
  strict: {
    headYawNormal: 0.18,
    headPitchNormal: 0.14,
    headYawSide: 0.08,
    headPitchSide: 0.08,
    sideThreshold: 0.55,
    upThreshold: 0.44,
    downThreshold: 0.56,
    irisXDev: 0.22,
    irisYDev: 0.25,
    useEyeTracking: true,
  },
  // Moderate: medium thresholds — requires a noticeable head or eye movement to trigger
  moderate: {
    headYawNormal: 0.26,
    headPitchNormal: 0.20,
    headYawSide: 0.12,
    headPitchSide: 0.12,
    sideThreshold: 0.55,
    upThreshold: 0.42,
    downThreshold: 0.58,
    irisXDev: 0.30,
    irisYDev: 0.33,
    useEyeTracking: true,
  },
  light: {
    headYawNormal: 0.50,
    headPitchNormal: 0.35,
    headYawSide: 0.30,
    headPitchSide: 0.25,
    sideThreshold: 0.55,
    upThreshold: 0.38,
    downThreshold: 0.65,
    irisXDev: 0.50,
    irisYDev: 0.55,
    useEyeTracking: false,
  },
} as const;

export interface GazeResult {
  isLookingAtScreen: boolean;
  isFaceDetected: boolean;
  trackingMode: 'eye' | 'face' | 'none';
  confidence: number;
  timestamp: number;
}
