import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: settings } = await db.from('UserSettings').select('*').eq('userId', user.id).maybeSingle()

    if (!settings) {
      const { data: created, error } = await db.from('UserSettings').insert({ userId: user.id }).select().single()
      if (error) throw error
      return NextResponse.json(created)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()

    const { data: settings, error } = await db.from('UserSettings').upsert({
      userId: user.id,
      ...body,
    }, { onConflict: 'userId' }).select().single()

    if (error) throw error

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
