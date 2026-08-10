'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/store/useStore'

/**
 * AuthSyncProvider bridges NextAuth session state with the Zustand auth store.
 * 
 * Key fixes:
 * 1. Syncs session on every update (including initial load)
 * 2. Forces session refresh after mount to catch stale session state
 * 3. Handles the race condition where client-side navigation after login
 *    doesn't properly reinitialize the session
 */
export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      useAuthStore.getState().setUser({
        id: session.user.id as string,
        email: session.user.email as string,
        name: session.user.name as string | null,
        image: session.user.image as string | null,
      })
      hasInitialized.current = true
    } else if (status === 'unauthenticated') {
      useAuthStore.getState().logout()
      hasInitialized.current = true
    }
    // During 'loading' status, don't change the store state yet
    // This prevents flashing "not authenticated" while session is being fetched
  }, [session, status])

  // Force a session refresh on mount to ensure we have the latest state
  // This handles the case where the session cookie was set by the server
  // but the client hasn't yet polled for it
  useEffect(() => {
    if (!hasInitialized.current && status === 'loading') {
      // Trigger a session update to force NextAuth to re-fetch the session
      update().catch(() => {
        // Silently handle - session might not be available yet
      })
    }
  }, [status, update])

  return <>{children}</>
}
