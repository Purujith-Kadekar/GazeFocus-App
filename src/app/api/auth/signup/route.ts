import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be between 8 and 128 characters' }, { status: 400 })
    }

    // Check if signups are disabled
    const { data: siteSettings } = await db.from('SiteSettings').select('signupEnabled').eq('id', 'global').maybeSingle()
    if (siteSettings && !siteSettings.signupEnabled) {
      return NextResponse.json({ error: 'Signups are currently disabled' }, { status: 403 })
    }

    // Check if user already exists
    const { data: existingUser } = await db.from('User').select('id').eq('email', email).maybeSingle()
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const { data: user, error } = await db.from('User').insert({
      name: name || email.split('@')[0],
      email,
      passwordHash,
    }).select('id, name, email, image, createdAt').single()

    if (error) throw error

    // Create default user settings
    await db.from('UserSettings').insert({ userId: user.id })

    return NextResponse.json({
      id: user.id, name: user.name, email: user.email,
      image: user.image, createdAt: user.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
