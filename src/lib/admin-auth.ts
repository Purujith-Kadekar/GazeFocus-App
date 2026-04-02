import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const ADMIN_COOKIE = 'admin_session'
const BCRYPT_ROUNDS = 12

function getSecret(): Uint8Array {
  // Prefer a dedicated ADMIN_SECRET so the admin portal works even when
  // NEXTAUTH_SECRET is not configured (e.g. projects that only use the
  // admin portal without full NextAuth integration).
  const s = process.env.ADMIN_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!s) {
    throw new Error(
      'Neither ADMIN_SECRET nor NEXTAUTH_SECRET environment variable is set. ' +
      'Set ADMIN_SECRET (or NEXTAUTH_SECRET) to enable admin authentication.'
    )
  }
  return new TextEncoder().encode(s)
}

export function getAdminCredentials() {
  // Trim to guard against accidental leading/trailing whitespace in env values.
  // A value that is all whitespace becomes "" after trim, which is falsy,
  // so the null-guard below correctly rejects it.
  const username = process.env.ADMIN_USERNAME?.trim()
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!username || !password) return null
  return { username, password }
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses only Web APIs so it works in both Node.js and Edge runtimes.
 */
function safeStringEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const aBuf = enc.encode(a)
  const bBuf = enc.encode(b)
  const len = Math.max(aBuf.length, bBuf.length)
  // Compare every byte regardless of length; fold length mismatch into result
  // so no information about which strings share a common prefix is leaked.
  let result = 0
  for (let i = 0; i < len; i++) {
    result |= (aBuf[i] ?? 0) ^ (bBuf[i] ?? 0)
  }
  // Fold unequal lengths into the result after the loop
  result |= aBuf.length ^ bBuf.length
  return result === 0
}

/**
 * Returns the bcrypt-hashed password stored in the DB (if any).
 * Returns null when the column is missing or the row doesn't exist.
 */
async function getStoredPasswordHash(): Promise<string | null> {
  try {
    const result = await db
      .from('SiteSettings')
      .select('adminPasswordHash')
      .eq('id', 'global')
      .maybeSingle()
    return result.data?.adminPasswordHash ?? null
  } catch {
    return null
  }
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const creds = getAdminCredentials()
  if (!creds) return false

  // Username is always checked against the env var.
  if (!safeStringEqual(username, creds.username)) return false

  // Check whether a DB-stored bcrypt hash exists (set via the portal's
  // "Change Password" feature). If so, use it; otherwise fall back to the
  // plain-text env var.
  const hash = await getStoredPasswordHash()
  if (hash) {
    return bcrypt.compare(password, hash)
  }
  return safeStringEqual(password, creds.password)
}

/**
 * Change the admin password.
 * Verifies `currentPassword` first, then stores a bcrypt hash of
 * `newPassword` in the SiteSettings table.
 * Returns an error string on failure, or null on success.
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<string | null> {
  const creds = getAdminCredentials()
  if (!creds) return 'Admin portal is not configured'

  // Verify current password.
  const hash = await getStoredPasswordHash()
  let currentValid: boolean
  if (hash) {
    currentValid = await bcrypt.compare(currentPassword, hash)
  } else {
    currentValid = safeStringEqual(currentPassword, creds.password)
  }
  if (!currentValid) return 'Current password is incorrect'

  if (!newPassword || newPassword.length < 8) {
    return 'New password must be at least 8 characters'
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

  try {
    // Upsert: ensure the row exists, then store the hash.
    const existing = await db
      .from('SiteSettings')
      .select('id')
      .eq('id', 'global')
      .maybeSingle()

    if (existing.data) {
      await db
        .from('SiteSettings')
        .update({ adminPasswordHash: newHash })
        .eq('id', 'global')
    } else {
      await db
        .from('SiteSettings')
        .insert({ id: 'global', signupEnabled: true, adminPasswordHash: newHash, updatedAt: new Date().toISOString() })
    }
    return null
  } catch {
    return 'Failed to save new password'
  }
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

export async function verifyAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value
  if (!token) return false
  return verifyAdminToken(token)
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  if (!token) return false
  return verifyAdminToken(token)
}

