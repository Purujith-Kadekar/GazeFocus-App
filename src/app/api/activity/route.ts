import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id

    const { data: userData } = await db.from('User').select('*').eq('id', userId).single()
    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastActive = userData.lastActiveDate ? new Date(userData.lastActiveDate) : null
    let newStreak = userData.currentStreak || 0

    if (lastActive) {
      const lastActiveDay = new Date(lastActive)
      lastActiveDay.setHours(0, 0, 0, 0)
      const daysSinceLast = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLast === 0) {
        // Already active today
      } else if (daysSinceLast === 1) {
        newStreak = (userData.currentStreak || 0) + 1
      } else {
        newStreak = 1
      }
    } else {
      newStreak = 1
    }

    const longestStreak = Math.max(userData.longestStreak || 0, newStreak)

    const { data: updated } = await db.from('User').update({
      lastActiveDate: today.toISOString(),
      currentStreak: newStreak,
      longestStreak,
    }).eq('id', userId).select('currentStreak, longestStreak, lastActiveDate, weeklyVideosWatched').single()

    return NextResponse.json(updated || { currentStreak: newStreak, longestStreak })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await db.from('User').select('currentStreak, longestStreak, lastActiveDate, weeklyVideosWatched, lastWeeklyReset').eq('id', user.id).single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check and auto-reset weekly videos if needed
    const now = new Date()
    const lastReset = userData.lastWeeklyReset ? new Date(userData.lastWeeklyReset) : null
    if (!lastReset || (now.getTime() - lastReset.getTime() > 7 * 24 * 60 * 60 * 1000)) {
      await db.from('User').update({ weeklyVideosWatched: 0, lastWeeklyReset: now.toISOString() }).eq('id', user.id)
      userData.weeklyVideosWatched = 0
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
