import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, image, emailVerified } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data: existingUser } = await db
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' })
    }

    const { data: newUser, error } = await db
      .from('User')
      .insert({
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        image: image || '',
        emailVerified: emailVerified || now,
        createdAt: now,
        updatedAt: now,
        lastLoginDate: now,
      })
      .select('id')
      .single()

    if (error) {
      console.error('User insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: newUser?.id })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}