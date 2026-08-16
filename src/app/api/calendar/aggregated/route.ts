import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { aggregateFeeds } from '@/lib/calendar/ics'

/**
 * GET /api/calendar/aggregated?from=<ISO>&to=<ISO>
 *
 * Merges every enabled external read-only feed into a single
 * event list for the unified calendar view. Per-feed failures
 * are reported alongside so the UI can flag them without
 * breaking the whole timeline.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fromParam = request.nextUrl.searchParams.get('from')
    const toParam = request.nextUrl.searchParams.get('to')

    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const to = toParam ? new Date(toParam) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      return NextResponse.json({ error: 'Invalid from/to range' }, { status: 400 })
    }

    const result = await aggregateFeeds(user.id, from, to)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error aggregating calendar feeds:', error)
    return NextResponse.json({ error: 'Failed to aggregate feeds' }, { status: 500 })
  }
}
