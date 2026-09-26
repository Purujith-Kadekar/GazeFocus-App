import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminRequest } from '@/lib/admin-auth'

type AdminUserRow = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  isBlocked: boolean
  createdAt: string
  lastLoginDate: string | null
  lastActiveDate: string | null
  deletionScheduledAt: string | null
  isPremium?: boolean
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  const message = (error as { message?: string } | null)?.message || ''
  return message.toLowerCase().includes(columnName.toLowerCase())
}

async function fetchUsersBase(): Promise<AdminUserRow[]> {
  const withPremiumResult = await db
    .from('User')
    .select('id, name, email, image, isBlocked, createdAt, lastLoginDate, lastActiveDate, deletionScheduledAt, isPremium')
    .order('createdAt', { ascending: false })

  if (!withPremiumResult.error) {
    return (withPremiumResult.data || []) as AdminUserRow[]
  }

  if (!isMissingColumnError(withPremiumResult.error, 'isPremium')) {
    throw withPremiumResult.error
  }

  const fallbackResult = await db
    .from('User')
    .select('id, name, email, image, isBlocked, createdAt, lastLoginDate, lastActiveDate, deletionScheduledAt')
    .order('createdAt', { ascending: false })

  if (fallbackResult.error) {
    throw fallbackResult.error
  }

  return ((fallbackResult.data || []) as AdminUserRow[]).map(user => ({
    ...user,
    isPremium: false,
  }))
}

export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await fetchUsersBase()
    const userIds = users.map(user => user.id)

    if (userIds.length === 0) {
      return NextResponse.json([])
    }

    const [accountsResult, notesResult, playlistsResult, progressResult] = await Promise.all([
      db.from('Account').select('userId, provider').in('userId', userIds),
      db.from('Note').select('userId').in('userId', userIds),
      db.from('Playlist').select('userId').in('userId', userIds),
      db.from('VideoProgress').select('userId').in('userId', userIds),
    ])

    if (accountsResult.error) throw accountsResult.error
    if (notesResult.error) throw notesResult.error
    if (playlistsResult.error) throw playlistsResult.error
    if (progressResult.error) throw progressResult.error

    const accountsByUser = new Map<string, { provider: string }[]>()
    for (const account of accountsResult.data || []) {
      const list = accountsByUser.get(account.userId) || []
      list.push({ provider: account.provider })
      accountsByUser.set(account.userId, list)
    }

    const noteCounts = new Map<string, number>()
    for (const note of notesResult.data || []) {
      noteCounts.set(note.userId, (noteCounts.get(note.userId) || 0) + 1)
    }

    const playlistCounts = new Map<string, number>()
    for (const playlist of playlistsResult.data || []) {
      playlistCounts.set(playlist.userId, (playlistCounts.get(playlist.userId) || 0) + 1)
    }

    const progressCounts = new Map<string, number>()
    for (const progress of progressResult.data || []) {
      progressCounts.set(progress.userId, (progressCounts.get(progress.userId) || 0) + 1)
    }

    const response = users.map(user => ({
      ...user,
      accounts: accountsByUser.get(user.id) || [],
      _count: {
        notes: noteCounts.get(user.id) || 0,
        playlists: playlistCounts.get(user.id) || 0,
        videoProgress: progressCounts.get(user.id) || 0,
      },
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Failed to fetch users', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await verifyAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // NOTE: access control for the admin portal is the admin_session
    // cookie only — there is deliberately no `role` parameter here.
    // `isPremium` is a billing/quota flag on a normal user, not an
    // admin permission (the User.role column was dead and is being
    // dropped by migration 018).
    const { userId, isBlocked, isPremium } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof isBlocked === 'boolean') updates.isBlocked = isBlocked
    if (typeof isPremium === 'boolean') updates.isPremium = isPremium

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    let updateResult = await db
      .from('User')
      .update(updates)
      .eq('id', userId)
      .select('id, isBlocked, deletionScheduledAt, lastLoginDate, lastActiveDate, createdAt, name, email, image, isPremium')
      .maybeSingle()

    if (updateResult.error && isMissingColumnError(updateResult.error, 'isPremium')) {
      const { isPremium: _isPremium, ...fallbackUpdates } = updates
      if (Object.keys(fallbackUpdates).length === 0) {
        return NextResponse.json(
          {
            error:
              'Premium feature requires DB migration. Run: ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT FALSE;',
          },
          { status: 400 }
        )
      }

      updateResult = await db
        .from('User')
        .update(fallbackUpdates)
        .eq('id', userId)
        .select('id, isBlocked, deletionScheduledAt, lastLoginDate, lastActiveDate, createdAt, name, email, image')
        .maybeSingle()
    }

    if (updateResult.error) throw updateResult.error

    return NextResponse.json(updateResult.data)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 })
    }

    if (action === 'schedule') {
      const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const result = await db
        .from('User')
        .update({ deletionScheduledAt: deletionDate })
        .eq('id', userId)
        .select('id, deletionScheduledAt')
        .maybeSingle()

      if (result.error) throw result.error
      return NextResponse.json(result.data)
    }

    if (action === 'cancel') {
      const result = await db
        .from('User')
        .update({ deletionScheduledAt: null })
        .eq('id', userId)
        .select('id, deletionScheduledAt')
        .maybeSingle()

      if (result.error) throw result.error
      return NextResponse.json(result.data)
    }

    if (action === 'immediate') {
      // Cascade delete: clean up ALL related data before deleting the user.
      // This matches the cleanup logic in the cron cleanup endpoint.
      // (Reminder/CalendarFeed/CalendarAccount rows cascade-delete via their
      // ON DELETE CASCADE foreign keys — migration 016.)

      // Snapshot the user's email for VerificationToken cleanup.
      const userResult = await db.from('User').select('id,email').eq('id', userId).maybeSingle()
      const userEmail = userResult.data?.email || null

      // Delete every child table that is keyed by userId — the deletes
      // are by userId, so they must run unconditionally (a user can have
      // notes/todos/progress without having any videos).
      await db.from('Note').delete().eq('userId', userId)
      await db.from('Todo').delete().eq('userId', userId)
      await db.from('VideoProgress').delete().eq('userId', userId)
      await db.from('PlaylistMark').delete().eq('userId', userId)
      await db.from('LibraryItem').delete().eq('userId', userId)
      await db.from('Video').delete().eq('userId', userId)
      await db.from('Playlist').delete().eq('userId', userId)
      await db.from('Folder').delete().eq('userId', userId)
      await db.from('UserSettings').delete().eq('userId', userId)
      await db.from('Notification').delete().eq('userId', userId)
      await db.from('Channel').delete().eq('userId', userId)
      await db.from('Account').delete().eq('userId', userId)
      await db.from('Session').delete().eq('userId', userId)
      if (userEmail) {
        await db.from('VerificationToken').delete().eq('identifier', userEmail)
      }

      // Finally delete the user
      const result = await db
        .from('User')
        .delete()
        .eq('id', userId)
        .select('id')
        .maybeSingle()

      if (result.error) throw result.error
      return NextResponse.json({ success: true, id: result.data?.id || userId })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing user deletion request:', error)
    return NextResponse.json({ error: 'Failed to process deletion request', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
