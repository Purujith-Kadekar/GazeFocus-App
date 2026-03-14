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
  Target
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
import { useSettingsStore, useInactivityStore, useEyeTrackingStore, usePlayerStore } from '@/store/useStore'

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
  
  const playbackSpeed = usePlayerStore((state) => state.playbackSpeed)
  const setPlaybackSpeed = usePlayerStore((state) => state.setPlaybackSpeed)
  
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
    inactivityTimeout: timeoutSeconds,
    soundAlerts: alertsEnabled,
    defaultPlaybackSpeed: playbackSpeed,
    eyeTrackingThreshold: thresholdSeconds,
    weeklyGoal: 10
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
            inactivityTimeout: data.inactivityTimeout ?? 30,
            soundAlerts: data.soundAlerts ?? true,
            autoPlayNext: data.autoPlayNext ?? true,
            defaultPlaybackSpeed: data.defaultPlaybackSpeed ?? 1.0,
            eyeTrackingThreshold: data.eyeTrackingThreshold ?? 0,
            weeklyGoal: data.weeklyGoal ?? 10
          }
          
          setLocalSettings(settings)
          
          // Sync non-theme stores from DB values
          // (Theme is already correct in Zustand from persist — don't overwrite it)
          setTimeoutSeconds(settings.inactivityTimeout)
          setAlertsEnabled(settings.soundAlerts)
          setTrackingEnabled(settings.eyeTrackingEnabled)
          setThresholdSeconds(settings.eyeTrackingThreshold)
          setPlaybackSpeed(settings.defaultPlaybackSpeed)

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
  }, [setTimeoutSeconds, setAlertsEnabled, setTrackingEnabled, setThresholdSeconds, setPlaybackSpeed])

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
  const updateLocal = (key: string, value: any) => {
    if (!isLoadedRef.current) return
    setLocalSettings(prev => ({ ...prev, [key]: value }))

    if (key === 'theme') {
      setStoredTheme(value)
      syncThemeToDom(value)
    } else if (key === 'inactivityTimeout') {
      setTimeoutSeconds(value)
    } else if (key === 'soundAlerts') {
      setAlertsEnabled(value)
    } else if (key === 'eyeTrackingEnabled') {
      setTrackingEnabled(value)
    } else if (key === 'eyeTrackingThreshold') {
      setThresholdSeconds(value)
    } else if (key === 'defaultPlaybackSpeed') {
      setPlaybackSpeed(value)
    }
  }

  // Update local + save to DB immediately
  // Used by toggles, selects, and slider onValueCommit
  const handleChange = (key: string, value: any) => {
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
        inactivityTimeout: 30,
        soundAlerts: true,
        autoPlayNext: true,
        defaultPlaybackSpeed: 1.0,
        eyeTrackingThreshold: 0,
        weeklyGoal: 10
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
        setPlaybackSpeed(1.0)
        
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <div className="flex items-center gap-2 mt-1 h-5">
            <p className="text-muted-foreground text-sm">
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
        <Button variant="outline" onClick={handleReset} className="rounded-full border-2">
          <RotateCcw className="h-4 w-4 mr-2" />
          Factory Reset
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full h-12 border-2">
          <TabsTrigger value="general" className="rounded-full px-6">General</TabsTrigger>
          <TabsTrigger value="eyetracking" className="rounded-full px-6">Eye Tracking</TabsTrigger>
          <TabsTrigger value="playback" className="rounded-full px-6">Video Player</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
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
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Mode</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(val) => handleChange('theme', val)}
                >
                  <SelectTrigger className="w-40 rounded-full border-2">
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
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Sound Enabled</Label>
                <Switch
                  checked={localSettings.soundAlerts}
                  onCheckedChange={(val) => handleChange('soundAlerts', val)}
                />
              </div>
              <Separator className="bg-border/50 border" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Inactivity Timeout</Label>
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
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Videos per week</Label>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Walk through all the features of GazeFocus step by step.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-2 shrink-0 ml-4"
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

        <TabsContent value="eyetracking" className="space-y-6">
          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Focus Behavior
              </CardTitle>
              <CardDescription>Configure auto-pause parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Tracking Enabled</Label>
                <Switch
                  checked={localSettings.eyeTrackingEnabled}
                  onCheckedChange={(val) => handleChange('eyeTrackingEnabled', val)}
                />
              </div>
              <Separator className="bg-border/50 border" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Reaction Buffer</Label>
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

        <TabsContent value="playback" className="space-y-6">
          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Player Pace
              </CardTitle>
              <CardDescription>Default video playback settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Default Speed</Label>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
