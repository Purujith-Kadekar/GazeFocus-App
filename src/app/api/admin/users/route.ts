import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isBlocked: true,
        createdAt: true,
        lastActiveDate: true,
        deletionScheduledAt: true,
        accounts: { select: { provider: true } },
        _count: {
          select: {
            notes: true,
            playlists: true,
            videoProgress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// PATCH /api/admin/users - Block/unblock a user
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, isBlocked } = await request.json()

    if (!userId || typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'userId and isBlocked are required' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { isBlocked },
      select: { id: true, email: true, isBlocked: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users - Schedule or cancel deletion, or delete immediately
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 })
    }

    if (action === 'schedule') {
      // Schedule deletion 7 days from now
      const deletionDate = new Date()
      deletionDate.setDate(deletionDate.getDate() + 7)

      const user = await db.user.update({
        where: { id: userId },
        data: { deletionScheduledAt: deletionDate },
        select: { id: true, email: true, deletionScheduledAt: true },
      })
      return NextResponse.json(user)
    }

    if (action === 'cancel') {
      const user = await db.user.update({
        where: { id: userId },
        data: { deletionScheduledAt: null },
        select: { id: true, email: true, deletionScheduledAt: true },
      })
      return NextResponse.json(user)
    }

    if (action === 'immediate') {
      await db.user.delete({ where: { id: userId } })
      return NextResponse.json({ success: true, id: userId })
    }

    return NextResponse.json({ error: 'Invalid action. Use: schedule, cancel, or immediate' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to process deletion' }, { status: 500 })
  }
}
