import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

function getTodayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

function getDateUTC(date: Date | string | null): Date | null {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function daysBetween(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const todayUTC = getTodayUTC()

    // Fetch current streak and lastActiveDate in a transaction
    const { data: currentUser, error: fetchError } = await db.rpc('get_user_activity_data', { p_user_id: userId })
    if (fetchError || !currentUser) {
      console.error('Error fetching user activity data:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    const lastActiveUTC = getDateUTC(currentUser.lastActiveDate)
    const daysSinceLastActive = lastActiveUTC ? daysBetween(lastActiveUTC, todayUTC) : -1

    let newStreak = currentUser.currentStreak || 0
    let streakUpdated = false

    if (daysSinceLastActive === -1) { // First activity ever
      newStreak = 1
      streakUpdated = true
    } else if (daysSinceLastActive === 0) { // Active today, streak continues
      newStreak = currentUser.currentStreak || 0
    } else if (daysSinceLastActive === 1) { // Active yesterday, streak continues
      newStreak = (currentUser.currentStreak || 0) + 1
      streakUpdated = true
    } else if (daysSinceLastActive > 1) { // Gap in activity, reset streak
      newStreak = 1
      streakUpdated = true
    }

    const longestStreak = Math.max(currentUser.longestStreak || 0, newStreak)

    const updateData: Record<string, unknown> = {
      lastActiveDate: todayUTC.toISOString(), // Always update lastActiveDate on activity
      longestStreak: longestStreak,
    }

    if (streakUpdated) {
      updateData.currentStreak = newStreak
    }

    const { data: updatedUser, error: updateError } = await db
      .from('User')
      .update(updateData)
      .eq('id', userId)
      .select('currentStreak, longestStreak, lastActiveDate, lastLoginDate')
      .single()

    if (updateError) {
      console.error('Error updating activity:', updateError)
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      streak: updatedUser?.currentStreak,
      longestStreak: updatedUser?.longestStreak,
      streakUpdated: streakUpdated,
    })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const todayUTC = getTodayUTC()

    const { data: userData, error } = await db
      .from('User')
      .select('currentStreak, longestStreak, lastActiveDate, lastLoginDate')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching activity:', error)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    const lastActiveUTC = getDateUTC(userData?.lastActiveDate)
    const daysSinceLastActive = lastActiveUTC ? daysBetween(lastActiveUTC, todayUTC) : -1

    let currentStreak = userData?.currentStreak || 0
    let longestStreak = userData?.longestStreak || 0

    // This logic in GET is for displaying the streak, it should NOT modify the DB.
    // If daysSinceLastActive > 1, it should just show 0, not reset it on GET.
    // Resetting happens on POST activity.

    return NextResponse.json({
      streak: currentStreak,
      longestStreak: longestStreak,
      lastActiveDate: userData?.lastActiveDate,
      lastLoginDate: userData?.lastLoginDate,
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
