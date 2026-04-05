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
  // Strict: very small allowed deviations — face must stay nearly straight on (~10 degrees)
  strict: {
    headYawNormal: 0.10,
    headPitchNormal: 0.08,
    headYawSide: 0.06,
    headPitchSide: 0.06,
    sideThreshold: 0.55,
    upThreshold: 0.45,
    downThreshold: 0.55,
    irisXDev: 0.18,
    irisYDev: 0.20,
    useEyeTracking: true,
  },
  // Moderate: medium thresholds — requires a noticeable head or eye movement to trigger
  moderate: {
    headYawNormal: 0.26,
    headPitchNormal: 0.20,
    headYawSide: 0.14,
    headPitchSide: 0.12,
    sideThreshold: 0.57,
    upThreshold: 0.40,
    downThreshold: 0.60,
    irisXDev: 0.35,
    irisYDev: 0.38,
    useEyeTracking: true,
  },
  // Light: head-pose only with very large allowed angles — user can turn head significantly
  light: {
    headYawNormal: 0.45,
    headPitchNormal: 0.38,
    headYawSide: 0.38,
    headPitchSide: 0.32,
    sideThreshold: 0.65,
    upThreshold: 0.35,
    downThreshold: 0.68,
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
