import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * Auth debug endpoint — DISABLED in production for security.
 * This endpoint leaks provider configuration details (IDs, authorize functions).
 * Only available in development mode for debugging auth setup issues.
 */
export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const allProviders = authOptions.providers.map((p: any) => ({ id: p.id, name: p.name, hasAuthorize: typeof p.authorize === 'function' }))
  const firebaseProvider = allProviders.find((p: any) => p.id === 'firebase')
  
  return NextResponse.json({
    allProviders,
    firebaseProvider,
  })
}
