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

    // Use upsert instead of select-then-insert/update to avoid race conditions
    const now = new Date().toISOString()
    const { data: playlistMark, error } = await db.from('PlaylistMark').upsert({
      userId,
      youtubeId: playlistId,
      finished: completed ?? true,
      finishedAt: completed ? now : null,
      createdAt: now,
      updatedAt: now,
    }, { onConflict: 'userId,youtubeId' }).select('id,userId,youtubeId,finished,finishedAt,createdAt,updatedAt').single()

    if (error) {
      console.error('Error upserting playlist completion:', error)
      return NextResponse.json({ error: 'Failed to update playlist completion' }, { status: 500 })
    }

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
      const markResult = await db.from('PlaylistMark').select('finished').eq('userId', user.id).eq('youtubeId', playlistId).maybeSingle()
      return NextResponse.json({ completed: markResult.data?.finished || false })
    }

    const completedResult = await db.from('PlaylistMark').select('youtubeId').eq('userId', user.id).eq('finished', true)
    const completedPlaylists = completedResult.data || []

    return NextResponse.json({ 
      completedPlaylists: completedPlaylists.map((p: { youtubeId: string }) => p.youtubeId)
    })
  } catch (error) {
    console.error('Error fetching completed playlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completed playlists' },
      { status: 500 }
    )
  }
}
