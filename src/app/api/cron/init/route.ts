import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Cron init is disabled. Sync runs on-demand when users open the app.' },
    { status: 410 }
  )
}
