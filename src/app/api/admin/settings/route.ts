import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: settings } = await db.from('SiteSettings').select('*').eq('id', 'global').maybeSingle()

    if (!settings) {
      const { data: created, error } = await db.from('SiteSettings').insert({ id: 'global', signupEnabled: true }).select().single()
      if (error) throw error
      return NextResponse.json(created)
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

    const { data: settings, error } = await db.from('SiteSettings').upsert({
      id: 'global', signupEnabled,
    }, { onConflict: 'id' }).select().single()

    if (error) throw error

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
