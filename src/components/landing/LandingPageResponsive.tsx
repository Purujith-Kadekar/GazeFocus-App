'use client'

import { useEffect, useState } from 'react'
import LandingPage from '@/components/landing/LandingPage'
import LandingPageMobile from '@/components/landing/LandingPageMobile'
import LandingPageTablet from '@/components/landing/LandingPageTablet'
type ViewportMode = 'mobile' | 'tablet' | 'desktop'

function getViewportMode(width: number): ViewportMode {
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export default function LandingPageResponsive() {
  const [mode, setMode] = useState<ViewportMode | null>(null)

  useEffect(() => {
    const apply = () => setMode(getViewportMode(window.innerWidth))
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  if (mode === null) {
    return <div className="min-h-screen bg-background" />
  }

  if (mode === 'mobile') {
    return <LandingPageMobile />
  }

  if (mode === 'tablet') {
    return <LandingPageTablet />
  }

  return <LandingPage />
}
