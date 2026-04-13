'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Home,
  Search,
  Film,
  ListVideo,
  FileText,
  Settings,
  Eye,
  FolderOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Plus,
  Calendar,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OnboardingGuideProps {
  onComplete: () => void
  mode?: 'mobile' | 'tablet' | 'desktop'
}

type TooltipPosition = 'right' | 'bottom' | 'left' | 'top'

interface Step {
  targetId: string | null // null = centered modal (welcome/finish)
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  title: string
  description: string
  position: TooltipPosition
}

const desktopSteps: Step[] = [
  {
    targetId: null,
    icon: Sparkles,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
    title: 'Welcome to GazeFocus!',
    description:
      'Your distraction-free learning companion. Let\'s walk through the key features so you know where everything is.',
    position: 'bottom',
  },
  {
    targetId: 'onboarding-dashboard',
    icon: Home,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Dashboard',
    description: 'Your home base — see learning stats, streaks, recent videos, and quick actions.',
    position: 'right',
  },
  {
    targetId: 'onboarding-search-bar',
    icon: Search,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Search Bar',
    description: 'Quickly search for YouTube videos and playlists to add to your library.',
    position: 'bottom',
  },
  {
    targetId: 'onboarding-add-content',
    icon: Plus,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Add Content',
    description: 'Paste a YouTube URL to instantly add videos or playlists to your library.',
    position: 'bottom',
  },
  {
    targetId: 'onboarding-calendar',
    icon: Calendar,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Calendar',
    description: 'Track your daily focus sessions and see your learning consistency over time.',
    position: 'right',
  },
  {
    targetId: 'onboarding-videos',
    icon: Film,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Videos',
    description: 'Browse all your saved videos. Progress is auto-tracked so you can resume anytime.',
    position: 'right',
  },
  {
    targetId: 'onboarding-playlists',
    icon: ListVideo,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Playlists',
    description: 'Add full YouTube playlists and work through them one video at a time.',
    position: 'right',
  },
  {
    targetId: 'onboarding-channels',
    icon: Users,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Channels',
    description: 'Subscribe to YouTube channels and get organized access to all their videos.',
    position: 'right',
  },
  {
    targetId: 'onboarding-notes',
    icon: FileText,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Notes',
    description: 'Take timestamped notes while watching. Star important ones for quick review.',
    position: 'right',
  },
  {
    targetId: 'onboarding-folders',
    icon: FolderOpen,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Folders',
    description: 'Organize videos and playlists into folders. Drag and drop to reorder.',
    position: 'right',
  },
  {
    targetId: 'onboarding-eye-tracking',
    icon: Eye,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Eye Tracking',
    description: 'Auto-pauses video when you look away. 100% local — nothing is uploaded.',
    position: 'bottom',
  },
  {
    targetId: 'onboarding-settings',
    icon: Settings,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Settings',
    description: 'Customize theme, alerts, eye tracking sensitivity, and playback speed. Re-run this guide anytime from here.',
    position: 'right',
  },
  {
    targetId: null,
    icon: CheckCircle2,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'You\'re All Set!',
    description: 'Start by searching for a video or playlist. Happy focused learning!',
    position: 'bottom',
  },
]

const mobileSteps: Step[] = [
  {
    targetId: null,
    icon: Sparkles,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
    title: 'Welcome to GazeFocus Mobile!',
    description:
      'This is your mobile-first layout. Let\'s quickly walk through the controls built for one-handed use.',
    position: 'bottom',
  },
  {
    targetId: 'onboarding-mobile-brand',
    icon: Home,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Brand Home Link',
    description: 'Tap the logo/name anytime to return to dashboard.',
    position: 'bottom',
  },
  {
    targetId: 'onboarding-mobile-search',
    icon: Search,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Search',
    description: 'Use this icon to quickly search videos, playlists, and channels.',
    position: 'bottom',
  },
  {
    targetId: 'onboarding-add-content',
    icon: Plus,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Add Content',
    description: 'Paste a YouTube URL to add videos or playlists instantly.',
    position: 'bottom',
  },
  {
    targetId: 'onboarding-mobile-nav-dashboard',
    icon: Home,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Home Tab',
    description: 'Your overview with streak, stats, and recent activity.',
    position: 'top',
  },
  {
    targetId: 'onboarding-mobile-nav-videos',
    icon: Film,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Videos Tab',
    description: 'See all saved videos and continue from where you left off.',
    position: 'top',
  },
  {
    targetId: 'onboarding-mobile-nav-playlists',
    icon: ListVideo,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Playlists Tab',
    description: 'Manage and watch your playlists in sequence.',
    position: 'top',
  },
  {
    targetId: 'onboarding-mobile-nav-calendar',
    icon: Calendar,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Calendar Tab',
    description: 'Schedule tasks, videos, and playlists for focused sessions.',
    position: 'top',
  },
  {
    targetId: 'onboarding-mobile-nav-settings',
    icon: Settings,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Settings Tab',
    description: 'Adjust preferences and re-run onboarding anytime.',
    position: 'top',
  },
  {
    targetId: null,
    icon: CheckCircle2,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    title: 'Mobile Tour Complete',
    description: 'You are ready to use GazeFocus on mobile.',
    position: 'bottom',
  },
]

export function OnboardingGuide({ onComplete, mode = 'desktop' }: OnboardingGuideProps) {
  const steps = mode === 'mobile' ? mobileSteps : desktopSteps
  const [currentStep, setCurrentStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const Icon = step.icon

  // Find and measure the target element
  useEffect(() => {
    if (!step.targetId) {
      setSpotlightRect(null)
      return
    }

    const el = document.getElementById(step.targetId)
    if (!el) {
      setSpotlightRect(null)
      return
    }

    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSpotlightRect(rect)
    }

    measure()
    // Scroll element into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Re-measure after scroll
    const timer = setTimeout(measure, 350)

    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measure)
    }
  }, [step.targetId, currentStep])

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }, [isLast, onComplete])

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const handleSkip = useCallback(() => {
    onComplete()
  }, [onComplete])

  const getTooltipDimensions = () => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 390
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 844
    const horizontalPadding = mode === 'mobile' ? 10 : 16
    const baseWidth = !spotlightRect ? 420 : 360
    const width = Math.min(baseWidth, viewportWidth - horizontalPadding * 2)
    const estimatedHeight = mode === 'mobile' ? 290 : 320

    return { viewportWidth, viewportHeight, horizontalPadding, width, estimatedHeight }
  }

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

  // Calculate tooltip position relative to the spotlight
  const getTooltipStyle = (): React.CSSProperties => {
    const { viewportWidth, viewportHeight, horizontalPadding, width, estimatedHeight } = getTooltipDimensions()

    if (!spotlightRect) {
      // Center for welcome/finish steps
      return {
        width,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const pad = mode === 'mobile' ? 10 : 16
    const minX = horizontalPadding
    const maxX = viewportWidth - width - horizontalPadding
    const minY = 12
    const maxY = viewportHeight - estimatedHeight - 12

    const setPosition = (left: number, top: number): React.CSSProperties => ({
      width,
      left: clamp(left, minX, maxX),
      top: clamp(top, minY, Math.max(minY, maxY)),
    })

    switch (step.position) {
      case 'right':
        return setPosition(
          spotlightRect.right + pad,
          spotlightRect.top + spotlightRect.height / 2 - estimatedHeight / 2
        )
      case 'bottom':
        return setPosition(
          spotlightRect.left + spotlightRect.width / 2 - width / 2,
          spotlightRect.bottom + pad
        )
      case 'left':
        return setPosition(
          spotlightRect.left - width - pad,
          spotlightRect.top + spotlightRect.height / 2 - estimatedHeight / 2
        )
      case 'top':
        return setPosition(
          spotlightRect.left + spotlightRect.width / 2 - width / 2,
          spotlightRect.top - estimatedHeight - pad
        )
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - 6}
                y={spotlightRect.top - 6}
                width={spotlightRect.width + 12}
                height={spotlightRect.height + 12}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight ring glow */}
      {spotlightRect && (
        <div
          className="absolute rounded-xl ring-2 ring-primary/60 shadow-[0_0_20px_rgba(99,102,241,0.3)] pointer-events-none transition-all duration-300"
          style={{
            left: spotlightRect.left - 6,
            top: spotlightRect.top - 6,
            width: spotlightRect.width + 12,
            height: spotlightRect.height + 12,
          }}
        />
      )}

      {/* Clickable backdrop to skip */}
      <div className="absolute inset-0" onClick={handleSkip} />

      {/* Tooltip Card */}
      <div
        ref={tooltipRef}
        className="absolute z-10"
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn(
          "bg-card border-2 border-border/50 rounded-xl shadow-2xl overflow-hidden w-full max-h-[calc(100vh-24px)]"
        )}>
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', step.iconBg)}>
                  <Icon className={cn('h-5 w-5', step.iconColor)} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base leading-tight">{step.title}</h3>
                  <span className="text-[11px] text-muted-foreground">
                    {currentStep + 1} / {steps.length}
                  </span>
                </div>
              </div>
              {!isLast && (
                <button
                  onClick={handleSkip}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Dot indicators */}
            <div className="flex gap-1 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    i === currentStep
                      ? 'w-5 bg-primary'
                      : i < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted-foreground/20'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div>
                {!isFirst && (
                  <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1 h-8">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {!isLast && !isFirst && (
                  <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground h-8">
                    Skip
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} className="gap-1 h-8 px-4">
                  {isLast ? (
                    <>
                      Finish
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </>
                  ) : isFirst ? (
                    <>
                      Start Tour
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
