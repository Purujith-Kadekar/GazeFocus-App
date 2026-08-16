// ============================================
// GazeFocus — external ICS feed aggregation
// ============================================
// Fetches user-added read-only calendar feeds (any public
// .ics URL, including Google Calendar "secret address"
// links) and flattens them into ExternalCalendarEvents for
// the unified calendar view. Server-side only.

import * as ical from 'node-ical'
import type { CalendarFeed, ExternalCalendarEvent } from '@/types'
import { db } from '@/lib/db'

const CACHE_TTL_MS = 10 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000

interface FeedCacheEntry {
  events: ExternalCalendarEvent[]
  fetchedAt: number
}

// Module-level cache: survives across requests in a warm
// serverless instance; cold starts simply refetch.
const feedCache = new Map<string, FeedCacheEntry>()

// The runtime signature is fromURL(url, fetchOptions) -> Promise,
// but the shipped overload list only types the zero-options
// promise form, hence the local cast.
type FromUrlWithOptions = (
  url: string,
  options?: Record<string, unknown>
) => Promise<ical.CalendarResponse>

async function fetchFeed(
  feed: CalendarFeed,
  from: Date,
  to: Date
): Promise<ExternalCalendarEvent[]> {
  const parsed = await (ical.fromURL as unknown as FromUrlWithOptions)(feed.feedUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'user-agent': 'GazeFocus/1.0 (+calendar-aggregator)' },
  })

  const events: ExternalCalendarEvent[] = []

  for (const key of Object.keys(parsed || {})) {
    const entry = (parsed as Record<string, unknown>)[key] as ical.VEvent | undefined
    if (!entry || (entry as { type?: string }).type !== 'VEVENT') continue

    const pushInstance = (start: Date, end: Date | null, allDay: boolean) => {
      if (Number.isNaN(start.getTime())) return
      events.push({
        uid: String(entry.uid ?? key),
        title: String(entry.summary ?? '(untitled)'),
        start: start.toISOString(),
        end: end && !Number.isNaN(end.getTime()) ? end.toISOString() : null,
        allDay,
        location: entry.location ? String(entry.location) : null,
        feedId: feed.id,
        feedName: feed.feedName || 'External feed',
      })
    }

    const isDateOnly =
      entry.datetype === 'date' || (entry.start as { dateOnly?: boolean } | undefined)?.dateOnly === true

    if (entry.rrule) {
      // Expand recurring rules into concrete instances within range.
      try {
        const instances = ical.expandRecurringEvent(entry, { from, to })
        for (const instance of instances) {
          pushInstance(instance.start, instance.end, instance.isFullDay)
        }
        continue
      } catch {
        // Fall through and use the base occurrence if expansion fails.
      }
    }

    // Standalone occurrence, plus any explicit recurrence overrides.
    pushInstance(entry.start, entry.end ?? null, isDateOnly)
    if (entry.recurrences) {
      for (const overrideKey of Object.keys(entry.recurrences)) {
        const override = (entry.recurrences as Record<string, ical.VEvent>)[overrideKey]
        if (override?.start) {
          pushInstance(
            override.start,
            override.end ?? null,
            override.datetype === 'date' ||
              (override.start as { dateOnly?: boolean }).dateOnly === true
          )
        }
      }
    }
  }

  return events
}

export interface AggregatedFeedResult {
  events: ExternalCalendarEvent[]
  errors: { feedId: string; feedName: string; error: string }[]
}

/**
 * Fetch all enabled feeds for a user and merge their events,
 * clipped to [from, to]. Failures are isolated per feed so one
 * dead URL never breaks the whole calendar.
 */
export async function aggregateFeeds(
  userId: string,
  from: Date,
  to: Date
): Promise<AggregatedFeedResult> {
  const { data: feeds } = await db
    .from('CalendarFeed')
    .select('*')
    .eq('userId', userId)
    .eq('isEnabled', true)

  const result: AggregatedFeedResult = { events: [], errors: [] }
  const fromMs = from.getTime() - 7 * 24 * 60 * 60 * 1000 // margin for multi-day events
  const toMs = to.getTime() + 7 * 24 * 60 * 60 * 1000
  const cacheFrom = new Date(fromMs)
  const cacheTo = new Date(toMs)

  await Promise.all(
    (feeds || []).map(async (feed: CalendarFeed) => {
      try {
        const cacheKey = `${feed.id}:${fromMs}:${toMs}`
        const cached = feedCache.get(cacheKey)
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
          result.events.push(...cached.events)
          return
        }
        const events = (await fetchFeed(feed, cacheFrom, cacheTo)).filter(
          (ev) => {
            const startMs = Date.parse(ev.start)
            return !Number.isNaN(startMs) && startMs >= fromMs && startMs <= toMs
          }
        )
        feedCache.set(cacheKey, { events, fetchedAt: Date.now() })
        result.events.push(...events)
      } catch (err) {
        result.errors.push({
          feedId: feed.id,
          feedName: feed.feedName || feed.feedUrl,
          error: err instanceof Error ? err.message : 'Failed to fetch feed',
        })
      }
    })
  )

  result.events.sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  return result
}

/** Invalidate cached entries for one feed (or everything). */
export function clearFeedCache(feedId?: string) {
  if (feedId) {
    for (const key of feedCache.keys()) {
      if (key.startsWith(`${feedId}:`)) feedCache.delete(key)
    }
  } else {
    feedCache.clear()
  }
}
