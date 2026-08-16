# GazeFocus Proactive Scheduling Agent

This upgrade turns GazeFocus from a passive todo list into a **proactive, agentic
personal assistant**: it parses natural language into deadline tasks, nags you on
a dynamically compressing schedule, audits you every 15 minutes while you work,
recovers alerts that fired while your device was off, reminds you by **email**,
pushes **priority Windows toasts** through a tray companion app, and syncs
everything with external calendars.

## The delivery architecture (hybrid cloud + desktop)

```
                 ┌────────────────────── CLOUD (always on) ──────────────────────┐
                 │  Supabase: Reminder rows = the single source of truth         │
                 │                                                            │
 GH Actions      │  every 15 min ──► POST /api/cron/agent-email                 │
 (free scheduler)│                     emails EVERY due reminder (always-on:    │
 schedules, then │                     even if a toast already fired elsewhere)  │
 calls the API)  │                                                            │
                 └────────────────────────────────────────────────────────────┘
                          ▲                                    ▲
             HTTPS + CRON_SECRET                    HTTPS + Bearer JWT
             (GitHub → Vercel; Vercel                (poll every 30 s, peek mode)
              never calls GitHub)                                │
                                                                        │
   ┌────────────────────────┐          ┌────────────────────────────────┴─────────┐
   │ Browser (web app)      │          │ desktop/ Electron companion (Windows)    │
   │ 30 s daemon claims &   │          │ tray + autostart, runs with window       │
   │ shows AgentInbox       │          │ closed, native toasts WITH action        │
   │ dialog                 │          │ buttons acting on the same API           │
   └────────────────────────┘          └──────────────────────────────────────────┘
```

**Why it's layered this way:** email always fires (you may be away from whatever
machine showed a toast); the Electron toast is the fast, priority surface while
your PC is on; the web dialog is the interactive fallback that claims whatever
you didn't act on. Snoozing/completing on any surface updates the same Reminder
rows, so nothing double-nags.

## What was built (spec → web adaptation)

The original specification targeted Electron + SQLite. This implementation maps
every feature onto the existing Next.js + Supabase stack:

| Spec feature | Electron design | This implementation |
| --- | --- | --- |
| Boot-time missed notification recovery | `app.whenReady()` scan of SQLite | `GET /api/agent/reminders` atomically claims overdue `PENDING` reminders on app load; a red banner reports "You missed N alerts while offline" |
| Interactive notifications | Electron `Notification` with action buttons | In-app actionable dialogs + Web Notifications API (browser notifications while the app is open) |
| Dynamic interval compression | `nagEngine.js` | `src/lib/agent/schedule.ts` — >24h left: +4h · 4–24h: +1h · <4h: +30min |
| 15-minute audit loop | `setInterval` in main process | `AUDIT` reminder rows in the DB (survive reloads/restarts) claimed by the 30s client daemon |
| NLP input | chrono-node in renderer | `POST /api/agent/parse` (chrono-node, server-side, fully offline rules — no LLM key needed) |
| Bidirectional calendar sync | `@googleapis/calendar` | ICS feed aggregation (`node-ical`) for reads + plain REST OAuth2 writes to exactly one Google account |

### Files

```
supabase/migrations/016_agent_scheduling.sql   ← run this first
src/lib/agent/schedule.ts                      scheduling math (shared)
src/lib/agent/nlp.ts                           chrono-node parser
src/lib/agent/reminders.ts                     reminder state machine (server)
src/lib/calendar/ics.ts                        ICS feed aggregation + cache
src/lib/calendar/google.ts                     Google OAuth2 + event sync
src/app/api/agent/parse/route.ts               POST — NLP parse
src/app/api/agent/reminders/route.ts           GET/POST/PATCH — daemon + create + defer
src/app/api/agent/focus/route.ts               POST — audit lifecycle
src/app/api/calendar/feeds/route.ts            GET/POST/PATCH/DELETE — feed CRUD
src/app/api/calendar/aggregated/route.ts       GET — merged external events
src/app/api/calendar/google/{connect,callback,route}.ts   OAuth flow + status
src/hooks/useAgentDaemon.ts                    30s poll loop (client)
src/components/agent/AgentInbox.tsx            actionable dialogs + missed banner
src/components/agent/QuickAddBar.tsx           NLP quick-add with live preview
src/components/agent/CalendarFeedsPanel.tsx    feeds + Google connect UI
src/store/useStore.ts                          useAgentStore (zustand)
```

## Setup

### 1. Apply the database migrations

The agent needs three new tables (`Reminder`, `CalendarFeed`, `CalendarAccount`)
and new columns: four on `Todo` (`deadlineAt`, `isInFocus`, `source`,
`gEventId`) plus `Reminder.emailSentAt` for the email channel.

**Option A — Supabase Dashboard:** open your project → SQL Editor → paste the
contents of `supabase/migrations/016_agent_scheduling.sql` **and**
`supabase/migrations/017_agent_email_reminders.sql` → Run.

**Option B — Supabase CLI:**

```bash
supabase db push
# or, against the remote project:
supabase link --project-ref <your-ref>
supabase db push --linked
```

Both migrations are idempotent (`IF NOT EXISTS` guards) and enable RLS with no
policies on the new tables — all access flows through the API routes using the
service-role client, matching the existing security pattern.

### 2. Google Calendar write sync (optional but recommended)

**How the connection works (it is NOT Firebase):** Firebase/NextAuth handles
your app *login*. The calendar connection is a **separate, direct Google OAuth2
consent** (`accounts.google.com`) that asks only for calendar permission, once,
per user, when they click *Connect Google Calendar*. Google requires every
OAuth consent screen to belong to an OAuth client you register:

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application) — or reuse your existing
   `GOOGLE_CLIENT_ID` client.
3. Add an **Authorized redirect URI**:
   `https://<your-domain>/api/calendar/google/callback`
   (locally: `http://localhost:3000/api/calendar/google/callback`)
4. Ensure the **Google Calendar API** is enabled for the project.
5. Set the env vars (Vercel project settings + `.env.local`):

```bash
# Dedicated vars (preferred) — falls back to GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
# Optional: only if the redirect URI differs from NEXTAUTH_URL-derived default
GOOGLE_CALENDAR_REDIRECT_URI=
```

Users then click **Calendar → Feeds → Connect Google Calendar**. Exactly one
Google account per user can be connected (single-account write rule); agent
tasks are mirrored to `primary` and marked ✅ on completion.

### 3. External read-only calendars (no setup needed)

**How other calendars are added:** Calendar → Feeds → Add Feed — paste any
public **`.ics` URL**. For Google Calendars shared with you, use the
*Settings → Integrate calendar → Secret address in iCal format* link (it's
auto-detected and labeled). University/Outlook timetables that expose an ICS
export work the same way. Feeds render as teal read-only events on the unified
calendar grid with recurrence (RRULE) expansion, and never sync back — reads
from many feeds, writes to exactly your one connected Google account.

### 4. Email reminders (always-on channel)

Already wired: `.github/workflows/agent_reminders.yml` runs every 15 minutes
and POSTs to `/api/cron/agent-email` on your Vercel deployment using the
`CRON_SECRET` + `VERCEL_APP_URL` repo secrets (same pattern as the existing
`daily_sync.yml`). **Direction of communication: GitHub → Vercel.** Vercel
never calls GitHub; GitHub Actions is simply the free scheduler that wakes up
and hits your API. Requires the SMTP_* env vars (already set for welcome
emails) and migration 017.

Emails send for **every** reminder that comes due — regardless of whether the
web app or Electron companion already showed a notification — because you may
be away from that machine. Only tasks you explicitly complete/dismiss stop the
emails. GitHub may delay sub-hour schedules by a few minutes at busy times;
the interactive channels cover precision timing.

### 5. Electron desktop companion (priority Windows toasts)

See `desktop/README.md`. In short:

```bash
cd desktop
npm install
GAZEFOCUS_URL=https://your-app.vercel.app npm start   # dev run
npm run dist                                           # NSIS installer
```

It signs in with your site email/password (extension-login JWT), sits in the
tray, autostarts with Windows if you tick it in the tray menu, and polls
`/api/agent/reminders?peek=1` every 30 s. Priority toasts carry real action
buttons (*Do it now* / *Snooze*, *Completed* / *Keep working*) that call the
cloud API directly. `peek=1` means it never steals reminders from the web
dialog — anything you don't act on still shows up when you open the app.

## How the agent loop works

```
 QuickAddBar ("physics exam Friday 4pm")
   └─ POST /api/agent/parse            (chrono-node, offline)
        └─ preview → confirm → POST /api/agent/reminders
             ├─ Todo{deadlineAt, source:'NLP'}  + Reminder{PENDING, fireAt}
             └─ (if connected) Google Calendar event insert

 useAgentDaemon (every 30s, on every authed page)
   └─ GET /api/agent/reminders?sessionStart=…
        ├─ atomically UPDATE PENDING+overdue → FIRED, returns them
        │    ├─ fireAt < sessionStart → "missed while offline" banner
        │    └─ browser Notification + AgentInbox dialog
        └─ user picks:
             ├─ "I'll do it now"  → POST /api/agent/focus{start}
             │      └─ AUDIT reminders every 15 min →
             │           "Yes, mark complete" (kills nags, ✅ on Google)
             │           "No, keep nagging"  (next audit in 15 min)
             ├─ "Remind me later" → PATCH /api/agent/reminders{defer}
             │      └─ dynamic tiers: +4h / +1h / +30min by time left
             └─ "Skip" → PATCH … {skip}
```

All timestamps are persisted as ISO strings on `TIMESTAMPTZ` columns to avoid
timezone drift (spec §5.3).

## Known limitations of the web adaptation

- **Notifications only while a tab is open.** The 30s daemon runs in the
  browser; with no open tab nothing fires in real time — but the missed-alert
  recovery guarantees nothing is lost, it just surfaces on next open.
  (Future: Web Push via service worker + Vercel Cron for true offline delivery.)
- **Web notifications have no native action buttons** on most platforms, so the
  interactive actions live in the in-app AgentInbox dialog; the OS notification
  is the attention hook.
- **ICS reads are pull-based** with a 10-minute server cache per feed/month
  window.

## Verifying after deploy

1. Apply the migration, then load the dashboard — the QuickAddBar appears above
   the Schedule & Tasks card.
2. Type `chem lab report due tomorrow at 5pm` — a preview card with the parsed
   title/deadline should appear within ~400ms.
3. Add it; on the Calendar page the task shows as a purple event.
4. To test the nag loop immediately, temporarily set `firstFireAt` a minute out
   via `POST /api/agent/reminders` from the browser console, or wait for the
   first scheduled fire. The dialog should offer the three actions.
5. Feeds: add any public `.ics` URL and check teal events on the grid.
