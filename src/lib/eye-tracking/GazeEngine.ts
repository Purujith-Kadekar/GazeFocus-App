import type { EyeTrackingConfig, GazeResult } from './types';
import { DEFAULT_CONFIG } from './types';

// Utility to temporarily suppress console output (Support both Sync and Async)
const withSuppressedLogs = <T>(fn: () => T): T => {
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const filterPattern = /TensorFlow|XNNPACK|delegate|calculator_graph|INFO:/i;
  
  const mock = (orig: any) => (...args: any[]) => {
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
  
  const mock = (orig: any) => (...args: any[]) => {
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
  private faceLandmarker: any = null;
  private config: EyeTrackingConfig;
  private initialized = false;

  constructor(config: Partial<EyeTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

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
      const results = withSuppressedLogs(() => {
        return this.faceLandmarker.detectForVideo(video, timestampMs);
      });

      if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
        return this.emptyResult(timestampMs);
      }

      const landmarks = results.faceLandmarks[0];

      // 1. Analyze Head Pose
      const headPose = this.analyzeHeadPose(landmarks);
      
      // 2. Analyze Iris
      let irisResult = { isLookingAtScreen: true, confidence: 1.0 };
      if (landmarks.length >= 478) {
        irisResult = this.analyzeIris(landmarks);
      }

      const isLooking = headPose.isFront || (irisResult.isLookingAtScreen && headPose.confidence > 0.35);

      return {
        isLookingAtScreen: isLooking,
        isFaceDetected: true,
        trackingMode: landmarks.length >= 478 ? 'eye' : 'face',
        confidence: Math.max(headPose.confidence, irisResult.confidence),
        timestamp: timestampMs,
      };
    } catch (err) {
      return this.emptyResult(timestampMs);
    }
  }

  private analyzeHeadPose(landmarks: any[]): { isFront: boolean; confidence: number } {
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

    // RESTORED STABLE THRESHOLDS
    const isFront = yawDev < 0.30 && pitchDev < 0.22;
    
    const confidence = 1 - (yawDev + pitchDev);

    return { isFront, confidence };
  }

  private analyzeIris(landmarks: any[]): { isLookingAtScreen: boolean; confidence: number } {
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

    const isLooking = xDev < 0.35 && yDev < 0.38; 
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
      if (this.faceLandmarker) {
        withSuppressedLogs(() => {
          this.faceLandmarker.close();
        });
      }
    } catch (err) {}
    this.faceLandmarker = null;
    this.initialized = false;
  }
}
