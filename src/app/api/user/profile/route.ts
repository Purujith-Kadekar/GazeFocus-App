import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    // Validate name: must be 1-100 chars after trimming
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      return NextResponse.json({ error: 'Name must be between 1 and 100 characters' }, { status: 400 })
    }

    const updatedUserResult = await db.from('User').update({ name: trimmedName }).eq('id', user.id).select('id, name, email').single()
    const updatedUser = updatedUserResult.data

    return NextResponse.json({
      id: updatedUser?.id,
      name: updatedUser?.name,
      email: updatedUser?.email,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // REMOVED: Fire-and-forget delete of expired users.
    // User cleanup should be handled by an admin-only cron endpoint,
    // not as a side effect of a profile GET request.

    const userDataResult = await db.from('User').select(`
      id,
      name,
      email,
      image,
      createdAt,
      deletionScheduledAt,
      accounts:Account(provider)
    `).eq('id', user.id).single()
    const userData = userDataResult.data

    const provider = userData?.accounts?.[0]?.provider || 'credentials'
    return NextResponse.json({ ...userData, provider })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
