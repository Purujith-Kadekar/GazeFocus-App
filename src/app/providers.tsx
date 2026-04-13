'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useState, useLayoutEffect } from 'react'
import { useSettingsStore } from '@/store/useStore'
import { WarmRoutePrefetcher } from '@/components/layout/WarmRoutePrefetcher'
import { RouteTopLoader } from '@/components/layout/RouteTopLoader'

type ViewportMode = 'mobile' | 'tablet' | 'desktop'

const InitialViewportModeContext = createContext<ViewportMode>('desktop')

export function useInitialViewportMode() {
  return useContext(InitialViewportModeContext)
}

// A simple, bulletproof theme manager that doesn't rely on extra libraries
function ThemeManager() {
  const theme = useSettingsStore((state) => state.theme)

  useLayoutEffect(() => {
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

export function Providers({
  children,
  initialViewportMode = 'desktop',
}: {
  children: React.ReactNode
  initialViewportMode?: ViewportMode
}) {
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
      <InitialViewportModeContext.Provider value={initialViewportMode}>
        <QueryClientProvider client={queryClient}>
          <ThemeManager />
          <RouteTopLoader />
          <WarmRoutePrefetcher />
          {children}
        </QueryClientProvider>
      </InitialViewportModeContext.Provider>
    </SessionProvider>
  )
}
