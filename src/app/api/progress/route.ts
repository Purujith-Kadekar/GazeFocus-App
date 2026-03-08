import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

function isNewWeek(lastResetDate: Date | null): boolean {
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

function getMondayDate(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// POST /api/progress - Update video progress
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

    // Determine completion: either explicitly passed or calculated
    const isCompleted = completed ?? (duration && currentTime >= duration - 10)

    const userData = await db.user.findUnique({
      where: { id: userId },
      select: { weeklyVideosWatched: true, lastWeeklyReset: true },
    })

    let weeklyVideosWatched = userData?.weeklyVideosWatched || 0
    let lastWeeklyReset = userData?.lastWeeklyReset

    if (isNewWeek(lastWeeklyReset)) {
      weeklyVideosWatched = 0
      lastWeeklyReset = getMondayDate()
    }

    // Only increment weekly count if it's newly completed
    if (isCompleted) {
      const existingProgress = await db.videoProgress.findUnique({
        where: { userId_youtubeId: { userId, youtubeId } }
      })
      if (!existingProgress?.completed) {
        weeklyVideosWatched += 1
      }
    }

    const progress = await db.videoProgress.upsert({
      where: {
        userId_youtubeId: {
          userId,
          youtubeId,
        },
      },
      update: {
        secondsWatched: currentTime !== undefined ? currentTime : undefined,
        durationSeconds: duration !== undefined ? duration : undefined,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        userId,
        youtubeId,
        secondsWatched: currentTime || 0,
        durationSeconds: duration || 0,
        completed: isCompleted || false,
        completedAt: isCompleted ? new Date() : null,
      },
    })

    await db.user.update({
      where: { id: userId },
      data: {
        weeklyVideosWatched,
        lastWeeklyReset: lastWeeklyReset || getMondayDate(),
      },
    })

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

// GET /api/progress - Get user's learning progress stats or specific video progress
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { searchParams } = new URL(request.url)
    const youtubeId = searchParams.get('youtubeId')

    // If youtubeId is provided, return specific video progress
    if (youtubeId) {
      const progress = await db.videoProgress.findUnique({
        where: {
          userId_youtubeId: {
            userId,
            youtubeId,
          },
        },
      })
      return NextResponse.json({ progress })
    }

    // Otherwise return global stats
    const userData = await db.user.findUnique({
      where: { id: userId },
      select: { 
        currentStreak: true, 
        longestStreak: true,
        weeklyVideosWatched: true,
        lastWeeklyReset: true,
      },
    })

    let weeklyVideosWatched = userData?.weeklyVideosWatched || 0
    
    if (isNewWeek(userData?.lastWeeklyReset)) {
      weeklyVideosWatched = 0
      await db.user.update({
        where: { id: userId },
        data: {
          weeklyVideosWatched: 0,
          lastWeeklyReset: getMondayDate(),
        },
      })
    }

    const [totalVideos, watchedVideos, totalPlaylists, completedPlaylists, notes, importantNotes] = await Promise.all([
      db.video.count({ where: { userId } }),
      db.videoProgress.count({ where: { userId, completed: true } }),
      db.playlist.count({ where: { userId } }),
      db.playlistMark.count({ where: { userId, finished: true } }),
      db.note.count({ where: { userId } }),
      db.note.count({ where: { userId, isImportant: true } }),
    ])

    const watchTimeAggregation = await db.videoProgress.aggregate({
      where: { userId },
      _sum: {
        secondsWatched: true,
      },
    })
    const totalWatchTime = watchTimeAggregation._sum.secondsWatched || 0

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
