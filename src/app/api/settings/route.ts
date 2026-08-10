import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import { randomUUID } from 'crypto'

// Valid values for select-type fields
const VALID_SENSITIVITY_MODES = ['strict', 'moderate', 'light'] as const
const VALID_THEMES = ['light', 'dark', 'system'] as const

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    let settingsResult = await db
      .from('UserSettings')
      .select('id,userId,theme,onboardingCompleted,weeklyGoal,autoPlayNext,defaultPlaybackSpeed,eyeTrackingEnabled,eyeTrackingThreshold,inactivityTimeout,sensitivityMode,soundAlerts,watchBreakEnabled,watchBreakMinutes,watchBreakDurationMinutes,createdAt,updatedAt')
      .eq('userId', userId)
      .maybeSingle()
    let settings = settingsResult.data

    if (!settings) {
      const nowIso = new Date().toISOString()
      const newSettingsResult = await db.from('UserSettings').insert({
        id: randomUUID(),
        userId,
        onboardingCompleted: false,
        updatedAt: nowIso,
        createdAt: nowIso,
      }).select('id,userId,theme,onboardingCompleted,weeklyGoal,autoPlayNext,defaultPlaybackSpeed,eyeTrackingEnabled,eyeTrackingThreshold,inactivityTimeout,sensitivityMode,soundAlerts,watchBreakEnabled,watchBreakMinutes,watchBreakDurationMinutes,createdAt,updatedAt').single()
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
      watchBreakDurationMinutes,
    } = body

    const updateData: Record<string, any> = {}

    // Boolean fields
    if (typeof eyeTrackingEnabled === 'boolean') updateData.eyeTrackingEnabled = eyeTrackingEnabled
    if (typeof soundAlerts === 'boolean') updateData.soundAlerts = soundAlerts
    if (typeof autoPlayNext === 'boolean') updateData.autoPlayNext = autoPlayNext
    if (typeof onboardingCompleted === 'boolean') updateData.onboardingCompleted = onboardingCompleted
    if (typeof watchBreakEnabled === 'boolean') updateData.watchBreakEnabled = watchBreakEnabled

    // Enum fields with validation
    if (sensitivityMode !== undefined) {
      if (!VALID_SENSITIVITY_MODES.includes(sensitivityMode)) {
        return NextResponse.json({ error: 'sensitivityMode must be one of: strict, moderate, light' }, { status: 400 })
      }
      updateData.sensitivityMode = sensitivityMode
    }
    if (theme !== undefined) {
      if (!VALID_THEMES.includes(theme)) {
        return NextResponse.json({ error: 'theme must be one of: light, dark, system' }, { status: 400 })
      }
      updateData.theme = theme
    }

    // Numeric fields with validation
    if (inactivityTimeout !== undefined) {
      if (typeof inactivityTimeout !== 'number' || inactivityTimeout < 1 || inactivityTimeout > 300) {
        return NextResponse.json({ error: 'inactivityTimeout must be between 1 and 300 seconds' }, { status: 400 })
      }
      updateData.inactivityTimeout = Math.round(inactivityTimeout)
    }
    if (defaultPlaybackSpeed !== undefined) {
      if (typeof defaultPlaybackSpeed !== 'number' || defaultPlaybackSpeed < 0.25 || defaultPlaybackSpeed > 2) {
        return NextResponse.json({ error: 'defaultPlaybackSpeed must be between 0.25 and 2.0' }, { status: 400 })
      }
      updateData.defaultPlaybackSpeed = defaultPlaybackSpeed
    }
    if (eyeTrackingThreshold !== undefined) {
      if (typeof eyeTrackingThreshold !== 'number' || eyeTrackingThreshold < 0 || eyeTrackingThreshold > 10) {
        return NextResponse.json({ error: 'eyeTrackingThreshold must be between 0 and 10' }, { status: 400 })
      }
      updateData.eyeTrackingThreshold = eyeTrackingThreshold
    }
    if (weeklyGoal !== undefined) {
      if (typeof weeklyGoal !== 'number' || weeklyGoal < 1 || weeklyGoal > 100) {
        return NextResponse.json({ error: 'weeklyGoal must be between 1 and 100' }, { status: 400 })
      }
      updateData.weeklyGoal = Math.round(weeklyGoal)
    }
    if (watchBreakMinutes !== undefined) {
      if (typeof watchBreakMinutes !== 'number' || watchBreakMinutes < 1 || watchBreakMinutes > 120) {
        return NextResponse.json({ error: 'watchBreakMinutes must be between 1 and 120' }, { status: 400 })
      }
      updateData.watchBreakMinutes = Math.round(watchBreakMinutes)
    }
    if (watchBreakDurationMinutes !== undefined) {
      if (typeof watchBreakDurationMinutes !== 'number' || watchBreakDurationMinutes < 1 || watchBreakDurationMinutes > 30) {
        return NextResponse.json({ error: 'watchBreakDurationMinutes must be between 1 and 30' }, { status: 400 })
      }
      updateData.watchBreakDurationMinutes = Math.round(watchBreakDurationMinutes)
    }

    // Upsert settings (avoid read-then-write race)
    const nowIso = new Date().toISOString()
    const { data: settings, error } = await db.from('UserSettings').upsert({
      id: randomUUID(),
      userId,
      updatedAt: nowIso,
      createdAt: nowIso,
      ...updateData,
    }, { onConflict: 'userId' }).select('id,userId,theme,onboardingCompleted,weeklyGoal,autoPlayNext,defaultPlaybackSpeed,eyeTrackingEnabled,eyeTrackingThreshold,inactivityTimeout,sensitivityMode,soundAlerts,watchBreakEnabled,watchBreakMinutes,watchBreakDurationMinutes,createdAt,updatedAt').single()

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
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
