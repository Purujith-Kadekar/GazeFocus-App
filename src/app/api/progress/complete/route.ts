import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { youtubeId, completed } = body

    if (!youtubeId) {
      return NextResponse.json(
        { error: 'YouTube ID is required' },
        { status: 400 }
      )
    }

    const progress = await db.videoProgress.upsert({
      where: {
        userId_youtubeId: {
          userId,
          youtubeId,
        },
      },
      update: {
        completed: completed ?? true,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId,
        youtubeId,
        secondsWatched: 0,
        completed: completed ?? true,
        completedAt: completed ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Error updating completion:', error)
    return NextResponse.json(
      { error: 'Failed to update completion' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const completedVideos = await db.videoProgress.findMany({
      where: { userId: user.id, completed: true },
      select: { youtubeId: true },
    })

    return NextResponse.json({ 
      completedVideos: completedVideos.map(v => v.youtubeId) 
    })
  } catch (error) {
    console.error('Error fetching completed videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completed videos' },
      { status: 500 }
    )
  }
}
