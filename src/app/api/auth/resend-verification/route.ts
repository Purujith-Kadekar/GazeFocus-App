import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerificationOtpEmail } from '@/lib/email'
import {
  generateOtpCode,
  getOtpExpiryTimestamp,
  getOtpSettings,
  hashOtpCode,
  isResendAllowed,
  isValidEmailFormat,
  normalizeEmail,
} from '@/lib/email-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedEmail = normalizeEmail(body?.email)

    if (!isValidEmailFormat(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { data: user, error } = await db
      .from('User')
      .select('id, email, name, emailVerified, authProvider, verificationCodeSentAt')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }

    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true, sent: false })
    }

    if (user.authProvider === 'google') {
      return NextResponse.json({ error: 'Google accounts do not require email verification' }, { status: 400 })
    }

    if (!isResendAllowed(user.verificationCodeSentAt)) {
      return NextResponse.json({ error: 'Please wait before requesting another code' }, { status: 429 })
    }

    const otpCode = generateOtpCode()
    const otpCodeHash = hashOtpCode(otpCode, normalizedEmail)
    const otpExpiresAt = getOtpExpiryTimestamp()
    const nowIso = new Date().toISOString()
    const otpSettings = getOtpSettings()

    const updateResult = await db
      .from('User')
      .update({
        verificationCodeHash: otpCodeHash,
        verificationCodeExpiresAt: otpExpiresAt,
        verificationCodeAttempts: 0,
        verificationCodeSentAt: nowIso,
        updatedAt: nowIso,
      })
      .eq('id', user.id)

    if (updateResult.error) {
      return NextResponse.json({ error: 'Failed to update verification code' }, { status: 500 })
    }

    const sent = await sendVerificationOtpEmail({
      to: user.email,
      name: user.name,
      code: otpCode,
      expiresInMinutes: otpSettings.otpExpiryMinutes,
    })

    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('Error resending verification email:', error)
    return NextResponse.json({ error: 'Failed to resend verification code' }, { status: 500 })
  }
}
