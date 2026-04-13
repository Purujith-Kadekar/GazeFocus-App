'use client'

import { useEffect } from 'react'

const AUTO_SYNC_COOLDOWN_MS = 10 * 60 * 1000

export function AutoSyncInit() {
  useEffect(() => {
    const key = 'playlist_auto_sync_last_run'
    const now = Date.now()
    const lastRunRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    const lastRun = lastRunRaw ? Number(lastRunRaw) : 0

    if (Number.isFinite(lastRun) && now - lastRun < AUTO_SYNC_COOLDOWN_MS) {
      return
    }

    localStorage.setItem(key, String(now))

    fetch('/api/playlists/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto: true }),
      credentials: 'include',
      keepalive: true,
    }).catch(() => {
      // Silent fail on unauthenticated sessions or transient network errors.
    })
  }, [])

  return null
}
