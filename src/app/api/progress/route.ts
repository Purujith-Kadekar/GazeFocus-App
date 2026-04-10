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

const generateId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `cmm${timestamp}${random}`; // Matches the cuid format found in the DB (e.g. cmm3ghj9x...)
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
    console.log(`[DEBUG] POST /api/progress - user: ${user.email}, video: ${youtubeId}, time: ${currentTime}/${duration}, done: ${completed}`)

    if (!youtubeId) {
      return NextResponse.json(
        { error: 'YouTube ID is required' },
        { status: 400 }
      )
    }

    // Build a conditional update payload so that a regular progress save
    // (which only sends currentTime + duration) never accidentally overwrites
    // a manually-set completed status.
    const updatePayload: Record<string, unknown> = {}

    if (currentTime !== undefined) updatePayload.secondsWatched = currentTime
    if (duration !== undefined) updatePayload.durationSeconds = duration

    let isCompleted: boolean | undefined
    if (completed !== undefined) {
      // Explicit completion toggle
      isCompleted = completed
      updatePayload.completed = completed
      updatePayload.completedAt = completed ? new Date().toISOString() : null
    } else if (duration && currentTime !== undefined && currentTime >= duration - 10) {
      // Auto-complete when the video is within 10 seconds of the end
      isCompleted = true
      updatePayload.completed = true
      updatePayload.completedAt = new Date().toISOString()
    }
    // else: don't touch the completed / completedAt fields

    const userDataResult = await db.from('User').select('weeklyVideosWatched, lastWeeklyReset').eq('id', userId).single()
    const userData = userDataResult.data

    let weeklyVideosWatched = userData?.weeklyVideosWatched || 0
    let lastWeeklyReset = userData?.lastWeeklyReset

    if (isNewWeek(lastWeeklyReset)) {
      weeklyVideosWatched = 0
      lastWeeklyReset = getMondayDate()
    }

    if (isCompleted) {
      const existingResult = await db.from('VideoProgress').select('completed').eq('userId', userId).eq('youtubeId', youtubeId).maybeSingle()
      if (!existingResult.data?.completed) {
        weeklyVideosWatched += 1
      }
    }

    const existingProgressResult = await db.from('VideoProgress').select('id').eq('userId', userId).eq('youtubeId', youtubeId).maybeSingle()

    let progress
    const now = new Date().toISOString()
    if (existingProgressResult.data) {
      const updateResult = await db.from('VideoProgress').update({
        ...updatePayload,
        updatedAt: now
      })
        .eq('id', existingProgressResult.data.id).select().single()
      progress = updateResult.data
    } else {
      const generatedId = generateId()
      const insertResult = await db.from('VideoProgress').insert({
        id: generatedId,
        userId,
        youtubeId,
        secondsWatched: currentTime || 0,
        durationSeconds: duration || 0,
        completed: isCompleted || false,
        completedAt: isCompleted ? now : null,
        updatedAt: now,
        createdAt: now
      }).select().single()
      
      if (insertResult.error) {
        console.error(`[ERROR] Failed to insert progress:`, insertResult.error)
        throw new Error(`DB Insert Error: ${insertResult.error.message}`)
      }
      progress = insertResult.data
    }

    await db.from('User').update({
      weeklyVideosWatched,
      lastWeeklyReset: lastWeeklyReset || getMondayDate(),
    }).eq('id', userId)

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
      const progressResult = await db.from('VideoProgress').select('*').eq('userId', userId).eq('youtubeId', youtubeId).maybeSingle()
      return NextResponse.json({ progress: progressResult.data })
    }

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
    const totalWatchTime = (watchTimeResult.data || []).reduce((sum: number, p: any) => sum + (p.secondsWatched || 0), 0)

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
