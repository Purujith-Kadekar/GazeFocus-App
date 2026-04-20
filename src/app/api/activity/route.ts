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
    const now = new Date().toISOString()

    // Atomic update using RPC
    const { data: updatedUser, error: updateError } = await db.rpc('update_user_activity_and_streak', { 
      p_user_id: userId,
      p_current_timestamp: now
    })

    if (updateError) {
      console.error('Error updating activity via RPC:', updateError)
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      streak: updatedUser?.currentStreak,
      longestStreak: updatedUser?.longestStreak,
      lastActiveDate: updatedUser?.lastActiveDate,
    })
  } catch (error) {
    console.error('Unexpected error updating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error } = await db
      .from('User')
      .select('currentStreak, longestStreak, lastActiveDate, lastLoginDate')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching activity:', error)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    return NextResponse.json({
      streak: userData?.currentStreak || 0,
      longestStreak: userData?.longestStreak || 0,
      lastActiveDate: userData?.lastActiveDate,
      lastLoginDate: userData?.lastLoginDate,
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
