import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    let settingsResult = await db.from('UserSettings').select('*').eq('userId', userId).maybeSingle()
    let settings = settingsResult.data

    if (!settings) {
      const newSettingsResult = await db.from('UserSettings').insert({ userId }).select().single()
      if (newSettingsResult.error || !newSettingsResult.data) {
        console.error('Error creating settings:', newSettingsResult.error)
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }
      settings = newSettingsResult.data
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { 
      eyeTrackingEnabled,
      sensitivityMode,
      inactivityTimeout, 
      soundAlerts, 
      theme, 
      autoPlayNext,
      defaultPlaybackSpeed,
      eyeTrackingThreshold,
      onboardingCompleted,
      weeklyGoal,
      watchBreakEnabled,
      watchBreakMinutes,
    } = body

    const updateData: Record<string, any> = {}
    if (eyeTrackingEnabled !== undefined) updateData.eyeTrackingEnabled = eyeTrackingEnabled
    if (sensitivityMode !== undefined) updateData.sensitivityMode = sensitivityMode
    if (inactivityTimeout !== undefined) updateData.inactivityTimeout = inactivityTimeout
    if (soundAlerts !== undefined) updateData.soundAlerts = soundAlerts
    if (theme !== undefined) updateData.theme = theme
    if (autoPlayNext !== undefined) updateData.autoPlayNext = autoPlayNext
    if (defaultPlaybackSpeed !== undefined) updateData.defaultPlaybackSpeed = defaultPlaybackSpeed
    if (eyeTrackingThreshold !== undefined) updateData.eyeTrackingThreshold = eyeTrackingThreshold
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted
    if (weeklyGoal !== undefined) updateData.weeklyGoal = weeklyGoal
    if (watchBreakEnabled !== undefined) updateData.watchBreakEnabled = watchBreakEnabled
    if (watchBreakMinutes !== undefined) updateData.watchBreakMinutes = watchBreakMinutes

    const existingResult = await db.from('UserSettings').select('id').eq('userId', userId).maybeSingle()

    let settings
    if (existingResult.data) {
      const updateResult = await db.from('UserSettings').update(updateData).eq('userId', userId).select().single()
      settings = updateResult.data
    } else {
      const insertResult = await db.from('UserSettings').insert({ userId, ...updateData }).select().single()
      settings = insertResult.data
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
