import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    const { playlistId, completed } = body

    if (!playlistId) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      )
    }

    const playlistMark = await db.playlistMark.upsert({
      where: {
        userId_youtubeId: {
          userId,
          youtubeId: playlistId,
        },
      },
      update: {
        finished: completed ?? true,
        finishedAt: completed ? new Date() : undefined,
      },
      create: {
        userId,
        youtubeId: playlistId,
        finished: completed ?? true,
        finishedAt: completed ? new Date() : undefined,
      },
    })

    return NextResponse.json({ success: true, playlistMark })
  } catch (error) {
    console.error('Error updating playlist completion:', error)
    return NextResponse.json(
      { error: 'Failed to update playlist completion' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get('playlistId')

    if (playlistId) {
      const mark = await db.playlistMark.findUnique({
        where: {
          userId_youtubeId: {
            userId: user.id,
            youtubeId: playlistId,
          },
        },
      })
      return NextResponse.json({ completed: mark?.finished || false })
    }

    const completedPlaylists = await db.playlistMark.findMany({
      where: { userId: user.id, finished: true },
      select: { youtubeId: true },
    })

    return NextResponse.json({ 
      completedPlaylists: completedPlaylists.map(p => p.youtubeId) 
    })
  } catch (error) {
    console.error('Error fetching completed playlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completed playlists' },
      { status: 500 }
    )
  }
}
