import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import { getGoogleAccount, getGoogleOAuthConfig } from '@/lib/calendar/google'
import { clearFeedCache } from '@/lib/calendar/ics'

/**
 * GET /api/calendar/feeds
 * Returns the user's external feeds plus the Google write
 * account connection status.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: feeds } = await db
      .from('CalendarFeed')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: true })

    const account = await getGoogleAccount(user.id).catch(() => null)

    return NextResponse.json({
      feeds: feeds || [],
      google: {
        configured: Boolean(getGoogleOAuthConfig()),
        connected: Boolean(account),
        email: account?.email ?? null,
      },
    })
  } catch (error) {
    console.error('Error fetching calendar feeds:', error)
    return NextResponse.json({ error: 'Failed to fetch feeds' }, { status: 500 })
  }
}

/**
 * POST /api/calendar/feeds
 * Body: { feedUrl, feedName?, feedType? }
 * Adds a read-only ICS feed (or Google secret-address link).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { feedUrl, feedName, feedType } = body || {}

    if (!feedUrl || typeof feedUrl !== 'string') {
      return NextResponse.json({ error: 'feedUrl is required' }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(feedUrl)
    } catch {
      return NextResponse.json({ error: 'feedUrl must be a valid URL' }, { status: 400 })
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'feedUrl must use http(s)' }, { status: 400 })
    }

    // Google secret-address links are https://calendar.google.com/calendar/ical/.../basic.ics
    const isGoogleFeed = parsed.hostname.endsWith('calendar.google.com')
    const resolvedType =
      feedType === 'GOOGLE_READ_ONLY' || isGoogleFeed ? 'GOOGLE_READ_ONLY' : 'ICS_FEED'

    const { data: feed, error } = await db
      .from('CalendarFeed')
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        feedUrl: feedUrl.trim(),
        feedName: feedName?.trim()?.slice(0, 100) || parsed.hostname,
        feedType: resolvedType,
        isEnabled: true,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json(feed, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar feed:', error)
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 })
  }
}

/**
 * PATCH /api/calendar/feeds
 * Body: { id, isEnabled?, feedName? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, isEnabled, feedName } = body || {}
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof isEnabled === 'boolean') updates.isEnabled = isEnabled
    if (typeof feedName === 'string' && feedName.trim()) updates.feedName = feedName.trim().slice(0, 100)
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: feed, error } = await db
      .from('CalendarFeed')
      .update(updates)
      .eq('id', id)
      .eq('userId', user.id)
      .select('*')
      .single()

    if (error) throw error
    clearFeedCache(id)
    return NextResponse.json(feed)
  } catch (error) {
    console.error('Error updating calendar feed:', error)
    return NextResponse.json({ error: 'Failed to update feed' }, { status: 500 })
  }
}

/**
 * DELETE /api/calendar/feeds?id=<feedId>
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    await db.from('CalendarFeed').delete().eq('id', id).eq('userId', user.id)
    clearFeedCache(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting calendar feed:', error)
    return NextResponse.json({ error: 'Failed to delete feed' }, { status: 500 })
  }
}
