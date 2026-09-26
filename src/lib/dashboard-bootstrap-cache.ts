import type { DashboardBootstrapResponse } from '@/components/dashboard/dashboard-types'

/**
 * The cached shape is exactly what GET /api/dashboard/bootstrap returns —
 * see DashboardBootstrapResponse in the dashboard's types module.
 */
export type DashboardBootstrapPayload = DashboardBootstrapResponse

interface DashboardBootstrapCacheEntry {
  fetchedAt: number
  payload: DashboardBootstrapPayload
}

const DASHBOARD_BOOTSTRAP_CACHE_KEY = 'gazefocus:dashboard-bootstrap-cache'

let dashboardBootstrapCache: DashboardBootstrapCacheEntry | null = null

function readDashboardCacheFromStorage(): DashboardBootstrapCacheEntry | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_BOOTSTRAP_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as DashboardBootstrapCacheEntry
    if (!parsed?.payload || typeof parsed?.fetchedAt !== 'number') {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function writeDashboardCacheToStorage(entry: DashboardBootstrapCacheEntry | null) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (!entry) {
      window.localStorage.removeItem(DASHBOARD_BOOTSTRAP_CACHE_KEY)
      return
    }

    window.localStorage.setItem(DASHBOARD_BOOTSTRAP_CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Ignore storage failures (private mode/quota) and continue with in-memory cache.
  }
}

export function setDashboardBootstrapCache(payload: DashboardBootstrapPayload) {
  const entry: DashboardBootstrapCacheEntry = {
    fetchedAt: Date.now(),
    payload,
  }

  dashboardBootstrapCache = entry
  writeDashboardCacheToStorage(entry)
}

export function getDashboardBootstrapCache() {
  if (dashboardBootstrapCache) {
    return dashboardBootstrapCache
  }

  const storageEntry = readDashboardCacheFromStorage()
  if (storageEntry) {
    dashboardBootstrapCache = storageEntry
  }

  return dashboardBootstrapCache
}

export function clearDashboardBootstrapCache() {
  dashboardBootstrapCache = null
  writeDashboardCacheToStorage(null)
}

export function isDashboardBootstrapCacheFresh(maxAgeMs: number) {
  const entry = getDashboardBootstrapCache()
  if (!entry) return false
  return Date.now() - entry.fetchedAt <= maxAgeMs
}
