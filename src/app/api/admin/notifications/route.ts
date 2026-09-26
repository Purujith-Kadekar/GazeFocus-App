import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const notificationsResult = await db.from('Notification').select('id,title,message,global,read,userId,createdAt,user:User(email,name)').order('createdAt', { ascending: false }).limit(50)
    const notifications = notificationsResult.data || []

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Notification id is required' }, { status: 400 })
    }

    await db.from('Notification').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, message, userId } = await request.json()

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    if (typeof title !== 'string' || title.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or fewer' }, { status: 400 })
    }

    if (typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json({ error: 'Message must be 2,000 characters or fewer' }, { status: 400 })
    }

    let notification
    if (userId) {
      const notificationResult = await db.from('Notification').insert({ title, message, userId, global: false }).select('id,title,message,global,read,userId,createdAt').single()
      notification = notificationResult.data
    } else {
      const notificationResult = await db.from('Notification').insert({ title, message, global: true }).select('id,title,message,global,read,userId,createdAt').single()
      notification = notificationResult.data
    }
    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
