import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

/**
 * POST /api/user/create
 *
 * This endpoint is used by the NextAuth JWT callback to create a user
 * record in the database when a user signs in via Firebase/OAuth for
 * the first time. It is NOT a public signup endpoint.
 *
 * Security: Requires authentication. emailVerified is always set to NOW()
 * for OAuth users (they're verified by the OAuth provider) and null for
 * credentials users (they must verify via OTP separately).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, image, authProvider } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data: existingUser } = await db
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' })
    }

    // Determine emailVerified based on auth provider:
    // - OAuth/Firebase users are verified by their provider
    // - Credentials users must verify via OTP (set to null)
    const isOAuthUser = authProvider === 'firebase' || authProvider === 'google'
    const emailVerified = isOAuthUser ? now : null

    const { data: newUser, error } = await db
      .from('User')
      .insert({
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        image: image || '',
        authProvider: authProvider || 'credentials',
        emailVerified,
        createdAt: now,
        updatedAt: now,
        lastLoginDate: now,
      })
      .select('id')
      .single()

    if (error) {
      console.error('User insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: newUser?.id })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create user' }, { status: 500 })
  }
}
