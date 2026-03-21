import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get user notifications (personal + global)
    const { data: notifications, error } = await db.from('Notification').select('*')
      .or(`userId.eq.${user.id},global.eq.true`)
      .order('createdAt', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json(notifications || [])
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { ids } = body

    if (ids && Array.isArray(ids)) {
      await db.from('Notification').update({ read: true }).in('id', ids)
    } else {
      // Mark all as read
      await db.from('Notification').update({ read: true }).eq('userId', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
