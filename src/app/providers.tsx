'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store/useStore'
import { WarmRoutePrefetcher } from '@/components/layout/WarmRoutePrefetcher'
import { RouteTopLoader } from '@/components/layout/RouteTopLoader'

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
        <RouteTopLoader />
        <WarmRoutePrefetcher />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
