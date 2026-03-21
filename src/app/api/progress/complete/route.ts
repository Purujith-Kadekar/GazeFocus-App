import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { youtubeId, completed, playlistId } = body

    if (!youtubeId) return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })

    const { data, error } = await db.from('VideoProgress').upsert({
      userId: user.id, youtubeId,
      completed: completed ?? true,
      completedAt: completed ? new Date().toISOString() : null,
      secondsWatched: 0,
    }, { onConflict: 'userId,youtubeId' }).select().single()

    if (error) throw error

    // If marking as completed and it's in a playlist, check playlist completion
    if (completed && playlistId) {
      const { count: totalVideos } = await db.from('Video').select('*', { count: 'exact', head: true }).eq('playlistId', playlistId)
      const videoIds = (await db.from('Video').select('youtubeId').eq('playlistId', playlistId)).data?.map((v: any) => v.youtubeId) || []
      const { count: completedVideos } = await db.from('VideoProgress').select('*', { count: 'exact', head: true })
        .eq('userId', user.id).eq('completed', true).in('youtubeId', videoIds)

      if (totalVideos && completedVideos && completedVideos >= totalVideos) {
        await db.from('PlaylistMark').upsert({
          userId: user.id, youtubeId: playlistId, finished: true, finishedAt: new Date().toISOString(),
        }, { onConflict: 'userId,youtubeId' })
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error marking video complete:', error)
    return NextResponse.json({ error: 'Failed to mark video complete' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get('playlistId')

    if (playlistId) {
      const { data: mark } = await db.from('PlaylistMark').select('finished').eq('userId', user.id).eq('youtubeId', playlistId).maybeSingle()
      return NextResponse.json({ completed: mark?.finished || false })
    }

    // Return all completed videos for this user
    const { data: completedVideos } = await db.from('VideoProgress').select('youtubeId').eq('userId', user.id).eq('completed', true)
    return NextResponse.json({ completedVideos: (completedVideos || []).map((v: any) => v.youtubeId) })
  } catch (error) {
    console.error('Error fetching completion status:', error)
    return NextResponse.json({ error: 'Failed to fetch completion status' }, { status: 500 })
  }
}
