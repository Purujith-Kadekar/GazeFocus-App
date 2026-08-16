import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { disconnectGoogleAccount, getGoogleAccount, getGoogleOAuthConfig } from '@/lib/calendar/google'

/**
 * GET /api/calendar/google -> connection status
 * DELETE /api/calendar/google -> disconnect the write account
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const account = await getGoogleAccount(user.id).catch(() => null)
    return NextResponse.json({
      configured: Boolean(getGoogleOAuthConfig()),
      connected: Boolean(account),
      email: account?.email ?? null,
    })
  } catch (error) {
    console.error('Error fetching Google calendar status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await disconnectGoogleAccount(user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error disconnecting Google calendar:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
