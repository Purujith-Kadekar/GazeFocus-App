import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { buildGoogleAuthUrl, getGoogleRedirectUri } from '@/lib/calendar/google'

/**
 * GET /api/calendar/google/connect
 * Starts the OAuth2 consent flow for the single primary Google
 * Calendar write account. Requires GOOGLE_CALENDAR_CLIENT_ID /
 * GOOGLE_CALENDAR_CLIENT_SECRET (or the shared GOOGLE_* pair).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const authUrl = await buildGoogleAuthUrl(user.id, getGoogleRedirectUri(origin))

    if (!authUrl) {
      return NextResponse.redirect(
        new URL('/calendar?google=not-configured', origin)
      )
    }

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error starting Google Calendar connect:', error)
    const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin
    return NextResponse.redirect(new URL('/calendar?google=error', origin))
  }
}
