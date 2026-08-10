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

    const now = new Date().toISOString()
    const isCompleted = completed ?? true

    // Use upsert to avoid race conditions (concurrent requests could both
    // see no existing record in the old select-then-insert pattern).
    const { data: progress, error: upsertError } = await db.from('VideoProgress').upsert({
      userId,
      youtubeId,
      secondsWatched: 0,
      durationSeconds: 0,
      completed: isCompleted,
      completedAt: isCompleted ? now : null,
      updatedAt: now,
      createdAt: now,
    }, { onConflict: 'userId,youtubeId' }).select('id,userId,youtubeId,secondsWatched,durationSeconds,completed,completedAt,createdAt,updatedAt').single()

    if (upsertError) {
      console.error('Error upserting completion:', upsertError)
      return NextResponse.json({ error: 'Failed to update completion' }, { status: 500 })
    }

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

    const completedResult = await db.from('VideoProgress').select('youtubeId').eq('userId', user.id).eq('completed', true)
    const completedVideos = completedResult.data || []

    return NextResponse.json({ 
      completedVideos: completedVideos.map((v: any) => v.youtubeId) 
    })
  } catch (error) {
    console.error('Error fetching completed videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completed videos' },
      { status: 500 }
    )
  }
}
