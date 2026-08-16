import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { parseTaskPrompt } from '@/lib/agent/nlp'

/**
 * POST /api/agent/parse
 * Body: { input: string }
 * Returns a draft { title, deadlineAt, matchedText } parsed by
 * chrono-node, or 422 when no date expression is found.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input = typeof body?.input === 'string' ? body.input : ''

    if (!input.trim() || input.trim().length > 500) {
      return NextResponse.json({ error: 'Input must be 1-500 characters' }, { status: 400 })
    }

    const draft = parseTaskPrompt(input)
    if (!draft) {
      return NextResponse.json(
        { error: 'No date or time found. Try something like "Physics lab report due Friday at 4 PM".' },
        { status: 422 }
      )
    }

    return NextResponse.json(draft)
  } catch (error) {
    console.error('Error parsing agent prompt:', error)
    return NextResponse.json({ error: 'Failed to parse prompt' }, { status: 500 })
  }
}
