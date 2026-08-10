import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { db } from './db'
import { jwtVerify } from 'jose'
import { headers } from 'next/headers'

/**
 * Verify a Bearer token (JWT signed with NEXTAUTH_SECRET).
 * Returns the decoded payload or null if invalid/expired.
 */
async function verifyBearerToken(token: string): Promise<{ id: string; email: string; name: string; picture?: string } | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) return null

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))

    if (!payload.id || !payload.email) return null

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name as string) || '',
      picture: payload.picture as string | undefined,
    }
  } catch {
    // Token invalid, expired, or malformed
    return null
  }
}

/**
 * Get the current authenticated user from either:
 * 1. NextAuth cookie-based session (webapp)
 * 2. Bearer token in Authorization header (extension / APK)
 *
 * This allows the Chrome extension and Android APK to authenticate
 * using the JWT token returned by /api/auth/extension-login.
 */
export async function getCurrentUser() {
  // --- Try Bearer token auth first (extension / APK) ---
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = await verifyBearerToken(token)
      if (decoded) {
        try {
          const blockedResult = await db
            .from('User')
            .select('isBlocked')
            .eq('id', decoded.id)
            .maybeSingle()

          if (blockedResult.data?.isBlocked) {
            return null
          }
        } catch {
          // If block check fails, allow the request
        }

        return {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          image: decoded.picture || null,
        }
      }
    }
  } catch {
    // headers() may fail in some contexts; fall through to session auth
  }

  // --- Fall back to NextAuth session (webapp) ---
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  try {
    const blockedResult = await db
      .from('User')
      .select('isBlocked')
      .eq('id', session.user.id)
      .maybeSingle()

    if (blockedResult.data?.isBlocked) {
      return null
    }
  } catch {
    // If the block check fails, keep existing behavior instead of hard-failing all requests.
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}
