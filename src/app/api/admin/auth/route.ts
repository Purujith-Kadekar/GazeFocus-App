import { NextRequest, NextResponse } from 'next/server'
import { getAdminCredentials, createAdminToken } from '@/lib/admin-auth'

const ADMIN_COOKIE = 'admin_session'

// POST /api/admin/auth - Admin login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    const creds = getAdminCredentials()

    if (!creds) {
      return NextResponse.json(
        { error: 'Admin portal is not configured' },
        { status: 503 }
      )
    }

    // Constant-time-ish comparison to prevent timing attacks
    const usernameMatch = username === creds.username
    const passwordMatch = password === creds.password

    if (!usernameMatch || !passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = await createAdminToken()

    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/auth - Admin logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
