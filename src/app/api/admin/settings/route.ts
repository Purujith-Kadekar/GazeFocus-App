import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

const DEFAULT_USER_DAILY_TOKEN_LIMIT = 200

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let settingsResult = await db.from('SiteSettings').select('*').eq('id', 'global').maybeSingle()
    if (settingsResult.error) {
      throw settingsResult.error
    }
    let settings = settingsResult.data

    if (!settings) {
      const newSettingsResult = await db
        .from('SiteSettings')
        .insert({
          id: 'global',
          signupEnabled: true,
          userDailyTokenLimit: DEFAULT_USER_DAILY_TOKEN_LIMIT,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()
      if (newSettingsResult.error) {
        throw newSettingsResult.error
      }
      settings = newSettingsResult.data
    }

    if (settings && typeof settings.userDailyTokenLimit !== 'number') {
      const patchedResult = await db
        .from('SiteSettings')
        .update({ userDailyTokenLimit: DEFAULT_USER_DAILY_TOKEN_LIMIT, updatedAt: new Date().toISOString() })
        .eq('id', 'global')
        .select()
        .single()
      if (patchedResult.error) {
        throw patchedResult.error
      }
      settings = patchedResult.data || settings
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { signupEnabled, userDailyTokenLimit } = await request.json()

    const updates: Record<string, unknown> = {}
    if (typeof signupEnabled === 'boolean') {
      updates.signupEnabled = signupEnabled
    }
    if (typeof userDailyTokenLimit === 'number') {
      if (!Number.isFinite(userDailyTokenLimit) || userDailyTokenLimit <= 0 || userDailyTokenLimit > 10000) {
        return NextResponse.json({ error: 'userDailyTokenLimit must be between 1 and 10000' }, { status: 400 })
      }
      updates.userDailyTokenLimit = Math.floor(userDailyTokenLimit)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    updates.updatedAt = new Date().toISOString()

    const existingResult = await db.from('SiteSettings').select('id').eq('id', 'global').maybeSingle()
    if (existingResult.error) {
      throw existingResult.error
    }

    let settings
    if (existingResult.data) {
      const updateResult = await db.from('SiteSettings').update(updates).eq('id', 'global').select().single()
      if (updateResult.error) {
        throw updateResult.error
      }
      settings = updateResult.data
    } else {
      const insertResult = await db
        .from('SiteSettings')
        .insert({
          id: 'global',
          signupEnabled: typeof updates.signupEnabled === 'boolean' ? (updates.signupEnabled as boolean) : true,
          userDailyTokenLimit:
            typeof updates.userDailyTokenLimit === 'number'
              ? (updates.userDailyTokenLimit as number)
              : DEFAULT_USER_DAILY_TOKEN_LIMIT,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()
      if (insertResult.error) {
        throw insertResult.error
      }
      settings = insertResult.data
    }

    if (!settings) {
      throw new Error('Failed to persist settings')
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
