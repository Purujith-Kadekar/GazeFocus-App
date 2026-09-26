import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

function isNewWeek(lastResetDate: string | null): boolean {
  const now = new Date()
  const currentDayOfWeek = now.getDay()
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
  
  const currentMonday = new Date(now)
  currentMonday.setDate(now.getDate() + mondayOffset)
  currentMonday.setHours(0, 0, 0, 0)
  
  if (!lastResetDate) return true
  
  const lastReset = new Date(lastResetDate)
  lastReset.setHours(0, 0, 0, 0)
  
  return lastReset < currentMonday
}

function getMondayDate(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { youtubeId, currentTime, duration, completed } = body

    if (!youtubeId) {
      return NextResponse.json(
        { error: 'YouTube ID is required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Build a conditional update payload so that a regular progress save
    // (which only sends currentTime + duration) never accidentally overwrites
    // a manually-set completed status.
    const updatePayload: Record<string, unknown> = {}

    if (currentTime !== undefined) updatePayload.secondsWatched = currentTime
    if (duration !== undefined) updatePayload.durationSeconds = duration

    let isCompleted: boolean | undefined
    let isNewCompletion = false

    if (completed !== undefined) {
      // Explicit completion toggle
      isCompleted = completed
      updatePayload.completed = completed
      updatePayload.completedAt = completed ? now : null
    } else if (duration && currentTime !== undefined && currentTime >= duration - 10) {
      // Auto-complete when the video is within 10 seconds of the end
      isCompleted = true
      updatePayload.completed = true
      updatePayload.completedAt = now
    }

    // Upsert VideoProgress with onConflict to handle race conditions
    const { data: progress, error: upsertError } = await db.from('VideoProgress').upsert({
      userId,
      youtubeId,
      secondsWatched: currentTime || 0,
      durationSeconds: duration || 0,
      completed: isCompleted || false,
      completedAt: isCompleted ? now : null,
      updatedAt: now,
      createdAt: now,
    }, { onConflict: 'userId,youtubeId' }).select('id,userId,youtubeId,secondsWatched,durationSeconds,completed,completedAt,createdAt,updatedAt').single()

    if (upsertError) {
      console.error('[ERROR] Failed to upsert progress:', upsertError)
      throw new Error(`DB Upsert Error: ${upsertError.message}`)
    }

    // Check if this was a NEW completion (completedAt was just set to now)
    if (isCompleted && progress.completedAt === now) {
      isNewCompletion = true
    }

    // Update weeklyVideosWatched only if this is a new completion
    // Use the atomic increment RPC function for race safety
    if (isNewCompletion) {
      try {
        await db.rpc('increment_weekly_videos_watched', { p_user_id: userId })
      } catch (rpcError) {
        // Fallback: manual increment if RPC doesn't exist yet
        console.warn('[Progress] RPC increment_weekly_videos_watched not available, using manual increment:', rpcError)
        const userDataResult = await db.from('User').select('weeklyVideosWatched, lastWeeklyReset').eq('id', userId).single()
        const userData = userDataResult.data

        let weeklyVideosWatched = userData?.weeklyVideosWatched || 0
        let lastWeeklyReset = userData?.lastWeeklyReset

        if (isNewWeek(lastWeeklyReset)) {
          weeklyVideosWatched = 1
          lastWeeklyReset = getMondayDate()
        } else {
          weeklyVideosWatched += 1
        }

        await db.from('User').update({
          weeklyVideosWatched,
          lastWeeklyReset: lastWeeklyReset || getMondayDate(),
        }).eq('id', userId)
      }
    }

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { searchParams } = new URL(request.url)
    const youtubeId = searchParams.get('youtubeId')

    if (youtubeId) {
      const progressResult = await db
        .from('VideoProgress')
        .select('id,userId,youtubeId,secondsWatched,durationSeconds,completed,completedAt,createdAt,updatedAt')
        .eq('userId', userId)
        .eq('youtubeId', youtubeId)
        .maybeSingle()
      return NextResponse.json({ progress: progressResult.data })
    }

    // Check if weekly reset is needed
    const userDataResult = await db.from('User').select('currentStreak, longestStreak, weeklyVideosWatched, lastWeeklyReset').eq('id', userId).single()
    const userData = userDataResult.data

    let weeklyVideosWatched = userData?.weeklyVideosWatched || 0
    
    if (isNewWeek(userData?.lastWeeklyReset)) {
      weeklyVideosWatched = 0
      await db.from('User').update({
        weeklyVideosWatched: 0,
        lastWeeklyReset: getMondayDate(),
      }).eq('id', userId)
    }

    const [totalVideosResult, watchedVideosResult, totalPlaylistsResult, completedPlaylistsResult, notesResult, importantNotesResult] = await Promise.all([
      db.from('Video').select('id', { count: 'exact', head: true }).eq('userId', userId).is('channelId', null),
      db.from('VideoProgress').select('id', { count: 'exact', head: true }).eq('userId', userId).eq('completed', true),
      db.from('Playlist').select('id', { count: 'exact', head: true }).eq('userId', userId),
      db.from('PlaylistMark').select('id', { count: 'exact', head: true }).eq('userId', userId).eq('finished', true),
      db.from('Note').select('id', { count: 'exact', head: true }).eq('userId', userId),
      db.from('Note').select('id', { count: 'exact', head: true }).eq('userId', userId).eq('isImportant', true),
    ])

    const totalVideos = totalVideosResult.count || 0
    const watchedVideos = watchedVideosResult.count || 0
    const totalPlaylists = totalPlaylistsResult.count || 0
    const completedPlaylists = completedPlaylistsResult.count || 0
    const notes = notesResult.count || 0
    const importantNotes = importantNotesResult.count || 0

    const watchTimeResult = await db.from('VideoProgress').select('secondsWatched').eq('userId', userId)
    const totalWatchTime = (watchTimeResult.data || []).reduce((sum: number, p: { secondsWatched: number }) => sum + (p.secondsWatched || 0), 0)

    return NextResponse.json({
      totalVideos,
      watchedVideos,
      weeklyVideosWatched,
      totalPlaylists,
      completedPlaylists,
      totalNotes: notes,
      importantNotes,
      totalWatchTime,
      streak: userData?.currentStreak || 0,
      longestStreak: userData?.longestStreak || 0,
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
