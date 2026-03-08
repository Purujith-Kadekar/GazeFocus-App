import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    let settings = await db.userSettings.findUnique({
      where: { userId },
    })

    // Create default settings if doesn't exist
    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId },
      })
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

// PUT /api/settings - Update user settings
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
      inactivityTimeout, 
      soundAlerts, 
      theme, 
      autoPlayNext,
      defaultPlaybackSpeed,
      eyeTrackingThreshold
    } = body

    const settings = await db.userSettings.update({
      where: { userId },
      data: {
        ...(eyeTrackingEnabled !== undefined && { eyeTrackingEnabled }),
        ...(inactivityTimeout !== undefined && { inactivityTimeout }),
        ...(soundAlerts !== undefined && { soundAlerts }),
        ...(theme !== undefined && { theme }),
        ...(autoPlayNext !== undefined && { autoPlayNext }),
        ...(defaultPlaybackSpeed !== undefined && { defaultPlaybackSpeed }),
        ...(eyeTrackingThreshold !== undefined && { eyeTrackingThreshold }),
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
