import { db } from './db'

/**
 * Short-TTL cache for the per-request User.isBlocked lookup.
 *
 * Every authenticated request used to run this query twice to three times
 * (middleware once, getCurrentUser again, some routes once more), which
 * added one DB round-trip to every page and API call. With the cache, the
 * first request per user pays the lookup and the next ones within TTL are
 * free. A failed lookup is cached as "not blocked" (fail-open) so a
 * database blip cannot log everyone out; the 5xx handling in the routes
 * still reports the outage.
 */

const TTL_MS = Number(process.env.USER_BLOCK_CACHE_TTL_MS || 30_000)

type CacheEntry = {
  expiresAt: number
  isBlocked: boolean
}

const globalForBlockCache = globalThis as unknown as {
  userBlockCache?: Map<string, CacheEntry>
  userBlockCacheSweepAt?: number
}

const cache: Map<string, CacheEntry> =
  globalForBlockCache.userBlockCache ?? new Map<string, CacheEntry>()
globalForBlockCache.userBlockCache = cache

const SWEEP_INTERVAL_MS = 60_000

function sweepIfDue() {
  const now = Date.now()
  const lastSweep = globalForBlockCache.userBlockCacheSweepAt ?? 0
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  globalForBlockCache.userBlockCacheSweepAt = now
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key)
  }
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  sweepIfDue()

  const cached = cache.get(userId)
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.isBlocked
  }

  try {
    const { data } = await db
      .from('User')
      .select('isBlocked')
      .eq('id', userId)
      .maybeSingle()

    const isBlocked = Boolean(data?.isBlocked)
    cache.set(userId, { expiresAt: now + TTL_MS, isBlocked })
    return isBlocked
  } catch {
    // Fail-open: cache a short negative answer so a burst of requests does
    // not hammer a struggling database with repeated lookups.
    cache.set(userId, { expiresAt: now + 2_000, isBlocked: false })
    return false
  }
}
