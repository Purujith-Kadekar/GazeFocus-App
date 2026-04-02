import { NextRequest, NextResponse } from 'next/server'
import { getAdminCredentials, verifyAdminCredentials, createAdminToken, changeAdminPassword, verifyAdminRequest } from '@/lib/admin-auth'

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

    // Constant-time comparison to prevent timing attacks
    const isValid = await verifyAdminCredentials(username ?? '', password ?? '')

    if (!isValid) {
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
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
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

// PUT /api/admin/auth - Change admin password
export async function PUT(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'currentPassword and newPassword are required' },
        { status: 400 }
      )
    }

    const error = await changeAdminPassword(currentPassword, newPassword)
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin password change error:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
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
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}
