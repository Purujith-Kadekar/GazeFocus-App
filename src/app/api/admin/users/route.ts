import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const usersResult = await db.from('User').select(`
      id,
      name,
      email,
      image,
      isBlocked,
      createdAt,
      lastActiveDate,
      deletionScheduledAt,
      accounts:Account(id, provider)
    `).order('createdAt', { ascending: false })

    const users = usersResult.data || []

    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const [notesCount, playlistsCount, videoProgressCount] = await Promise.all([
        db.from('Note').select('id', { count: 'exact', head: true }).eq('userId', user.id),
        db.from('Playlist').select('id', { count: 'exact', head: true }).eq('userId', user.id),
        db.from('VideoProgress').select('id', { count: 'exact', head: true }).eq('userId', user.id),
      ])
      return {
        ...user,
        accounts: user.accounts || [],
        _count: {
          notes: notesCount.count || 0,
          playlists: playlistsCount.count || 0,
          videoProgress: videoProgressCount.count || 0,
        },
      }
    }))

    return NextResponse.json(usersWithCounts)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, isBlocked } = await request.json()

    if (!userId || typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'userId and isBlocked are required' }, { status: 400 })
    }

    const userResult = await db.from('User').update({ isBlocked }).eq('id', userId).select('id, email, isBlocked').single()

    return NextResponse.json(userResult.data)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

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

      const userResult = await db.from('User').update({ deletionScheduledAt: deletionDate.toISOString() }).eq('id', userId).select('id, email, deletionScheduledAt').single()
      return NextResponse.json(userResult.data)
    }

    if (action === 'cancel') {
      const userResult = await db.from('User').update({ deletionScheduledAt: null }).eq('id', userId).select('id, email, deletionScheduledAt').single()
      return NextResponse.json(userResult.data)
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
