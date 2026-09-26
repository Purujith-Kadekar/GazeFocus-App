import type { EyeTrackingConfig, GazeResult } from './types';
import { DEFAULT_CONFIG, SENSITIVITY_THRESHOLDS } from './types';
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

/** tasks-vision 0.10.x declares WasmFileset locally without exporting it — mirror its shape. */
interface WasmFileset {
  wasmLoaderPath: string
  wasmBinaryPath: string
  assetLoaderPath?: string
}

// Utility to temporarily suppress console output (Support both Sync and Async)
const withSuppressedLogs = <T>(fn: () => T): T => {
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const filterPattern = /TensorFlow|XNNPACK|delegate|calculator_graph|INFO:/i;
  
  const mock = (orig: (...args: unknown[]) => void) => (...args: unknown[]) => {
    if (typeof args[0] === 'string' && filterPattern.test(args[0])) return;
    orig(...args);
  };

  console.log = mock(originalLog);
  console.info = mock(originalInfo);
  console.warn = mock(originalWarn);

  try {
    const result = fn();
    return result;
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;
  }
};

const withSuppressedLogsAsync = async <T>(fn: () => Promise<T>): Promise<T> => {
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const filterPattern = /TensorFlow|XNNPACK|delegate|calculator_graph|INFO:/i;
  
  const mock = (orig: (...args: unknown[]) => void) => (...args: unknown[]) => {
    if (typeof args[0] === 'string' && filterPattern.test(args[0])) return;
    orig(...args);
  };

  console.log = mock(originalLog);
  console.info = mock(originalInfo);
  console.warn = mock(originalWarn);

  try {
    return await fn();
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;
  }
};

export class GazeEngine {
  private faceLandmarker: FaceLandmarker | null = null;
  private config: EyeTrackingConfig;
  private initialized = false;
  private static readonly MEDIAPIPE_TASKS_VERSION = '0.10.32';

  constructor(config: Partial<EyeTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceLandmarker, FilesetResolver } = vision;

      const resolverCandidates = [
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${GazeEngine.MEDIAPIPE_TASKS_VERSION}/wasm`,
        `https://unpkg.com/@mediapipe/tasks-vision@${GazeEngine.MEDIAPIPE_TASKS_VERSION}/wasm`,
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      ];

      let filesetResolver: WasmFileset | null = null;
      let resolverError: unknown = null;

      for (const wasmBaseUrl of resolverCandidates) {
        try {
          filesetResolver = await FilesetResolver.forVisionTasks(wasmBaseUrl);
          resolverError = null;
          break;
        } catch (err) {
          resolverError = err;
        }
      }

      if (!filesetResolver) {
        throw resolverError ?? new Error('Failed to load MediaPipe WASM runtime');
      }

      this.faceLandmarker = await withSuppressedLogsAsync(async () => {
        return await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
      });

      this.initialized = true;
    } catch (err) {
      console.error('GazeEngine initialization failed:', err);
      throw err;
    }
  }

  detect(video: HTMLVideoElement, timestampMs: number): GazeResult {
    if (!this.faceLandmarker || !this.initialized) {
      return this.emptyResult(timestampMs);
    }

    if (!video || video.readyState < 2) {
      return this.emptyResult(timestampMs);
    }

    try {
      const landmarker = this.faceLandmarker;
      const results = withSuppressedLogs(() => {
        return landmarker.detectForVideo(video, timestampMs);
      });

      if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
        return this.emptyResult(timestampMs);
      }

      const landmarks = results.faceLandmarks[0];

      // 1. Analyze Head Pose
      const headPose = this.analyzeHeadPose(landmarks);
      
      // 2. Analyze Iris only if mode allows and landmarks available
      const t = SENSITIVITY_THRESHOLDS[this.config.sensitivityMode];
      let irisResult = { isLookingAtScreen: true, confidence: 1.0 };
      if (t.useEyeTracking && landmarks.length >= 478) {
        irisResult = this.analyzeIris(landmarks);
      }

      // For modes that use iris tracking (strict / moderate), the user must be
      // looking at the screen with BOTH their head AND their eyes.  Using OR
      // here meant that a frontal head pose alone was always sufficient, so the
      // video never paused when the user looked away with only their eyes.
      // For light mode (head-pose only) we fall back to the head check alone.
      const isLooking = t.useEyeTracking
        ? headPose.isFront && irisResult.isLookingAtScreen
        : headPose.isFront;

      return {
        isLookingAtScreen: isLooking,
        isFaceDetected: true,
        trackingMode: t.useEyeTracking && landmarks.length >= 478 ? 'eye' : 'face',
        confidence: Math.max(headPose.confidence, irisResult.confidence),
        timestamp: timestampMs,
      };
    } catch (err) {
      return this.emptyResult(timestampMs);
    }
  }

  private analyzeHeadPose(landmarks: NormalizedLandmark[]): { isFront: boolean; confidence: number } {
    const t = SENSITIVITY_THRESHOLDS[this.config.sensitivityMode];

    const NOSE = 1;
    const LEFT_CHEEK = 234;
    const RIGHT_CHEEK = 454;
    const FOREHEAD = 10;
    const CHIN = 152;

    const faceWidth = Math.abs(landmarks[RIGHT_CHEEK].x - landmarks[LEFT_CHEEK].x);
    const noseFromLeft = Math.abs(landmarks[NOSE].x - landmarks[LEFT_CHEEK].x);
    const yawRatio = noseFromLeft / faceWidth;
    
    const faceHeight = Math.abs(landmarks[CHIN].y - landmarks[FOREHEAD].y);
    const noseFromTop = Math.abs(landmarks[NOSE].y - landmarks[FOREHEAD].y);
    const pitchRatio = noseFromTop / faceHeight;

    const yawDev = Math.abs(yawRatio - 0.5);
    const pitchDev = Math.abs(pitchRatio - 0.5);

    const isLookingRight = yawRatio > t.sideThreshold;
    const isLookingUp = pitchRatio < t.upThreshold;
    const isLookingDown = pitchRatio > t.downThreshold;
    const isFront = (isLookingRight || isLookingUp || isLookingDown)
      ? yawDev < t.headYawSide && pitchDev < t.headPitchSide
      : yawDev < t.headYawNormal && pitchDev < t.headPitchNormal;
    
    const confidence = 1 - (yawDev + pitchDev);

    return { isFront, confidence };
  }

  private analyzeIris(landmarks: NormalizedLandmark[]): { isLookingAtScreen: boolean; confidence: number } {
    const LEFT_IRIS = 468;
    const RIGHT_IRIS = 473;
    const LEFT_EYE_INNER = 133;
    const LEFT_EYE_OUTER = 33;
    const RIGHT_EYE_INNER = 362;
    const RIGHT_EYE_OUTER = 263;
    
    const LEFT_EYE_TOP = 159;
    const LEFT_EYE_BOTTOM = 145;
    const RIGHT_EYE_TOP = 386;
    const RIGHT_EYE_BOTTOM = 374;

    const leftWidth = Math.abs(landmarks[LEFT_EYE_OUTER].x - landmarks[LEFT_EYE_INNER].x);
    const rightWidth = Math.abs(landmarks[RIGHT_EYE_INNER].x - landmarks[RIGHT_EYE_OUTER].x);
    const leftXRatio = (landmarks[LEFT_IRIS].x - landmarks[LEFT_EYE_INNER].x) / leftWidth;
    const rightXRatio = (landmarks[RIGHT_IRIS].x - landmarks[RIGHT_EYE_OUTER].x) / rightWidth;
    const xDev = Math.abs(((leftXRatio + rightXRatio) / 2) - 0.5);

    const leftHeight = Math.abs(landmarks[LEFT_EYE_BOTTOM].y - landmarks[LEFT_EYE_TOP].y);
    const rightHeight = Math.abs(landmarks[RIGHT_EYE_BOTTOM].y - landmarks[RIGHT_EYE_TOP].y);
    const leftYRatio = (landmarks[LEFT_IRIS].y - landmarks[LEFT_EYE_TOP].y) / leftHeight;
    const rightYRatio = (landmarks[RIGHT_IRIS].y - landmarks[RIGHT_EYE_TOP].y) / rightHeight;
    const yDev = Math.abs(((leftYRatio + rightYRatio) / 2) - 0.5);

    const t = SENSITIVITY_THRESHOLDS[this.config.sensitivityMode];
    const isLooking = xDev < t.irisXDev && yDev < t.irisYDev;
    const confidence = 1 - (xDev + yDev);

    return { isLookingAtScreen: isLooking, confidence };
  }

  private emptyResult(timestamp: number): GazeResult {
    return {
      isLookingAtScreen: false,
      isFaceDetected: false,
      trackingMode: 'none',
      confidence: 0,
      timestamp,
    };
  }

  dispose() {
    try {
      const landmarker = this.faceLandmarker;
      if (landmarker) {
        withSuppressedLogs(() => {
          landmarker.close();
        });
      }
    } catch (err) {}
    this.faceLandmarker = null;
    this.initialized = false;
  }
}
