'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const START_EVENT = 'gazefocus:route-loader-start'
const COMPLETE_EVENT = 'gazefocus:route-loader-complete'

export function startRouteTopLoader() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(START_EVENT))
}

export function beginRouteLoading() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(START_EVENT))
}

export function endRouteLoading() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(COMPLETE_EVENT))
}

export function RouteTopLoader() {
  const pathname = usePathname()

  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const progressTimerRef = useRef<number | null>(null)
  const doneTimerRef = useRef<number | null>(null)
  const hardStopTimerRef = useRef<number | null>(null)
  const startTickRef = useRef<number | null>(null)
  const isLoadingRef = useRef(false)

  const clearTimers = () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current)
    if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current)
    if (hardStopTimerRef.current) window.clearTimeout(hardStopTimerRef.current)
    if (startTickRef.current) window.clearTimeout(startTickRef.current)
    progressTimerRef.current = null
    doneTimerRef.current = null
    hardStopTimerRef.current = null
    startTickRef.current = null
  }

  const complete = () => {
    if (!isLoadingRef.current && startTickRef.current) {
      window.clearTimeout(startTickRef.current)
      startTickRef.current = null
      setVisible(false)
      setProgress(0)
      return
    }

    if (!isLoadingRef.current) return

    isLoadingRef.current = false
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }

    setProgress(100)
    doneTimerRef.current = window.setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 80)
  }

  const start = () => {
    if (isLoadingRef.current) return

    clearTimers()
    isLoadingRef.current = true
    setVisible(true)
    setProgress(20)

    progressTimerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev
        const step = prev < 55 ? 14 : prev < 80 ? 8 : 3
        return Math.min(92, prev + step)
      })
    }, 90)

    hardStopTimerRef.current = window.setTimeout(() => {
      complete()
    }, 8000)
  }

  const scheduleStart = () => {
    if (isLoadingRef.current || startTickRef.current) return
    startTickRef.current = window.setTimeout(() => {
      startTickRef.current = null
      start()
    }, 16)
  }

  const shouldStartForTargetUrl = (targetUrl: string | URL | null | undefined) => {
    if (!targetUrl) {
      return false
    }

    try {
      const nextUrl = new URL(String(targetUrl), window.location.href)
      const currentUrl = new URL(window.location.href)

      return (
        nextUrl.origin === currentUrl.origin &&
        nextUrl.pathname !== currentUrl.pathname
      )
    } catch {
      return false
    }
  }

  useEffect(() => {
    const handleRouteIntent = () => scheduleStart()
    const handleManualComplete = () => complete()

    const handleDocClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      if (!target) return

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (anchor.target === '_blank') return
      if (anchor.hasAttribute('download')) return

      try {
        const nextUrl = new URL(anchor.href, window.location.href)
        const currentUrl = new URL(window.location.href)
        const isSameOrigin = nextUrl.origin === currentUrl.origin
        const isDifferentRoute = nextUrl.pathname !== currentUrl.pathname

        if (isSameOrigin && isDifferentRoute) {
          scheduleStart()
        }
      } catch {
        // Ignore malformed URLs.
      }
    }

    const handlePopState = () => scheduleStart()

    const originalPushState = window.history.pushState.bind(window.history)
    const originalReplaceState = window.history.replaceState.bind(window.history)

    window.history.pushState = ((...args: Parameters<History['pushState']>) => {
      const targetUrl = args[2]
      if (shouldStartForTargetUrl(targetUrl)) {
        scheduleStart()
      }
      return originalPushState(...args)
    }) as History['pushState']

    window.history.replaceState = ((...args: Parameters<History['replaceState']>) => {
      const targetUrl = args[2]
      if (shouldStartForTargetUrl(targetUrl)) {
        scheduleStart()
      }
      return originalReplaceState(...args)
    }) as History['replaceState']

    window.addEventListener(START_EVENT, handleRouteIntent)
    window.addEventListener(COMPLETE_EVENT, handleManualComplete)
    window.addEventListener('popstate', handlePopState)
    document.addEventListener('click', handleDocClick, true)

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      window.removeEventListener(START_EVENT, handleRouteIntent)
      window.removeEventListener(COMPLETE_EVENT, handleManualComplete)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleDocClick, true)
      clearTimers()
    }
  }, [])

  useEffect(() => {
    complete()
  }, [pathname])

  return (
    <div
      className="gf-route-loader"
      style={{
        transform: `scaleX(${Math.max(0, Math.min(1, progress / 100))})`,
        opacity: visible ? 1 : 0,
      }}
      aria-hidden="true"
    />
  )
}
