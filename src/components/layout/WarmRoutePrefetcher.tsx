'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const WARM_ROUTES = [
  '/dashboard',
  '/videos',
  '/playlists',
  '/channels',
  '/notes',
  '/folders',
  '/search',
  '/calendar',
  '/settings',
]

export function WarmRoutePrefetcher() {
  const router = useRouter()
  const hasWarmed = useRef(false)

  useEffect(() => {
    if (hasWarmed.current) return
    hasWarmed.current = true

    const warm = () => {
      WARM_ROUTES.forEach((route, index) => {
        setTimeout(() => {
          router.prefetch(route)
        }, index * 75)
      })
    }

    if ('requestIdleCallback' in window) {
      ;(window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(warm)
    } else {
      setTimeout(warm, 100)
    }
  }, [router])

  return null
}
