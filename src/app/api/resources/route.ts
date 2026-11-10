import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import type { Folder, Resource } from '@/types'

/** Rows returned by this route. */
type ResourceRow = {
  id: string
  userId: string
  type: 'LINK'
  externalId: string
  title: string | null
  folderId: string | null
  metadata: { url?: string; description?: string | null } | null
  position: number
  createdAt: string
  updatedAt: string
}

const RESOURCE_SELECT =
  'id,userId,type,externalId,title,folderId,metadata,position,createdAt,updatedAt'

function normalizeUrl(raw: string): { url: URL | null; normalized: string | null } {
  const trimmed = (raw || '').trim()
  if (!trimmed) return { url: null, normalized: null }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { url: null, normalized: null }
    if (!url.hostname.includes('.')) return { url: null, normalized: null }
    url.hash = ''
    // Trim a trailing slash on the root path only — keeps /3/tutorial
    // intact but stores example.com/ and example.com identically.
    if (url.pathname === '/') url.pathname = ''
    return { url, normalized: url.toString() }
  } catch {
    return { url: null, normalized: null }
  }
}

function hostOf(normalizedUrl: string): string {
  try {
    return new URL(normalizedUrl).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [itemsResult, foldersResult] = await Promise.all([
      db.from('LibraryItem').select(RESOURCE_SELECT).eq('userId', user.id).eq('type', 'LINK').order('createdAt', { ascending: false }),
      db.from('Folder').select('id,title').eq('userId', user.id).order('position', { ascending: true }),
    ])

    // A failed query must not masquerade as "no links" — the client would
    // cache the empty list and show a false zero state while the DB is down.
    if (itemsResult.error) {
      console.error('Error fetching resources:', itemsResult.error)
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }
    if (foldersResult.error) {
      console.error('Error fetching folders for resources:', foldersResult.error)
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const items = (itemsResult.data || []) as ResourceRow[]
    const folders = (foldersResult.data || []) as Folder[]
    const folderMap = new Map(folders.map((f) => [f.id, f.title]))

    const resources: Resource[] = items.map((item) => ({
      ...item,
      title: item.title || hostOf(item.externalId) || item.externalId,
      folder: item.folderId ? { id: item.folderId, title: folderMap.get(item.folderId) || 'Folder' } : null,
    }))

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, title, description, folderId } = body

    const { url: parsed, normalized } = normalizeUrl(String(url || ''))
    if (!normalized) {
      return NextResponse.json(
        { error: 'Please enter a valid website URL (e.g. https://example.com/article)' },
        { status: 400 }
      )
    }

    const finalTitle = (typeof title === 'string' && title.trim()) ? title.trim().slice(0, 300) : hostOf(normalized)
    const finalDescription =
      typeof description === 'string' && description.trim() ? description.trim().slice(0, 1000) : null

    // Validate the folder belongs to this user when one is given.
    if (folderId) {
      const { data: folder } = await db
        .from('Folder')
        .select('id')
        .eq('id', folderId)
        .eq('userId', user.id)
        .maybeSingle()
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 400 })
      }
    }

    const existing = await db
      .from('LibraryItem')
      .select('id')
      .eq('userId', user.id)
      .eq('type', 'LINK')
      .eq('externalId', normalized)
      .maybeSingle()
    if (existing.error) {
      console.error('Error checking existing resource:', existing.error)
      return NextResponse.json(
        { error: 'Failed to save link', detail: dbErrorMessage(existing.error) },
        { status: 500 }
      )
    }
    if (existing.data) {
      return NextResponse.json({ error: 'This link is already in your resources' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data: item, error: insertError } = await db
      .from('LibraryItem')
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        type: 'LINK',
        externalId: normalized,
        title: finalTitle,
        folderId: folderId || null,
        metadata: { url: normalized, description: finalDescription },
        position: 0,
        createdAt: now,
        updatedAt: now,
      })
      .select(RESOURCE_SELECT)
      .single()

    if (insertError || !item) {
      console.error('Error creating resource:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to save link',
          detail: insertError ? dbErrorMessage(insertError) : 'Database returned no row',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { ...item, title: (item as ResourceRow).title || finalTitle },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: 'Failed to save link', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * Extract a human-readable message from a Supabase/PostgREST error object.
 * Surfaced to the client as `detail` next to the generic error string so
 * schema problems (e.g. a missing enum value or a stale PostgREST schema
 * cache) are diagnosable from the UI instead of only the server logs.
 */
function dbErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: unknown }).message)
    if (msg) return msg.slice(0, 300)
  }
  return String(err).slice(0, 300)
}
