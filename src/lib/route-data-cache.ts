interface RouteCacheEntry<T> {
  fetchedAt: number
  payload: T
}

export function readRouteCache<T>(key: string): RouteCacheEntry<T> | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as RouteCacheEntry<T>
    if (!parsed || typeof parsed.fetchedAt !== 'number') return null

    return parsed
  } catch {
    return null
  }
}

export function writeRouteCache<T>(key: string, payload: T) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const entry: RouteCacheEntry<T> = {
      fetchedAt: Date.now(),
      payload,
    }
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Ignore storage failures and fall back to live fetches.
  }
}

export function clearRouteCache(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}
