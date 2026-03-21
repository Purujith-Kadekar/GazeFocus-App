import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const settingsResult = await db.from('SiteSettings').select('signupEnabled').eq('id', 'global').single()
    if (settingsResult.data && !settingsResult.data.signupEnabled) {
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
    if (existingUserResult.data) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const userResult = await db.from('User').insert({
      email,
      passwordHash: hashedPassword,
      name: name || email.split('@')[0],
    }).select('id, email, name').single()

    const user = userResult.data

    await db.from('UserSettings').insert({ userId: user!.id })

    return NextResponse.json({
      success: true,
      user: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
