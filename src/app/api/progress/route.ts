import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id
    const body = await request.json()
    const { youtubeId, secondsWatched, totalDuration, playlistId } = body

    if (!youtubeId || secondsWatched === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert video progress
    const { data: progress, error } = await db.from('VideoProgress').upsert({
      userId, youtubeId,
      secondsWatched: Math.round(secondsWatched),
      durationSeconds: totalDuration ? Math.round(totalDuration) : null,
    }, { onConflict: 'userId,youtubeId' }).select().single()
    if (error) throw error

    // Check for weekly reset
    const { data: userData } = await db.from('User').select('weeklyVideosWatched, lastWeeklyReset').eq('id', userId).single()

    if (userData) {
      const now = new Date()
      const lastReset = userData.lastWeeklyReset ? new Date(userData.lastWeeklyReset) : null
      const shouldReset = !lastReset || (now.getTime() - lastReset.getTime() > 7 * 24 * 60 * 60 * 1000)

      if (shouldReset) {
        await db.from('User').update({ weeklyVideosWatched: 0, lastWeeklyReset: now.toISOString() }).eq('id', userId)
      }
    }

    // Check if video is now completed (>= 90% watched)
    if (totalDuration && secondsWatched >= totalDuration * 0.9) {
      const wasAlreadyCompleted = progress?.completed
      await db.from('VideoProgress').update({
        completed: true, completedAt: new Date().toISOString(),
      }).eq('userId', userId).eq('youtubeId', youtubeId)

      // Increment weekly videos watched if newly completed
      if (!wasAlreadyCompleted) {
        const { data: currentUser } = await db.from('User').select('weeklyVideosWatched').eq('id', userId).single()
        await db.from('User').update({
          weeklyVideosWatched: (currentUser?.weeklyVideosWatched || 0) + 1,
          lastActiveDate: new Date().toISOString(),
        }).eq('id', userId)
      }

      // Check if this completes a playlist
      if (playlistId) {
        const { count: totalVideos } = await db.from('Video').select('*', { count: 'exact', head: true }).eq('playlistId', playlistId)
        const { count: completedVideos } = await db.from('VideoProgress').select('*', { count: 'exact', head: true })
          .eq('userId', userId).eq('completed', true)
          .in('youtubeId', (await db.from('Video').select('youtubeId').eq('playlistId', playlistId)).data?.map((v: any) => v.youtubeId) || [])

        if (totalVideos && completedVideos && completedVideos >= totalVideos) {
          await db.from('PlaylistMark').upsert({
            userId, youtubeId: playlistId, finished: true, finishedAt: new Date().toISOString(),
          }, { onConflict: 'userId,youtubeId' })
        }
      }
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error saving progress:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id

    const { searchParams } = new URL(request.url)
    const youtubeId = searchParams.get('youtubeId')
    const statsSummary = searchParams.get('stats')

    if (youtubeId) {
      const { data: progress } = await db.from('VideoProgress').select('*').eq('userId', userId).eq('youtubeId', youtubeId).maybeSingle()
      return NextResponse.json(progress || { secondsWatched: 0, completed: false })
    }

    if (statsSummary === 'true') {
      const { data: allProgress } = await db.from('VideoProgress').select('secondsWatched, completed').eq('userId', userId)
      const { data: userData } = await db.from('User').select('weeklyVideosWatched').eq('id', userId).single()

      const totalWatchTime = (allProgress || []).reduce((sum: number, p: any) => sum + (p.secondsWatched || 0), 0)
      const completedCount = (allProgress || []).filter((p: any) => p.completed).length

      return NextResponse.json({
        totalWatchTime, completedVideos: completedCount,
        weeklyVideosWatched: userData?.weeklyVideosWatched || 0,
      })
    }

    const { data: progressData } = await db.from('VideoProgress').select('*').eq('userId', userId)
    return NextResponse.json(progressData || [])
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
