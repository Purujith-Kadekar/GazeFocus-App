import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 2)

    await db.from('User').update({ deletionScheduledAt: deletionDate.toISOString() }).eq('id', user.id)

    return NextResponse.json({ success: true, deletionScheduledAt: deletionDate })
  } catch (error) {
    console.error('Error scheduling account deletion:', error)
    return NextResponse.json(
      { error: 'Failed to schedule account deletion' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.from('User').update({ deletionScheduledAt: null }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling account deletion:', error)
    return NextResponse.json(
      { error: 'Failed to cancel account deletion' },
      { status: 500 }
    )
  }
}
