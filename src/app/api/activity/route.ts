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
    const { type } = body

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentUserResult = await db.from('User').select('currentStreak, longestStreak, lastActiveDate, lastLoginDate').eq('id', userId).single()
    const currentUser = currentUserResult.data

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let newStreak = currentUser.currentStreak || 0
    const lastActiveDate = currentUser.lastActiveDate ? new Date(currentUser.lastActiveDate) : null

    if (lastActiveDate) {
      const checkDate = new Date(lastActiveDate)
      checkDate.setHours(0, 0, 0, 0)
      const daysSinceLastActive = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastActive === 0) {
        newStreak = currentUser.currentStreak || 0
      } else if (daysSinceLastActive === 1) {
        newStreak = (currentUser.currentStreak || 0) + 1
      } else if (daysSinceLastActive > 1) {
        newStreak = 1
      }
    } else {
      newStreak = 1
    }

    const longestStreak = Math.max(currentUser.longestStreak || 0, newStreak)

    const updatedUserResult = await db.from('User').update({
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastActiveDate: today.toISOString(),
    }).eq('id', userId).select('currentStreak, longestStreak, lastActiveDate, lastLoginDate').single()
    const updatedUser = updatedUserResult.data

    return NextResponse.json({
      success: true,
      streak: updatedUser?.currentStreak,
      longestStreak: updatedUser?.longestStreak,
    })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let userDataResult = await db.from('User').select('currentStreak, longestStreak, lastActiveDate, lastLoginDate').eq('id', user.id).single()
    let userData = userDataResult.data

    if (userData?.lastActiveDate) {
      const lastActiveDate = new Date(userData.lastActiveDate)
      lastActiveDate.setHours(0, 0, 0, 0)
      const daysSinceLastActive = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastActive > 1 && userData.currentStreak > 0) {
        const updatedResult = await db.from('User').update({ currentStreak: 0 }).eq('id', user.id).select('currentStreak, longestStreak, lastActiveDate, lastLoginDate').single()
        userData = updatedResult.data
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
