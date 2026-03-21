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

    const updatedUserResult = await db.from('User').update({ name }).eq('id', user.id).select('id, name, email').single()
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

    db.from('User').delete().lte('deletionScheduledAt', new Date().toISOString()).neq('deletionScheduledAt', null).then(() => {}).catch(() => {})

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
