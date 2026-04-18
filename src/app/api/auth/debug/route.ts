import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const allProviders = authOptions.providers.map((p: any) => ({ id: p.id, name: p.name, hasAuthorize: typeof p.authorize === 'function' }))
  const firebaseProvider = allProviders.find((p: any) => p.id === 'firebase')
  
  return NextResponse.json({
    allProviders,
    firebaseProvider,
  })
}