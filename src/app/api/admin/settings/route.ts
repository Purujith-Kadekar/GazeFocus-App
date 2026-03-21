import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let settingsResult = await db.from('SiteSettings').select('*').eq('id', 'global').maybeSingle()
    let settings = settingsResult.data

    if (!settings) {
      const newSettingsResult = await db.from('SiteSettings').insert({ id: 'global', signupEnabled: true }).select().single()
      settings = newSettingsResult.data
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
    const { signupEnabled } = await request.json()

    const existingResult = await db.from('SiteSettings').select('id').eq('id', 'global').maybeSingle()

    let settings
    if (existingResult.data) {
      const updateResult = await db.from('SiteSettings').update({ signupEnabled }).eq('id', 'global').select().single()
      settings = updateResult.data
    } else {
      const insertResult = await db.from('SiteSettings').insert({ id: 'global', signupEnabled }).select().single()
      settings = insertResult.data
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
