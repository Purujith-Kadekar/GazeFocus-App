import { NextRequest, NextResponse } from 'next/server'
import { authOptions, verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { normalizeEmail } from '@/lib/email-verification'

/**
 * Extension Login API — authenticates via email/password and returns a JWT token.
 * 
 * This endpoint is specifically for the Chrome Extension (and future APK) which
 * can't use cookie-based NextAuth sessions. It returns the JWT token directly
 * in the response body so the extension can store it in chrome.storage.
 * 
 * Security:
 * - Only allows email/password credentials (no OAuth)
 * - Requires email verification
 * - Returns the NextAuth JWT token which contains the user ID
 * - Token expiry matches the NextAuth session maxAge (7 days)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = normalizeEmail(email)

    // Find user in database
    const { data: user } = await db
      .from('User')
      .select('id,name,email,image,passwordHash,emailVerified')
      .eq('email', normalizedEmail)
      .single()

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'EmailNotVerified', message: 'Please verify your email before logging in.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create a NextAuth-compatible JWT token
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const now = Date.now()
    const maxAge = Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS || 7 * 24 * 60 * 60)
    const expiresAt = now + maxAge * 1000

    // Build JWT payload (matches NextAuth JWT structure)
    const jwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiresAt / 1000),
    }

    // Sign JWT using jose (NextAuth uses jose for JWT signing)
    const { SignJWT } = await import('jose')
    const token = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(now / 1000))
      .setExpirationTime(Math.floor(expiresAt / 1000))
      .sign(new TextEncoder().encode(secret))

    // Update last login date
    await db
      .from('User')
      .update({ lastLoginDate: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      expiresAt,
    })
  } catch (error) {
    console.error('[Extension Login] Error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
