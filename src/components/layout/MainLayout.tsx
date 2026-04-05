'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore, useFolderStore, useAuthStore, useInactivityStore, usePlayerStore, useEyeTrackingStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { OnboardingGuide } from '@/components/onboarding/OnboardingGuide'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isSidebarOpen } = useUIStore()
  const pathname = usePathname()
  const { setFolders } = useFolderStore()
  const { setUser } = useAuthStore()
  const {
    timeoutSeconds,
    setAlerting,
    isAlerting,
    setLastActivityTime,
    setTimeUntilAlert,
    lastActivityTime,
    isActive: soundAlertsEnabled,
    setActive,
    setTimeoutSeconds,
  } = useInactivityStore()
  const { isPlaying } = usePlayerStore()
  const {
    isEnabled: eyeTrackingEnabled,
    cameraStream,
    setEnabled: setEyeTrackingEnabled,
    setThresholdSeconds,
    setTracking,
    setLookingAtScreen,
    setIsFaceDetected,
    setCameraStream,
    setSensitivityMode,
  } = useEyeTrackingStore()
  const [mounted, setMounted] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [settingsHydrated, setSettingsHydrated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    // Reset activity time on mount to prevent immediate inactivity popup
    setLastActivityTime(Date.now())
    // Delay inactivity detection by 30 seconds after page load
    const readyTimer = setTimeout(() => setSessionReady(true), 30000)

    // Listen for onboarding re-run from Settings
    const handleRunOnboarding = () => setShowOnboarding(true)
    window.addEventListener('run-onboarding', handleRunOnboarding)

    return () => {
      clearTimeout(readyTimer)
      window.removeEventListener('run-onboarding', handleRunOnboarding)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([
      fetch('/api/folders').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/auth/session').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([folders, session]) => {
      setFolders(folders)
      if (session?.user) {
        fetch('/api/user/profile')
          .then(r => r.ok ? r.json() : null)
          .then(userData => {
            setUser({
              id: session.user.id,
              email: userData?.email || session.user.email,
              name: userData?.name || session.user.name,
              image: userData?.image || session.user.image,
            })
            // Show welcome toast for new users (account created within last 60 seconds)
            if (userData?.createdAt) {
              const createdAt = new Date(userData.createdAt).getTime()
              const now = Date.now()
              const welcomeShown = localStorage.getItem('gazefocus_welcome_shown')
              if (now - createdAt < 60000 && welcomeShown !== session.user.id) {
                localStorage.setItem('gazefocus_welcome_shown', session.user.id)
                toast({
                  title: 'Welcome to Gaze Focus! \ud83c\udf89',
                  description: 'Your distraction-free learning journey starts now.',
                })
              }
            }
          })
          .catch(() => setUser(session.user))
      }
    }).catch(() => {})
  }, [setFolders, setUser]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hydrate behavior settings early so alert logic never uses default values.
  useEffect(() => {
    let isMounted = true

    const hydrateSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) return

        const data = await res.json()
        if (!isMounted) return

        if (typeof data.soundAlerts === 'boolean') setActive(data.soundAlerts)
        if (typeof data.inactivityTimeout === 'number') setTimeoutSeconds(data.inactivityTimeout)
        if (typeof data.eyeTrackingEnabled === 'boolean') setEyeTrackingEnabled(data.eyeTrackingEnabled)
        if (typeof data.eyeTrackingThreshold === 'number') setThresholdSeconds(data.eyeTrackingThreshold)
        if (data.sensitivityMode) setSensitivityMode(data.sensitivityMode)
        if (data.onboardingCompleted === false) setShowOnboarding(true)
      } catch {
        // ignore and keep defaults
      } finally {
        if (isMounted) setSettingsHydrated(true)
      }
    }

    hydrateSettings()

    return () => {
      isMounted = false
    }
  }, [setActive, setTimeoutSeconds, setEyeTrackingEnabled, setThresholdSeconds, setSensitivityMode, setShowOnboarding])

  // Inactivity detection
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      setLastActivityTime(Date.now())
      setAlerting(false)
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - lastActivityTime) / 1000)
      const remaining = timeoutSeconds - elapsed
      
      setTimeUntilAlert(Math.max(0, remaining))
      
      if (remaining <= 0 && !isAlerting && !isPlaying && sessionReady && settingsHydrated) {
        setAlerting(true)
        // Only play sound if sound alerts are enabled in settings
        if (soundAlertsEnabled) {
          try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+Onp6XiHVnZXt8goqXk4d1Z2R3e4OKlJOHdGdle3uBiZKSi3xoZ2V5fIGIkZOLfWpoZnZ7gIiQk4t9a2hmdnuAh5CTin1raGZ2e3+GjpGJfGxqZXh6gIaOkYl8bGpleHp/hY2QiHxubGZ4e4CFjpCHfG5sZnh8gISNj4d8bm1meHyAg42Ph3xubWZ4fH+Ci46GfG9tZnh9gIKLjoZ8b25meH2AgouOhnxxbmZ4fYCCi46GfHFuZnh9gIKLjoZ8cW5meICAgoqOhnxxb2Z4gICCio6GfHJvZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhnxyb2Z4gICCio6GfHJwZniAgIKKjoZ8cnBmeICAgomOhg==')
            audio.play().catch(() => {})
          } catch {}
        }
      }
    }, 1000)

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      clearInterval(interval)
    }
  }, [lastActivityTime, timeoutSeconds, isAlerting, setLastActivityTime, setTimeUntilAlert, setAlerting, soundAlertsEnabled, sessionReady, settingsHydrated])

  // Eye tracking cleanup - Only stop tracking when leaving video routes
  // This prevents race conditions with VideoPlayer's useFocusEngine
  useEffect(() => {
    const isVideoPlayerRoute =
      pathname?.startsWith('/video/') ||
      /^\/playlist\/[^/]+\/video\/[^/]+$/.test(pathname || '') ||
      /^\/channel\/[^/]+\/videos\/[^/]+$/.test(pathname || '') ||
      /^\/channel\/[^/]+\/live\/[^/]+$/.test(pathname || '')

    // Only stop tracking when leaving video pages, not when settings change
    // Let VideoPlayer handle starting/stopping based on its own logic
    if (!isVideoPlayerRoute && cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
      setTracking(false)
      setLookingAtScreen(true)
      setIsFaceDetected(false)
    }
  }, [pathname, cameraStream, setCameraStream, setTracking, setLookingAtScreen, setIsFaceDetected])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          '',
          isSidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Header />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Onboarding Guide */}
      {mounted && showOnboarding && (
        <OnboardingGuide
          onComplete={() => {
            setShowOnboarding(false)
            fetch('/api/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ onboardingCompleted: true }),
            }).catch(() => {})
          }}
        />
      )}

      {/* Inactivity Alert */}
      {mounted && (
        <AlertDialog open={isAlerting} onOpenChange={setAlerting}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Are you still there?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You&apos;ve been inactive for {timeoutSeconds} seconds. Your learning session has been paused.
                Click Continue to resume.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction asChild>
                <Button onClick={() => {
                  setAlerting(false)
                  setLastActivityTime(Date.now())
                }}>
                  Continue Learning
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
