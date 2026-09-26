import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeEmail } from '@/lib/email-verification'

/**
 * Firebase Login API — authenticates via Firebase ID token and returns a JWT token.
 * 
 * This endpoint is for the Chrome Extension and Android APK which use Firebase
 * Auth SDK for OAuth (Google, GitHub) sign-in. The Firebase ID token is verified
 * server-side using Firebase Admin SDK, then a NextAuth-compatible JWT is issued.
 * 
 * This allows users who signed up via Google/GitHub OAuth on the webapp to also
 * authenticate in the extension/APK using the same Firebase providers.
 * 
 * Security:
 * - Verifies Firebase ID token using Firebase Admin SDK
 * - Creates/links user account in Supabase database
 * - Returns NextAuth-compatible JWT token
 * - Token expiry matches NextAuth session maxAge (7 days)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { error: 'Firebase ID token is required' },
        { status: 400 }
      )
    }

    // Verify Firebase ID token
    let decodedToken
    try {
      const { firebaseAdminInitialized, auth: firebaseAdminAuth } = await import('@/lib/firebase-admin')
      
      if (!firebaseAdminInitialized || !firebaseAdminAuth) {
        return NextResponse.json(
          { error: 'Firebase Admin SDK not initialized on server' },
          { status: 500 }
        )
      }

      decodedToken = await firebaseAdminAuth.verifyIdToken(idToken)
    } catch (error) {
      console.error('[Firebase Login] Token verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid Firebase ID token' },
        { status: 401 }
      )
    }

    const email = (decodedToken.email || '').toLowerCase()
    const name = decodedToken.displayName || decodedToken.name || ''
    const image = decodedToken.picture || decodedToken.photo_url || ''
    const firebaseUid = decodedToken.uid

    if (!email) {
      return NextResponse.json(
        { error: 'Firebase account has no associated email' },
        { status: 400 }
      )
    }

    const normalizedEmail = normalizeEmail(email)

    // Find or create user in database
    const { data: existingUser } = await db
      .from('User')
      .select('id,name,email,image,emailVerified')
      .eq('email', normalizedEmail)
      .single()

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      // Update last login and possibly image/name from Firebase
      const updates: Record<string, any> = { lastLoginDate: new Date().toISOString() }
      if (name && !existingUser.name) updates.name = name
      if (image && !existingUser.image) updates.image = image
      
      await db.from('User').update(updates).eq('id', userId)
    } else {
      // Create new user from Firebase data
      const { randomUUID } = await import('crypto')
      userId = randomUUID()
      const now = new Date().toISOString()
      
      await db.from('User').insert({
        id: userId,
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        image: image || null,
        authProvider: 'firebase',
        emailVerified: now, // Firebase-verified emails are auto-verified
        createdAt: now,
        updatedAt: now,
      })
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
      id: userId,
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      picture: image,
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

    // Get updated user data
    const { data: dbUser } = await db
      .from('User')
      .select('id,name,email,image')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        name: dbUser?.name || name || normalizedEmail.split('@')[0],
        image: dbUser?.image || image,
      },
      expiresAt,
    })
  } catch (error) {
    console.error('[Firebase Login] Error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
