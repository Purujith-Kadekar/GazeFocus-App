import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId format' }, { status: 400 })
  }

  try {
    // Try maxresdefault first
    let res = await fetch(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
    
    // If maxresdefault is 404, fallback to hqdefault
    if (!res.ok) {
      res = await fetch(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 })
    }

    const buffer = await res.arrayBuffer()
    const response = new NextResponse(buffer)
    response.headers.set('Content-Type', 'image/jpeg')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Cache-Control', 'public, max-age=86400')
    
    return response

  } catch (error) {
    console.error('Error fetching thumbnail proxy:', error)
    return NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 500 })
  }
}
