import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    // Require authentication — prevent email enumeration
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Only check if the email belongs to the current user (prevent IDOR)
    const normalizedEmail = email.toLowerCase()
    const isOwnEmail = normalizedEmail === user.email?.toLowerCase()

    if (!isOwnEmail) {
      // Don't reveal whether other emails exist — just return "not found"
      return NextResponse.json({ exists: false })
    }

    const { data: existingUser } = await db
      .from('User')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    // Only return existence check, NOT the userId (prevent IDOR)
    return NextResponse.json({ exists: !!existingUser })
  } catch (error) {
    console.error('User check error:', error)
    return NextResponse.json({ exists: false })
  }
}
