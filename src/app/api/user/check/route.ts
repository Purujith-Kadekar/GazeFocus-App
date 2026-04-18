import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: existingUser } = await db
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    return NextResponse.json({ 
      exists: !!existingUser, 
      userId: existingUser?.id 
    })
  } catch (error: any) {
    console.error('User check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}