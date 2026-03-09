import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

// DELETE /api/user/delete - Schedule account for deletion (2-day grace period)
export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 2)

    await db.user.update({
      where: { id: user.id },
      data: { deletionScheduledAt: deletionDate },
    })

    return NextResponse.json({ success: true, deletionScheduledAt: deletionDate })
  } catch (error) {
    console.error('Error scheduling account deletion:', error)
    return NextResponse.json(
      { error: 'Failed to schedule account deletion' },
      { status: 500 }
    )
  }
}

// POST /api/user/delete - Cancel scheduled deletion
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.user.update({
      where: { id: user.id },
      data: { deletionScheduledAt: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling account deletion:', error)
    return NextResponse.json(
      { error: 'Failed to cancel account deletion' },
      { status: 500 }
    )
  }
}
