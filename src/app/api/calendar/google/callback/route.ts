import { NextRequest, NextResponse } from 'next/server'
import {
  connectGoogleAccount,
  getGoogleRedirectUri,
  verifyGoogleState,
} from '@/lib/calendar/google'

/**
 * GET /api/calendar/google/callback
 *
 * OAuth2 redirect target. The signed state JWT binds the flow
 * back to the user who clicked "Connect", so no session
 * assumptions are needed here.
 */
export async function GET(request: NextRequest) {
  const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin
  const calendarUrl = (status: string) => new URL(`/calendar?google=${status}`, origin)

  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const oauthError = request.nextUrl.searchParams.get('error')

    if (oauthError) {
      return NextResponse.redirect(calendarUrl('denied'))
    }
    if (!code || !state) {
      return NextResponse.redirect(calendarUrl('error'))
    }

    const userId = await verifyGoogleState(state)
    if (!userId) {
      return NextResponse.redirect(calendarUrl('expired'))
    }

    const account = await connectGoogleAccount(userId, code, getGoogleRedirectUri(origin))
    if (!account) {
      return NextResponse.redirect(calendarUrl('error'))
    }

    return NextResponse.redirect(calendarUrl('connected'))
  } catch (error) {
    console.error('Error in Google Calendar callback:', error)
    return NextResponse.redirect(calendarUrl('error'))
  }
}
