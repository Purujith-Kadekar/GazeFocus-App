import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: users, error } = await db.from('User').select('id, name, email, image, isBlocked, createdAt, lastActiveDate, deletionScheduledAt').order('createdAt', { ascending: false })
    if (error) throw error

    // Get counts for each user
    const userIds = (users || []).map((u: any) => u.id)
    const usersWithCounts = await Promise.all((users || []).map(async (user: any) => {
      const [notesRes, playlistsRes, progressRes, accountsRes] = await Promise.all([
        db.from('Note').select('*', { count: 'exact', head: true }).eq('userId', user.id),
        db.from('Playlist').select('*', { count: 'exact', head: true }).eq('userId', user.id),
        db.from('VideoProgress').select('*', { count: 'exact', head: true }).eq('userId', user.id),
        db.from('Account').select('provider').eq('userId', user.id),
      ])
      return {
        ...user,
        accounts: (accountsRes.data || []).map((a: any) => ({ provider: a.provider })),
        _count: { notes: notesRes.count || 0, playlists: playlistsRes.count || 0, videoProgress: progressRes.count || 0 },
      }
    }))

    return NextResponse.json(usersWithCounts)
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

    const { data: user, error } = await db.from('User').update({ isBlocked }).eq('id', userId).select('id, email, isBlocked').single()
    if (error) throw error

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
      const deletionDate = new Date()
      deletionDate.setDate(deletionDate.getDate() + 7)
      const { data: user } = await db.from('User').update({ deletionScheduledAt: deletionDate.toISOString() }).eq('id', userId).select('id, email, deletionScheduledAt').single()
      return NextResponse.json(user)
    }

    if (action === 'cancel') {
      const { data: user } = await db.from('User').update({ deletionScheduledAt: null }).eq('id', userId).select('id, email, deletionScheduledAt').single()
      return NextResponse.json(user)
    }

    if (action === 'immediate') {
      await db.from('User').delete().eq('id', userId)
      return NextResponse.json({ success: true, id: userId })
    }

    return NextResponse.json({ error: 'Invalid action. Use: schedule, cancel, or immediate' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to process deletion' }, { status: 500 })
  }
}
