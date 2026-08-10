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

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'notificationIds array is required' }, { status: 400 })
    }

    // Batch update instead of sequential loop
    // Only mark notifications that belong to the current user or are global
    const { error: updateError } = await db
      .from('Notification')
      .update({ read: true })
      .in('id', notificationIds)
      .or(`userId.eq.${user.id},global.eq.true`)

    if (updateError) {
      console.error('Error batch updating notifications:', updateError)
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
