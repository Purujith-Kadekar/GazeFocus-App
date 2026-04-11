export interface DashboardBootstrapPayload {
  userId: string
  folders: any[]
  videos: any[]
  notes: any[]
  stats: any
  completedVideos: string[]
  playlists: any[]
  completedPlaylists: string[]
  todos: any[]
  settings: { weeklyGoal?: number } | null
  channels: any[]
}

interface DashboardBootstrapCacheEntry {
  fetchedAt: number
  payload: DashboardBootstrapPayload
}

let dashboardBootstrapCache: DashboardBootstrapCacheEntry | null = null

export function setDashboardBootstrapCache(payload: DashboardBootstrapPayload) {
  dashboardBootstrapCache = {
    fetchedAt: Date.now(),
    payload,
  }
}

export function getDashboardBootstrapCache() {
  return dashboardBootstrapCache
}

export function clearDashboardBootstrapCache() {
  dashboardBootstrapCache = null
}

export function isDashboardBootstrapCacheFresh(maxAgeMs: number) {
  if (!dashboardBootstrapCache) return false
  return Date.now() - dashboardBootstrapCache.fetchedAt <= maxAgeMs
}
