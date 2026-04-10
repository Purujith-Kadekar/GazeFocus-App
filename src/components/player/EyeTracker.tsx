'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Target,
  Loader2,
  Video,
  VideoOff,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEyeTrackingStore, useUIStore } from '@/store/useStore'
import { useFocusEngine } from '@/hooks/useFocusEngine'
import { cn } from '@/lib/utils'

interface EyeTrackerProps {
  onCalibrationComplete?: () => void
}

export function EyeTracker({ onCalibrationComplete }: EyeTrackerProps) {
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const calibrationVideoRef = useRef<HTMLVideoElement>(null)
  const [showPreview, setShowPreview] = useState(true)

  const [isCalibrating, setIsCalibrating] = useState(false)

  useFocusEngine(isCalibrating)

  const {
    isEnabled,
    isCalibrated,
    isTracking,
    isLookingAtScreen,
    calibrationProgress,
    distractionCount,
    setEnabled,
    thresholdSeconds,
    setThresholdSeconds,
    isFaceDetected,
    isFaceFront,
    cameraStream,
    setCalibrated,
    setCalibrationProgress,
  } = useEyeTrackingStore()

  const { isCalibrationModalOpen, setCalibrationModalOpen } = useUIStore()

  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState(0)

  const calibrationPoints = [
    { x: 0.1, y: 0.1 },
    { x: 0.5, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.1, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.9, y: 0.5 },
    { x: 0.1, y: 0.9 },
    { x: 0.5, y: 0.9 },
    { x: 0.9, y: 0.9 },
  ]

  useEffect(() => {
    if (isTracking && cameraStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = cameraStream
    }
  }, [isTracking, cameraStream])

  useEffect(() => {
    if (isCalibrating && cameraStream && calibrationVideoRef.current) {
      calibrationVideoRef.current.srcObject = cameraStream
    }
  }, [isCalibrating, cameraStream])

  const handleStartCalibration = async () => {
    if (!isEnabled) setEnabled(true)
    setIsCalibrating(true)
    setCurrentCalibrationPoint(0)
    setCalibrationProgress(0)
    setCalibrationModalOpen(true)
  }

  const handlePointClick = () => {
    const nextPoint = currentCalibrationPoint + 1
    if (nextPoint >= calibrationPoints.length) {
      setCalibrated(true)
      setCalibrationProgress(100)
      setCurrentCalibrationPoint(nextPoint)
    } else {
      setCurrentCalibrationPoint(nextPoint)
      setCalibrationProgress((nextPoint / calibrationPoints.length) * 100)
    }
  }

  const handleCalibrationComplete = () => {
    setCalibrationModalOpen(false)
    setIsCalibrating(false)
    onCalibrationComplete?.()
  }

  const currentPoint = calibrationPoints[currentCalibrationPoint]

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {isEnabled && isTracking ? (
              <Eye className="h-5 w-5 text-green-500" />
            ) : (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            )}
            Eye Tracking
          </CardTitle>
          <CardDescription>
            Detects when you look away and pauses the video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              {isEnabled ? (
                isCalibrated ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Needs Calibration
                  </span>
                )
              ) : (
                <span className="text-muted-foreground text-sm">Disabled</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Enable Eye Tracking</span>
            <Button
              variant={isEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEnabled(!isEnabled)}
            >
              {isEnabled ? 'On' : 'Off'}
            </Button>
          </div>

          {isEnabled && (
            <Button
              variant={isCalibrated ? 'outline' : 'default'}
              className="w-full"
              onClick={handleStartCalibration}
            >
              <Target className="h-4 w-4 mr-2" />
              {isCalibrated ? 'Recalibrate' : 'Start Calibration'}
            </Button>
          )}

          {isEnabled && isCalibrated && (
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Camera Preview</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-6 px-2"
                >
                  {showPreview ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <VideoOff className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {showPreview && (
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  {isTracking ? (
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <VideoOff className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-xs">Camera off</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isEnabled && isCalibrated && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Focus State</span>
                <span
                  className={cn(
                    'font-medium px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider',
                    isLookingAtScreen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  )}
                >
                  {isLookingAtScreen ? 'High Focus' : 'Distracted'}
                </span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pause Threshold</span>
                  <span className="font-medium">{thresholdSeconds}s</span>
                </div>
                <Slider
                  value={[thresholdSeconds]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setThresholdSeconds(value[0])}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Video will pause after {thresholdSeconds}s of looking away.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCalibrationModalOpen}
        onOpenChange={(open) => {
          setCalibrationModalOpen(open)
          if (!open) setIsCalibrating(false)
        }}
      >
        <DialogContent className="max-w-none w-screen h-screen p-0 border-none bg-black/95 backdrop-blur-xl">
          <DialogTitle className="sr-only">Eye Tracking Calibration</DialogTitle>

          {isCalibrating && currentCalibrationPoint < calibrationPoints.length && (
            <div className="relative w-full h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white z-50 hover:bg-white/10"
                onClick={() => setCalibrationModalOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center text-white z-40 w-full px-4">
                <h2 className="text-3xl font-bold tracking-tight">Calibrate Your Vision</h2>
                <p className="text-white/60 mt-2 text-lg">
                  Follow the target with your eyes and click it to lock focus.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="w-64">
                    <Progress value={calibrationProgress} className="h-1.5 bg-white/10" />
                    <p className="text-[10px] uppercase font-bold tracking-widest mt-2 text-white/40 text-center">
                      Point {currentCalibrationPoint + 1} of {calibrationPoints.length}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="absolute w-16 h-16 rounded-full bg-primary shadow-[0_0_40px_rgba(59,130,246,0.6)] cursor-pointer flex items-center justify-center transition-all duration-500 ease-in-out group"
                style={{
                  left: `calc(${currentPoint.x * 100}% - 32px)`,
                  top: `calc(${currentPoint.y * 100}% - 32px)`,
                }}
                onClick={handlePointClick}
              >
                <div className="w-4 h-4 rounded-full bg-white animate-ping" />
                <Target className="absolute h-8 w-8 text-white opacity-50 group-hover:scale-110 transition-transform" />
              </div>

              <div className="absolute bottom-8 right-8 w-64 h-48 bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {cameraStream ? (
                  <video
                    ref={calibrationVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-xs font-medium">Initializing Camera...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentCalibrationPoint >= calibrationPoints.length && (
            <div className="w-full h-full flex items-center justify-center bg-slate-950">
              <div className="text-center max-w-md px-6 animate-in zoom-in-95 duration-500">
                <div className="relative mb-8 inline-block">
                  <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse" />
                  <CheckCircle className="h-32 w-32 mx-auto text-green-500 relative z-10" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">System Optimized!</h2>
                <p className="text-white/60 text-lg mb-10 leading-relaxed">
                  GazeFocus has successfully mapped your eye movements. Your distraction-free environment is now active.
                </p>
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-green-500/20"
                  onClick={handleCalibrationComplete}
                >
                  Enter Experience
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
