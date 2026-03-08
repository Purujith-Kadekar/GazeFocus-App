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
    const { type } = body // 'video_watch', 'login', 'daily_checkin'

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get current user data
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        lastLoginDate: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let newStreak = currentUser.currentStreak || 0
    const lastActiveDate = currentUser.lastActiveDate ? new Date(currentUser.lastActiveDate) : null

    // Always check if streak should be reset based on last active date
    if (lastActiveDate) {
      const checkDate = new Date(lastActiveDate)
      checkDate.setHours(0, 0, 0, 0)
      const daysSinceLastActive = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastActive === 0) {
        // Same day - keep current streak
        newStreak = currentUser.currentStreak || 0
      } else if (daysSinceLastActive === 1) {
        // Consecutive day - increment streak
        newStreak = (currentUser.currentStreak || 0) + 1
      } else if (daysSinceLastActive > 1) {
        // More than 1 day - streak broken, reset to 1
        newStreak = 1
      }
    } else {
      // First activity ever
      newStreak = 1
    }

    // Update longest streak if needed
    const longestStreak = Math.max(currentUser.longestStreak || 0, newStreak)

    // Update user activity
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: longestStreak,
        lastActiveDate: today,
      },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        lastLoginDate: true,
      },
    })

    return NextResponse.json({
      success: true,
      streak: updatedUser.currentStreak,
      longestStreak: updatedUser.longestStreak,
    })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

// GET /api/activity - Get current streak status
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        lastLoginDate: true,
      },
    })

    // Check and update streak if needed (in case user hasn't been active for more than a day)
    if (userData?.lastActiveDate) {
      const lastActiveDate = new Date(userData.lastActiveDate)
      lastActiveDate.setHours(0, 0, 0, 0)
      const daysSinceLastActive = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))

      // If more than 1 day has passed, reset streak to 0
      if (daysSinceLastActive > 1 && userData.currentStreak > 0) {
        userData = await db.user.update({
          where: { id: user.id },
          data: { currentStreak: 0 },
          select: {
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
            lastLoginDate: true,
          },
        })
      }
    }

    return NextResponse.json({
      streak: userData?.currentStreak || 0,
      longestStreak: userData?.longestStreak || 0,
      lastActiveDate: userData?.lastActiveDate,
      lastLoginDate: userData?.lastLoginDate,
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
