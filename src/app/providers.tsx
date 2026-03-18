'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store/useStore'

// A simple, bulletproof theme manager that doesn't rely on extra libraries
function ThemeManager() {
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.setAttribute('data-theme', systemTheme)
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  return null
}

// Initialize the playlist sync scheduler on app startup
function SchedulerInitializer() {
  useEffect(() => {
    const initScheduler = async () => {
      try {
        const res = await fetch('/api/cron/init')
        if (res.ok) {
          console.log('Playlist sync scheduler initialized')
        }
      } catch (error) {
        console.error('Failed to initialize playlist sync scheduler:', error)
      }
    }

    initScheduler()
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeManager />
        <SchedulerInitializer />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
