import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationsResult = await db
      .from('Notification')
      .select('id,userId,global,title,message,read,createdAt')
      .or(`userId.eq.${user.id},global.eq.true`)
      .order('createdAt', { ascending: false })
      .limit(20)
    const notifications = notificationsResult.data || []

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationIds } = await request.json()

    if (notificationIds && Array.isArray(notificationIds)) {
      for (const id of notificationIds) {
        await db.from('Notification').update({ read: true }).eq('id', id).or(`userId.eq.${user.id},global.eq.true`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
