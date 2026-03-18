import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const ADMIN_COOKIE = 'admin_session'

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

export function verifyAdminCredentials(username: string, password: string): boolean {
  const creds = getAdminCredentials()
  if (!creds) return false
  const usernameMatch = safeStringEqual(username, creds.username)
  const passwordMatch = safeStringEqual(password, creds.password)
  return usernameMatch && passwordMatch
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
