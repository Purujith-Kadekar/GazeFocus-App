'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Settings as SettingsIcon, 
  Eye, 
  Volume2, 
  Moon, 
  Sun, 
  Monitor,
  Play,
  Loader2,
  RotateCcw,
  Zap,
  CheckCircle2,
  BookOpen,
  Target,
  Coffee
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { useEyeTrackingStore, useSettingsStore, useInactivityStore, usePlayerStore, useWatchBreakStore } from '@/store/useStore'

export function SettingsPage() {
  const { toast } = useToast()
  
  // Stores
  const storedTheme = useSettingsStore((state) => state.theme)
  const setStoredTheme = useSettingsStore((state) => state.setTheme)
  
  const timeoutSeconds = useInactivityStore((state) => state.timeoutSeconds)
  const setTimeoutSeconds = useInactivityStore((state) => state.setTimeoutSeconds)
  const alertsEnabled = useInactivityStore((state) => state.isActive)
  const setAlertsEnabled = useInactivityStore((state) => state.setActive)
  
  const thresholdSeconds = useEyeTrackingStore((state) => state.thresholdSeconds)
  const setThresholdSeconds = useEyeTrackingStore((state) => state.setThresholdSeconds)
  const trackingEnabled = useEyeTrackingStore((state) => state.isEnabled)
  const setTrackingEnabled = useEyeTrackingStore((state) => state.setEnabled)
  const sensitivityMode = useEyeTrackingStore((state) => state.sensitivityMode)
  const setSensitivityMode = useEyeTrackingStore((state) => state.setSensitivityMode)
  
  const playbackSpeed = usePlayerStore((state) => state.playbackSpeed)
  const setPlaybackSpeed = usePlayerStore((state) => state.setPlaybackSpeed)

  const watchBreakEnabled = useWatchBreakStore((state) => state.isEnabled)
  const setWatchBreakEnabled = useWatchBreakStore((state) => state.setEnabled)
  const watchBreakMinutes = useWatchBreakStore((state) => state.breakMinutes)
  const setWatchBreakMinutes = useWatchBreakStore((state) => state.setBreakMinutes)
  const watchBreakDurationMinutes = useWatchBreakStore((state) => state.breakDurationMinutes)
  const setWatchBreakDurationMinutes = useWatchBreakStore((state) => state.setBreakDurationMinutes)
  
  // Theme logic (custom data-theme system)
  const syncThemeToDom = (theme: string) => {
    const root = window.document.documentElement
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.setAttribute('data-theme', systemTheme)
    } else {
      root.setAttribute('data-theme', theme)
    }
  }

  // Local state for UI responsiveness
  const [localSettings, setLocalSettings] = useState({
    theme: storedTheme,
    eyeTrackingEnabled: trackingEnabled,
    sensitivityMode: sensitivityMode,
    inactivityTimeout: timeoutSeconds,
    soundAlerts: alertsEnabled,
    defaultPlaybackSpeed: playbackSpeed,
    eyeTrackingThreshold: thresholdSeconds,
    weeklyGoal: 10,
    watchBreakEnabled: watchBreakEnabled,
    watchBreakMinutes: watchBreakMinutes,
    watchBreakDurationMinutes: watchBreakDurationMinutes,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const isLoadedRef = useRef(false)

  // 1. Fetch initial settings from DB
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()

          // Theme comes from Zustand (persisted localStorage) — it's the source of truth
          // for this device, since the blocking script in layout.tsx also reads from it.
          // Other settings come from the DB.
          const currentTheme = useSettingsStore.getState().theme

          const settings = {
            theme: currentTheme,
            eyeTrackingEnabled: data.eyeTrackingEnabled ?? true,
            sensitivityMode: data.sensitivityMode ?? 'moderate',
            inactivityTimeout: data.inactivityTimeout ?? 30,
            soundAlerts: data.soundAlerts ?? true,
            autoPlayNext: data.autoPlayNext ?? true,
            defaultPlaybackSpeed: data.defaultPlaybackSpeed ?? 1.0,
            eyeTrackingThreshold: data.eyeTrackingThreshold ?? 0,
            weeklyGoal: data.weeklyGoal ?? 10,
            watchBreakEnabled: data.watchBreakEnabled ?? true,
            watchBreakMinutes: data.watchBreakMinutes ?? 45,
            watchBreakDurationMinutes: data.watchBreakDurationMinutes ?? 1,
          }
          
          setLocalSettings(settings)
          
          // Sync non-theme stores from DB values
          // (Theme is already correct in Zustand from persist — don't overwrite it)
          setTimeoutSeconds(settings.inactivityTimeout)
          setAlertsEnabled(settings.soundAlerts)
          setTrackingEnabled(settings.eyeTrackingEnabled)
          setThresholdSeconds(settings.eyeTrackingThreshold)
          setPlaybackSpeed(settings.defaultPlaybackSpeed)
          setSensitivityMode(settings.sensitivityMode)
          setWatchBreakEnabled(settings.watchBreakEnabled)
          setWatchBreakMinutes(settings.watchBreakMinutes)
          setWatchBreakDurationMinutes(settings.watchBreakDurationMinutes)

          // If the DB theme differs from local, push local theme to DB to keep them in sync
          if (data.theme !== currentTheme) {
            fetch('/api/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ theme: currentTheme }),
            }).catch(() => {})
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
        isLoadedRef.current = true
      }
    }

    loadSettings()
  }, [setTimeoutSeconds, setAlertsEnabled, setTrackingEnabled, setThresholdSeconds, setPlaybackSpeed, setSensitivityMode, setWatchBreakEnabled, setWatchBreakMinutes, setWatchBreakDurationMinutes])

  // Save a setting to the DB immediately (keepalive survives page unload)
  const saveToDb = (payload: Record<string, any>) => {
    setIsSaving(true)
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Save failed (${res.status})`)
        }
        setLastSaved(new Date())
      })
      .catch(err => {
        console.error('Failed to save setting:', err)
        toast({ title: 'Save failed', description: 'Your change could not be saved. Please try again.', variant: 'destructive' })
      })
      .finally(() => setIsSaving(false))
  }

  // Update local UI + Zustand stores only (no DB save)
  // Used by sliders during drag for live UI feedback
  const updateLocal = (key: string, value: boolean | number | string) => {
    if (!isLoadedRef.current) return
    setLocalSettings(prev => ({ ...prev, [key]: value }))

    if (key === 'theme') {
      setStoredTheme(value as 'light' | 'dark' | 'system')
      syncThemeToDom(value as 'light' | 'dark' | 'system')
    } else if (key === 'inactivityTimeout') {
      setTimeoutSeconds(value as number)
    } else if (key === 'soundAlerts') {
      setAlertsEnabled(value as boolean)
    } else if (key === 'eyeTrackingEnabled') {
      setTrackingEnabled(value as boolean)
    } else if (key === 'eyeTrackingThreshold') {
      setThresholdSeconds(value as number)
    } else if (key === 'sensitivityMode') {
      setSensitivityMode(value as 'strict' | 'moderate' | 'light')
    } else if (key === 'defaultPlaybackSpeed') {
      setPlaybackSpeed(value as number)
    } else if (key === 'watchBreakEnabled') {
      setWatchBreakEnabled(value as boolean)
    } else if (key === 'watchBreakMinutes') {
      setWatchBreakMinutes(value as number)
    } else if (key === 'watchBreakDurationMinutes') {
      setWatchBreakDurationMinutes(value as number)
    }
  }

  // Update local + save to DB immediately
  // Used by toggles, selects, and slider onValueCommit
  const handleChange = (key: string, value: boolean | number | string) => {
    updateLocal(key, value)
    if (!isLoadedRef.current) return
    saveToDb({ [key]: value })
  }

  const handleReset = async () => {
    setIsLoading(true)
    isLoadedRef.current = false
    try {
      const defaultValues = {
        theme: 'system' as const,
        eyeTrackingEnabled: true,
        sensitivityMode: 'moderate' as const,
        inactivityTimeout: 30,
        soundAlerts: true,
        autoPlayNext: true,
        defaultPlaybackSpeed: 1.0,
        eyeTrackingThreshold: 0,
        weeklyGoal: 10,
        watchBreakEnabled: true,
        watchBreakMinutes: 45,
        watchBreakDurationMinutes: 1,
      }
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultValues),
      })

      if (response.ok) {
        setLocalSettings(defaultValues)
        setStoredTheme('system')
        syncThemeToDom('system')
        setTimeoutSeconds(30)
        setAlertsEnabled(true)
        setTrackingEnabled(true)
        setThresholdSeconds(0)
        setSensitivityMode('moderate')
        setPlaybackSpeed(1.0)
        setWatchBreakEnabled(true)
        setWatchBreakMinutes(45)
        setWatchBreakDurationMinutes(1)
        
        toast({
          title: 'Settings reset',
          description: 'Defaults restored across all devices.',
        })
      }
    } catch (error) {
      console.error('Failed to reset settings:', error)
    } finally {
      setIsLoading(false)
      isLoadedRef.current = true
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Configuring your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 pb-28 sm:space-y-6 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
          <div className="mt-1 flex h-auto items-start gap-2 sm:h-5 sm:items-center">
            <p className="text-sm text-muted-foreground">
              Manage your focus preferences
            </p>
            {isSaving ? (
              <span className="flex items-center text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center text-xs text-green-500 animate-in fade-in duration-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Saved to cloud
              </span>
            ) : null}
          </div>
        </div>
        <Button variant="outline" onClick={handleReset} className="w-full rounded-full border-2 sm:w-auto">
          <RotateCcw className="h-4 w-4 mr-2" />
          Factory Reset
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
        <TabsList className="grid h-auto grid-cols-3 gap-1 rounded-2xl border-2 bg-muted/50 p-1 sm:flex sm:h-12 sm:rounded-full">
          <TabsTrigger value="general" className="rounded-xl px-3 py-2 text-xs sm:rounded-full sm:px-6 sm:py-0 sm:text-sm">General</TabsTrigger>
          <TabsTrigger value="eyetracking" className="rounded-xl px-3 py-2 text-xs sm:rounded-full sm:px-6 sm:py-0 sm:text-sm">Eye Tracking</TabsTrigger>
          <TabsTrigger value="playback" className="rounded-xl px-3 py-2 text-xs sm:rounded-full sm:px-6 sm:py-0 sm:text-sm">Video Player</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 sm:space-y-6">
          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {localSettings.theme === 'dark' ? <Moon className="h-5 w-5 text-blue-400" /> : 
                 localSettings.theme === 'light' ? <Sun className="h-5 w-5 text-yellow-500" /> : 
                 <Monitor className="h-5 w-5 text-primary" />}
                Theme
              </CardTitle>
              <CardDescription>Visual appearance of GazeFocus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Label className="text-sm font-semibold sm:text-base">Mode</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(val) => handleChange('theme', val)}
                >
                  <SelectTrigger className="w-full rounded-full border-2 sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="system">Follow System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                Alerts
              </CardTitle>
              <CardDescription>Inactivity and distraction notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-semibold sm:text-base">Sound Enabled</Label>
                <Switch
                  checked={localSettings.soundAlerts}
                  onCheckedChange={(val) => handleChange('soundAlerts', val)}
                />
              </div>
              <Separator className="bg-border/50 border" />
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Label className="text-sm font-semibold sm:text-base">Inactivity Timeout</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={10}
                      max={120}
                      step={5}
                      value={localSettings.inactivityTimeout}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(120, Number(e.target.value) || 10))
                        handleChange('inactivityTimeout', val)
                      }}
                      className="w-16 h-8 text-center font-mono font-bold text-primary border-2 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">sec</span>
                  </div>
                </div>
                <Slider
                  value={[localSettings.inactivityTimeout]}
                  min={10}
                  max={120}
                  step={5}
                  onValueChange={([val]) => updateLocal('inactivityTimeout', val)}
                  onValueCommit={([val]) => handleChange('inactivityTimeout', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Weekly Goal
              </CardTitle>
              <CardDescription>Set how many videos you want to watch per week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Label className="text-sm font-semibold sm:text-base">Videos per week</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    value={localSettings.weeklyGoal}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(50, Number(e.target.value) || 1))
                      handleChange('weeklyGoal', val)
                    }}
                    className="w-16 h-8 text-center font-mono font-bold text-primary border-2 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">videos</span>
                </div>
              </div>
              <Slider
                value={[localSettings.weeklyGoal]}
                min={1}
                max={50}
                step={1}
                onValueChange={([val]) => updateLocal('weeklyGoal', val)}
                onValueCommit={([val]) => handleChange('weeklyGoal', val)}
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Setup Guide
              </CardTitle>
              <CardDescription>Re-run the onboarding walkthrough</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Walk through all the features of GazeFocus step by step.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-2 shrink-0 sm:ml-4 sm:w-auto"
                  onClick={() => {
                    fetch('/api/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ onboardingCompleted: false }),
                    }).catch(() => {})
                    window.dispatchEvent(new CustomEvent('run-onboarding'))
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Run Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eyetracking" className="space-y-4 sm:space-y-6">
          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Focus Behavior
              </CardTitle>
              <CardDescription>Configure auto-pause parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-semibold sm:text-base">Tracking Enabled</Label>
                <Switch
                  checked={localSettings.eyeTrackingEnabled}
                  onCheckedChange={(val) => handleChange('eyeTrackingEnabled', val)}
                />
              </div>
              <Separator className="bg-border/50 border" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-sm font-semibold sm:text-base">Sensitivity Mode</Label>
                  <p className="text-xs text-muted-foreground mt-1">Controls how strictly gaze is tracked</p>
                </div>
                <Select
                  value={localSettings.sensitivityMode}
                  onValueChange={(val) => handleChange('sensitivityMode', val)}
                >
                  <SelectTrigger className="w-full rounded-full border-2 sm:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-red-500" />
                        Strict
                      </div>
                    </SelectItem>
                    <SelectItem value="moderate">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-yellow-500" />
                        Moderate
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-green-500" />
                        Light
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator className="bg-border/50 border" />
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Label className="text-sm font-semibold sm:text-base">Reaction Buffer</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={localSettings.eyeTrackingThreshold}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(5, Number(e.target.value) || 0))
                        handleChange('eyeTrackingThreshold', val)
                      }}
                      className="w-16 h-8 text-center font-mono font-bold text-yellow-500 border-2 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">sec</span>
                  </div>
                </div>
                <Slider
                  value={[localSettings.eyeTrackingThreshold]}
                  min={0}
                  max={5}
                  step={0.1}
                  onValueChange={([val]) => updateLocal('eyeTrackingThreshold', val)}
                  onValueCommit={([val]) => handleChange('eyeTrackingThreshold', val)}
                />
                <p className="text-xs text-muted-foreground italic mt-2">
                  0s = Instant pause on look-away.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playback" className="space-y-4 sm:space-y-6">
          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Player Pace
              </CardTitle>
              <CardDescription>Default video playback settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Label className="text-sm font-semibold sm:text-base">Default Speed</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0.25}
                    max={2}
                    step={0.25}
                    value={localSettings.defaultPlaybackSpeed}
                    onChange={(e) => {
                      const val = Math.max(0.25, Math.min(2, Number(e.target.value) || 1))
                      handleChange('defaultPlaybackSpeed', val)
                    }}
                    className="w-16 h-8 text-center font-mono font-bold text-primary border-2 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">x</span>
                </div>
              </div>
              <Slider
                value={[localSettings.defaultPlaybackSpeed]}
                min={0.25}
                max={2}
                step={0.25}
                onValueChange={([val]) => updateLocal('defaultPlaybackSpeed', val)}
                onValueCommit={([val]) => handleChange('defaultPlaybackSpeed', val)}
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-orange-400" />
                Watch Break Reminder
              </CardTitle>
              <CardDescription>Get reminded to take a break after watching non-stop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-semibold sm:text-base">Reminder Enabled</Label>
                <Switch
                  checked={localSettings.watchBreakEnabled}
                  onCheckedChange={(val) => handleChange('watchBreakEnabled', val)}
                />
              </div>
              <Separator className="bg-border/50 border" />
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label className="text-sm font-semibold sm:text-base">Remind after</Label>
                    <p className="text-xs text-muted-foreground mt-1">Minutes of continuous playback before reminder</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={10}
                      max={180}
                      step={5}
                      value={localSettings.watchBreakMinutes}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(180, Number(e.target.value) || 45))
                        handleChange('watchBreakMinutes', val)
                      }}
                      className="w-16 h-8 text-center font-mono font-bold text-orange-400 border-2 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">min</span>
                  </div>
                </div>
                <Slider
                  value={[localSettings.watchBreakMinutes]}
                  min={10}
                  max={180}
                  step={5}
                  onValueChange={([val]) => updateLocal('watchBreakMinutes', val)}
                  onValueCommit={([val]) => handleChange('watchBreakMinutes', val)}
                />
                <p className="text-xs text-muted-foreground italic mt-2">
                  Default: 45 min. Timer resets whenever you pause.
                </p>
              </div>
              <Separator className="bg-border/50 border" />
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label className="text-sm font-semibold sm:text-base">Break duration</Label>
                    <p className="text-xs text-muted-foreground mt-1">How long the mandatory break lasts before you can resume</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      value={localSettings.watchBreakDurationMinutes}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(5, Number(e.target.value) || 1))
                        handleChange('watchBreakDurationMinutes', val)
                      }}
                      className="w-16 h-8 text-center font-mono font-bold text-orange-400 border-2 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">min</span>
                  </div>
                </div>
                <Slider
                  value={[localSettings.watchBreakDurationMinutes]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={([val]) => updateLocal('watchBreakDurationMinutes', val)}
                  onValueCommit={([val]) => handleChange('watchBreakDurationMinutes', val)}
                />
                <p className="text-xs text-muted-foreground italic mt-2">
                  Default: 1 min. The site is locked until the countdown finishes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
