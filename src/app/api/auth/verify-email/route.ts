import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'
import { getOtpSettings, hashOtpCode, isValidEmailFormat, normalizeEmail } from '@/lib/email-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const normalizedEmail = normalizeEmail(body?.email)
    const code = String(body?.code || '').trim()

    if (!isValidEmailFormat(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const otpSettings = getOtpSettings()
    if (!code || code.length !== otpSettings.otpLength) {
      return NextResponse.json({ error: `Verification code must be ${otpSettings.otpLength} digits` }, { status: 400 })
    }

    const { data: user, error } = await db
      .from('User')
      .select('id, email, name, emailVerified, verificationCodeHash, verificationCodeExpiresAt, verificationCodeAttempts')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid verification request' }, { status: 400 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    const attempts = Number(user.verificationCodeAttempts || 0)
    if (attempts >= otpSettings.otpMaxAttempts) {
      return NextResponse.json({ error: 'Too many invalid attempts. Please request a new code.' }, { status: 429 })
    }

    const expiryMs = user.verificationCodeExpiresAt ? new Date(user.verificationCodeExpiresAt).getTime() : 0
    if (!expiryMs || Date.now() > expiryMs) {
      return NextResponse.json({ error: 'Verification code expired. Please request a new code.' }, { status: 400 })
    }

    const expectedHash = hashOtpCode(code, normalizedEmail)
    if (!user.verificationCodeHash || expectedHash !== user.verificationCodeHash) {
      await db
        .from('User')
        .update({
          verificationCodeAttempts: attempts + 1,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id)

      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()
    const verifyResult = await db
      .from('User')
      .update({
        emailVerified: nowIso,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
        verificationCodeAttempts: 0,
        verificationCodeSentAt: null,
        updatedAt: nowIso,
      })
      .eq('id', user.id)

    if (verifyResult.error) {
      return NextResponse.json({ error: 'Failed to finalize verification' }, { status: 500 })
    }

    try {
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
      })
    } catch (welcomeError) {
      console.error('Failed to send welcome email after verification:', welcomeError)
    }

    return NextResponse.json({ success: true, verified: true })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
  }
}
