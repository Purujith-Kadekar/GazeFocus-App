import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

function getDateUTC(date: Date | string | null): Date | null {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function daysBetween(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
}

function isNewWeek(lastResetDate: string | null): boolean {
  const now = new Date()
  const currentDayOfWeek = now.getDay()
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek

  const currentMonday = new Date(now)
  currentMonday.setDate(now.getDate() + mondayOffset)
  currentMonday.setHours(0, 0, 0, 0)

  if (!lastResetDate) return true

  const lastReset = new Date(lastResetDate)
  lastReset.setHours(0, 0, 0, 0)

  return lastReset < currentMonday
}

async function getCurrentStreak(userId: string) {
  const todayUTC = getTodayUTC()

  const currentUserResult = await db
    .from('User')
    .select('currentStreak, longestStreak, lastActiveDate')
    .eq('id', userId)
    .single()

  const currentUser = currentUserResult.data
  if (!currentUser) {
    return { streak: 0, longestStreak: 0 }
  }

  const lastActiveUTC = getDateUTC(currentUser.lastActiveDate)
  const daysSinceLastActive = lastActiveUTC ? daysBetween(lastActiveUTC, todayUTC) : -1

  let streak = currentUser.currentStreak || 0
  const longestStreak = currentUser.longestStreak || 0

  // Read-only behavior for GET route: reflect streak reset in response without writing.
  if (daysSinceLastActive > 1) {
    streak = 0
  }

  return {
    streak,
    longestStreak,
  }
}

function getTodayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS })
    }

    const userId = user.id

    const streakData = await getCurrentStreak(userId)

    const [
      foldersResult,
      videosResult,
      notesResult,
      progressCounts,
      watchTimeResult,
      completedVideosResult,
      playlistsResult,
      playlistMarksResult,
      todosResult,
      settingsResult,
      channelsResult,
    ] = await Promise.all([
      db
        .from('Folder')
        .select('id,title,description,position,userId,createdAt,updatedAt,items:LibraryItem(id)')
        .eq('userId', userId)
        .order('position', { ascending: true }),
      db
        .from('Video')
        .select('id,youtubeId,title,thumbnail,duration,playlistId,position,scheduledAt,createdAt,userId')
        .eq('userId', userId)
        .is('playlistId', null)
        .is('channelId', null)
        .order('position', { ascending: true })
        .order('createdAt', { ascending: true }),
      db
        .from('Note')
        .select('id,youtubeId,timestampSeconds,isImportant,createdAt')
        .eq('userId', userId)
        .order('createdAt', { ascending: false }),
      Promise.all([
        db.from('Video').select('id', { count: 'exact', head: true }).eq('userId', userId).is('playlistId', null).is('channelId', null),
        db.from('VideoProgress').select('id', { count: 'exact', head: true }).eq('userId', userId).eq('completed', true),
        db.from('Playlist').select('id', { count: 'exact', head: true }).eq('userId', userId),
        db.from('PlaylistMark').select('id', { count: 'exact', head: true }).eq('userId', userId).eq('finished', true),
        db.from('Note').select('id', { count: 'exact', head: true }).eq('userId', userId),
        db.from('Note').select('id', { count: 'exact', head: true }).eq('userId', userId).eq('isImportant', true),
        db.from('User').select('weeklyVideosWatched, lastWeeklyReset').eq('id', userId).single(),
      ]),
      db.from('VideoProgress').select('secondsWatched').eq('userId', userId),
      db.from('VideoProgress').select('youtubeId').eq('userId', userId).eq('completed', true),
      db.from('Playlist').select('id,youtubeId,title,description,thumbnail,channelId,channelName,totalDuration,scheduledAt,createdAt,updatedAt,userId').eq('userId', userId).order('createdAt', { ascending: false }),
      db.from('PlaylistMark').select('youtubeId').eq('userId', userId).eq('finished', true),
      db.from('Todo').select('id,text,type,completed,reminderAt,createdAt,updatedAt,userId').eq('userId', userId).order('createdAt', { ascending: false }),
      db.from('UserSettings').select('id,userId,theme,onboardingCompleted,weeklyGoal,autoPlayNext,defaultPlaybackSpeed,eyeTrackingEnabled,eyeTrackingThreshold,inactivityTimeout,sensitivityMode,soundAlerts,watchBreakEnabled,watchBreakMinutes,watchBreakDurationMinutes,createdAt,updatedAt').eq('userId', userId).maybeSingle(),
      db.from('Channel').select('id,userId,youtubeId,title,description,thumbnail,subscriberCount,videoCount,isLive,liveVideoId,liveTitle,createdAt,updatedAt').eq('userId', userId).order('createdAt', { ascending: false }),
    ])

    const settings = settingsResult.data || null

    const [
      totalVideosResult,
      watchedVideosResult,
      totalPlaylistsResult,
      completedPlaylistsResult,
      notesCountResult,
      importantNotesResult,
      userStatsResult,
    ] = progressCounts

    let weeklyVideosWatched = userStatsResult.data?.weeklyVideosWatched || 0
    const lastWeeklyReset = userStatsResult.data?.lastWeeklyReset || null

    // Read-only behavior for GET route: compute current-week value without writing.
    if (isNewWeek(lastWeeklyReset)) {
      weeklyVideosWatched = 0
    }

    const totalWatchTime = (watchTimeResult.data || []).reduce(
      (sum: number, p: { secondsWatched?: number }) => sum + (p.secondsWatched || 0),
      0
    )

    const folders = (foldersResult.data || []).map((f: { items?: { id: string }[] } & Record<string, unknown>) => ({
      ...f,
      _count: { items: f.items?.length || 0 },
    }))

    const playlists = playlistsResult.data || []
    let playlistsWithFolder = playlists
    if (playlists.length > 0) {
      const libraryItemsResult = await db
        .from('LibraryItem')
        .select('externalId, folderId')
        .eq('userId', userId)
        .eq('type', 'PLAYLIST')
        .in('externalId', playlists.map((p: { id: string }) => p.id))

      const folderMap = new Map<string, string | null>(
        (libraryItemsResult.data || []).map((item: { externalId: string; folderId: string | null }) => [item.externalId, item.folderId])
      )

      playlistsWithFolder = playlists.map((p: { id: string } & Record<string, unknown>) => ({
        ...p,
        folderId: folderMap.get(p.id) || null,
      }))
    }

    const channels = channelsResult.data || []
    const liveCount = channels.filter((c: { isLive?: boolean }) => c.isLive).length

    return NextResponse.json({
      userId,
      folders,
      videos: videosResult.data || [],
      notes: notesResult.data || [],
      stats: {
        totalVideos: totalVideosResult.count || 0,
        watchedVideos: watchedVideosResult.count || 0,
        weeklyVideosWatched,
        totalPlaylists: totalPlaylistsResult.count || 0,
        completedPlaylists: completedPlaylistsResult.count || 0,
        totalNotes: notesCountResult.count || 0,
        importantNotes: importantNotesResult.count || 0,
        totalWatchTime,
        streak: streakData.streak,
        longestStreak: streakData.longestStreak,
        totalChannels: channels.length,
        liveChannels: liveCount,
      },
      completedVideos: (completedVideosResult.data || []).map((v: { youtubeId: string }) => v.youtubeId),
      playlists: playlistsWithFolder,
      completedPlaylists: (playlistMarksResult.data || []).map((p: { youtubeId: string }) => p.youtubeId),
      todos: todosResult.data || [],
      settings,
      channels,
    }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error('Error fetching dashboard bootstrap payload:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard bootstrap payload' }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
