import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Schedule deletion 7 days from now
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 7)

    await db.from('User').update({ deletionScheduledAt: deletionDate.toISOString() }).eq('id', user.id)

    return NextResponse.json({ success: true, deletionScheduledAt: deletionDate })
  } catch (error) {
    console.error('Error scheduling deletion:', error)
    return NextResponse.json({ error: 'Failed to schedule deletion' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Cancel scheduled deletion
    await db.from('User').update({ deletionScheduledAt: null }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling deletion:', error)
    return NextResponse.json({ error: 'Failed to cancel deletion' }, { status: 500 })
  }
}
