// ============================================
// GazeFocus — Google Calendar integration
// ============================================
// Implements the "multi-read, single-account write" rule from
// the agent spec: exactly one OAuth2-connected Google account
// per user receives event writes (calendar.events.insert /
// .patch via the plain REST API — no heavyweight SDK).
// Server-side only.

import { SignJWT, jwtVerify } from 'jose'
import type { CalendarAccount, Todo } from '@/types'
import { db } from '@/lib/db'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
const GOOGLE_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
}

/**
 * Resolve OAuth client credentials. Fallback order (least user
 * setup first): dedicated calendar vars → shared GOOGLE_* vars →
 * the NextAuth login client (AUTH_GOOGLE_ID, which just needs the
 * calendar scope + calendar callback redirect URI added in the
 * Google Cloud Console to serve both purposes).
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId =
    process.env.GOOGLE_CALENDAR_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.AUTH_GOOGLE_ID
  const clientSecret =
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.AUTH_GOOGLE_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

export function getGoogleRedirectUri(origin: string): string {
  return process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${origin}/api/calendar/google/callback`
}

/**
 * Build the consent screen URL. The state parameter is a short-lived
 * JWT signed with NEXTAUTH_SECRET binding the callback to the user
 * who started the flow, so the callback can't be replayed for
 * someone else's account row.
 */
export async function buildGoogleAuthUrl(userId: string, redirectUri: string): Promise<string | null> {
  const config = getGoogleOAuthConfig()
  const secret = process.env.NEXTAUTH_SECRET
  if (!config || !secret) return null

  const state = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(new TextEncoder().encode(secret))

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES,
    access_type: 'offline', // required to receive a refresh_token
    prompt: 'consent', // force refresh_token on re-connect
    include_granted_scopes: 'true',
    state,
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function verifyGoogleState(state: string): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null
  try {
    const { payload } = await jwtVerify(state, new TextEncoder().encode(secret))
    return (payload.uid as string) || null
  } catch {
    return null
  }
}

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
  token_type: string
}

async function exchangeTokens(
  config: GoogleOAuthConfig,
  body: Record<string, string>
): Promise<GoogleTokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...body,
    }),
  })
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

/** Exchange the OAuth code and persist the (single) calendar account for the user. */
export async function connectGoogleAccount(
  userId: string,
  code: string,
  redirectUri: string
): Promise<CalendarAccount | null> {
  const config = getGoogleOAuthConfig()
  if (!config) return null

  const tokens = await exchangeTokens(config, {
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  let email: string | null = null
  try {
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (profileRes.ok) {
      email = (await profileRes.json()).email ?? null
    }
  } catch {
    // Email is cosmetic; the connection still works without it.
  }

  const now = new Date().toISOString()
  const values = {
    id: crypto.randomUUID(),
    userId,
    provider: 'google',
    email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scope: tokens.scope ?? null,
    updatedAt: now,
    createdAt: now,
  }

  const { data, error } = await db
    .from('CalendarAccount')
    .upsert(values, { onConflict: 'userId' })
    .select('*')
    .single()
  if (error) throw error
  return data as unknown as CalendarAccount
}

export async function getGoogleAccount(userId: string): Promise<CalendarAccount | null> {
  const { data } = await db
    .from('CalendarAccount')
    .select('*')
    .eq('userId', userId)
    .maybeSingle()
  return (data as unknown as CalendarAccount) || null
}

export async function disconnectGoogleAccount(userId: string) {
  await db.from('CalendarAccount').delete().eq('userId', userId)
}

/**
 * Return a valid access token, refreshing it via the stored
 * refresh token when it is about to expire.
 */
async function ensureAccessToken(userId: string): Promise<string | null> {
  const account = await getGoogleAccount(userId)
  if (!account) return null

  const expiresAt = account.tokenExpiresAt ? Date.parse(account.tokenExpiresAt) : 0
  if (account.accessToken && expiresAt - Date.now() > 60_000) {
    return account.accessToken
  }

  const config = getGoogleOAuthConfig()
  if (!account.refreshToken || !config) return null

  const refreshed = await exchangeTokens(config, {
    grant_type: 'refresh_token',
    refresh_token: account.refreshToken,
  })

  await db
    .from('CalendarAccount')
    .update({
      accessToken: refreshed.access_token,
      tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', userId)

  return refreshed.access_token
}

interface GoogleEventBody {
  summary: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  extendedProperties?: { private: { gazefocusTodoId: string } }
}

function todoToEventBody(todo: Todo): GoogleEventBody {
  const startIso = todo.deadlineAt || todo.reminderAt || new Date().toISOString()
  const startMs = Date.parse(startIso)
  const endMs = Number.isNaN(startMs) ? Date.now() : startMs + 30 * 60 * 1000
  return {
    summary: todo.text,
    description: 'Created by GazeFocus Agent',
    start: { dateTime: new Date(startMs).toISOString() },
    end: { dateTime: new Date(endMs).toISOString() },
    extendedProperties: { private: { gazefocusTodoId: todo.id } },
  }
}

/**
 * Insert (or update) the Google Calendar event for an agent task
 * and store the resulting event id on the Todo row. Fire-and-
 * forget safe: failures never break the agent flow.
 */
export async function syncTodoToGoogle(userId: string, todo: Todo): Promise<boolean> {
  try {
    const token = await ensureAccessToken(userId)
    if (!token) return false

    const body = todoToEventBody(todo)

    if (todo.gEventId) {
      const res = await fetch(`${GOOGLE_EVENTS_URL}/${encodeURIComponent(todo.gEventId)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return res.ok
    }

    const res = await fetch(GOOGLE_EVENTS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return false

    const event = await res.json()
    if (event?.id) {
      await db.from('Todo').update({ gEventId: event.id }).eq('id', todo.id)
    }
    return true
  } catch (err) {
    console.error('Google Calendar sync failed:', err)
    return false
  }
}

/** Mark the synced Google event as done when the task completes. */
export async function markGoogleEventDone(userId: string, todo: Todo): Promise<boolean> {
  try {
    if (!todo.gEventId) return false
    const token = await ensureAccessToken(userId)
    if (!token) return false

    const res = await fetch(
      `${GOOGLE_EVENTS_URL}/${encodeURIComponent(todo.gEventId)}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: `${todo.text} ✅` }),
      }
    )
    return res.ok
  } catch (err) {
    console.error('Google Calendar completion update failed:', err)
    return false
  }
}

/**
 * Remove the synced Google Calendar event — called when the task
 * is deleted or its reminder/due time is cleared. 404/410 (event
 * already gone) count as success so we never retry forever.
 */
export async function deleteGoogleEvent(userId: string, todo: Todo): Promise<boolean> {
  try {
    if (!todo.gEventId) return false
    const token = await ensureAccessToken(userId)
    if (!token) return false

    const res = await fetch(
      `${GOOGLE_EVENTS_URL}/${encodeURIComponent(todo.gEventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    return res.ok || res.status === 404 || res.status === 410
  } catch (err) {
    console.error('Google Calendar event delete failed:', err)
    return false
  }
}
