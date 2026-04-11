import { createHash, randomInt } from 'crypto'
import { promises as dns } from 'dns'

const OTP_LENGTH = Number(process.env.EMAIL_OTP_LENGTH || 6)
const OTP_EXPIRY_MINUTES = Number(process.env.EMAIL_OTP_EXPIRY_MINUTES || 10)
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.EMAIL_OTP_RESEND_COOLDOWN_SECONDS || 60)
const OTP_MAX_ATTEMPTS = Number(process.env.EMAIL_OTP_MAX_ATTEMPTS || 5)

const EMAIL_FORMAT_REGEX = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/

function getHashSecret(): string {
  const secret = process.env.EMAIL_VERIFICATION_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('Missing EMAIL_VERIFICATION_SECRET or NEXTAUTH_SECRET for OTP hashing')
  }

  return secret
}

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase()
}

export function isValidEmailFormat(email: string): boolean {
  if (!email || email.length > 254) {
    return false
  }

  return EMAIL_FORMAT_REGEX.test(email)
}

export async function hasDeliverableDomain(email: string): Promise<boolean> {
  const domain = email.split('@')[1]
  if (!domain) {
    return false
  }

  try {
    const mxRecords = await dns.resolveMx(domain)
    if (mxRecords.length > 0) {
      return true
    }
  } catch {
    // Try A record lookup as fallback.
  }

  try {
    const aRecords = await dns.resolve4(domain)
    return aRecords.length > 0
  } catch {
    return false
  }
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH
  return randomInt(0, max).toString().padStart(OTP_LENGTH, '0')
}

export function hashOtpCode(code: string, email: string): string {
  const normalizedEmail = normalizeEmail(email)
  const secret = getHashSecret()
  return createHash('sha256').update(`${normalizedEmail}:${code}:${secret}`).digest('hex')
}

export function getOtpExpiryTimestamp(): string {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()
}

export function getOtpSettings() {
  return {
    otpLength: OTP_LENGTH,
    otpExpiryMinutes: OTP_EXPIRY_MINUTES,
    otpResendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    otpMaxAttempts: OTP_MAX_ATTEMPTS,
  }
}

export function isResendAllowed(lastSentAt?: string | null): boolean {
  if (!lastSentAt) {
    return true
  }

  const sentAtMs = new Date(lastSentAt).getTime()
  const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000
  return Date.now() - sentAtMs >= cooldownMs
}
