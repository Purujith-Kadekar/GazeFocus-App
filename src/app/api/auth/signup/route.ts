import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const siteSettingsResult = await db.from('SiteSettings').select('signupEnabled').eq('id', 'global').maybeSingle()
    if (siteSettingsResult.error) {
      console.error('Error reading site settings during signup:', siteSettingsResult.error)
    }
    if (siteSettingsResult.data && !siteSettingsResult.data.signupEnabled) {
      return NextResponse.json(
        { error: 'New signups are currently disabled' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be at most 128 characters long' },
        { status: 400 }
      )
    }

    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasDigit = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)
    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
      return NextResponse.json(
        {
          error:
            'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
        },
        { status: 400 }
      )
    }

    const existingUserResult = await db.from('User').select('id').eq('email', email).maybeSingle()
    if (existingUserResult.error) {
      console.error('Error checking existing user:', existingUserResult.error)
      return NextResponse.json(
        { error: 'Failed to validate existing account: ' + existingUserResult.error.message },
        { status: 500 }
      )
    }
    if (existingUserResult.data) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const userId = randomUUID()
    const nowIso = new Date().toISOString()

    const userResult = await db.from('User').insert({
      id: userId,
      email,
      passwordHash: hashedPassword,
      name: name || email.split('@')[0],
      createdAt: nowIso,
      updatedAt: nowIso,
    }).select('id, email, name').single()

    if (userResult.error) {
      console.error('Error inserting user:', userResult.error)
      return NextResponse.json(
        { error: 'Failed to create user account: ' + userResult.error.message },
        { status: 500 }
      )
    }

    const user = userResult.data

    if (!user || !user.id) {
      console.error('User insert returned no data')
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    const settingsNowIso = new Date().toISOString()
    const userSettingsInsertResult = await db.from('UserSettings').insert({
      id: randomUUID(),
      userId: user.id,
      onboardingCompleted: false,
      updatedAt: settingsNowIso,
      createdAt: settingsNowIso,
    })
    
    if (userSettingsInsertResult.error) {
      console.error('Error creating user settings:', userSettingsInsertResult.error)
      // Don't fail here - user is already created, settings can be created on first login
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
