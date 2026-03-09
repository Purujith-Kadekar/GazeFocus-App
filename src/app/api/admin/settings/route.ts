import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

// GET /api/admin/settings - Get site settings
export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let settings = await db.siteSettings.findUnique({ where: { id: 'global' } })
    if (!settings) {
      settings = await db.siteSettings.create({
        data: { id: 'global', signupEnabled: true },
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PATCH /api/admin/settings - Update site settings
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { signupEnabled } = await request.json()

    const settings = await db.siteSettings.upsert({
      where: { id: 'global' },
      update: { signupEnabled },
      create: { id: 'global', signupEnabled },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
