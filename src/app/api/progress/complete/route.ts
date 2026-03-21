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

    const existingResult = await db.from('VideoProgress').select('id').eq('userId', userId).eq('youtubeId', youtubeId).maybeSingle()

    let progress
    if (existingResult.data) {
      const updateResult = await db.from('VideoProgress').update({
        completed: completed ?? true,
        completedAt: completed ? new Date().toISOString() : null,
      }).eq('id', existingResult.data.id).select().single()
      progress = updateResult.data
    } else {
      const insertResult = await db.from('VideoProgress').insert({
        userId,
        youtubeId,
        secondsWatched: 0,
        completed: completed ?? true,
        completedAt: completed ? new Date().toISOString() : null,
      }).select().single()
      progress = insertResult.data
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
