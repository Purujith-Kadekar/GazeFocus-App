-- ============================================
-- Migration 016: Agentic Scheduling Assistant
-- ============================================
-- Upgrades GazeFocus from a passive todo list into a
-- proactive scheduling agent:
--
--  1. Extend "Todo" with deadline tracking, focus (audit)
--     state, source attribution and Google event linkage.
--  2. New "Reminder" table: persistent notification state
--     machine (PENDING -> FIRED / SKIPPED) so alerts that
--     were due while the device was offline are recovered
--     on the next app boot instead of being lost.
--  3. New "CalendarFeed" table: user-added read-only ICS /
--     Google secret-address feeds aggregated into the
--     unified calendar view.
--  4. New "CalendarAccount" table: exactly one primary
--     Google account per user for calendar event writes.
--
-- All timestamps are TIMESTAMPTZ and written as explicit
-- ISO strings by the API to avoid temporal drift bugs.
-- ============================================

-- -----------------------------------------------
-- 1. Extend Todo for the agent loop
-- -----------------------------------------------
ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS "deadlineAt" TIMESTAMPTZ;
ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS "isInFocus" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS "gEventId" TEXT;

CREATE INDEX IF NOT EXISTS "Todo_user_deadline_idx" ON "Todo"("userId", "deadlineAt") WHERE "deadlineAt" IS NOT NULL;

-- -----------------------------------------------
-- 2. Reminder engine (persistent alert state machine)
-- -----------------------------------------------
-- kind:
--   'DEADLINE' -> proactive deadline nag notification
--   'AUDIT'    -> 15-minute "are you done yet?" verification
-- status:
--   'PENDING'  -> scheduled, waiting for fire_at
--   'FIRED'    -> delivered to the client
--   'SKIPPED'  -> cancelled by user or task completion
CREATE TABLE IF NOT EXISTS "Reminder" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "todoId" TEXT NOT NULL REFERENCES "Todo"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL DEFAULT 'DEADLINE' CHECK ("kind" IN ('DEADLINE', 'AUDIT')),
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'FIRED', 'SKIPPED')),
  "fireAt" TIMESTAMPTZ NOT NULL,
  "firedAt" TIMESTAMPTZ,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Reminder_user_pending_idx" ON "Reminder"("userId", "status", "fireAt");
CREATE INDEX IF NOT EXISTS "Reminder_todo_idx" ON "Reminder"("todoId");

-- -----------------------------------------------
-- 3. External read-only calendar feeds
-- -----------------------------------------------
-- feedType:
--   'ICS_FEED'         -> any public .ics URL
--   'GOOGLE_READ_ONLY' -> a Google Calendar secret iCal address
--                         shared with the user (also fetched as ICS)
CREATE TABLE IF NOT EXISTS "CalendarFeed" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "feedName" TEXT,
  "feedUrl" TEXT NOT NULL,
  "feedType" TEXT NOT NULL DEFAULT 'ICS_FEED' CHECK ("feedType" IN ('ICS_FEED', 'GOOGLE_READ_ONLY')),
  "color" TEXT,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CalendarFeed_user_idx" ON "CalendarFeed"("userId", "isEnabled");

-- -----------------------------------------------
-- 4. Primary Google account for calendar writes
-- -----------------------------------------------
-- One row per user (UNIQUE userId) enforcing the
-- "multi-read, single-account write" rule.
CREATE TABLE IF NOT EXISTS "CalendarAccount" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL DEFAULT 'google',
  "email" TEXT,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenExpiresAt" TIMESTAMPTZ,
  "scope" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- 5. Security: RLS + revoke direct client access
-- -----------------------------------------------
-- All access flows through the Next.js API routes using
-- the service-role key (which bypasses RLS), so the new
-- tables get RLS enabled with no permissive policies and
-- direct anon/authenticated grants revoked. This matches
-- the hardening pattern used for VerificationToken in
-- migration 014.
ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarFeed" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarAccount" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "Reminder" FROM anon, authenticated;
REVOKE ALL ON "CalendarFeed" FROM anon, authenticated;
REVOKE ALL ON "CalendarAccount" FROM anon, authenticated;
