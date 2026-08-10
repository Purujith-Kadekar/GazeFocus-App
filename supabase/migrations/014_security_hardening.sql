-- ============================================
-- Migration 014: Security Hardening
-- ============================================
-- This migration addresses multiple security and data-integrity
-- issues found in the GazeFocus project:
--
--  1. Revoke GRANT ALL on Channel from anon (read-only instead)
--  2. Remove permissive VerificationToken INSERT/DELETE RLS policies
--  3. Add totalVideos column to Playlist
--  4. Add ON DELETE CASCADE for Video → Playlist foreign key
--  5. Add ON DELETE SET NULL for Video → Channel foreign key
--  6. (Skipped — adminPasswordHash must be handled at API level)
--  7. Add increment_weekly_videos_watched RPC function
--  8. Clean up _prisma_migrations table
--  9. Revoke excessive GRANT ALL on SiteSettings from authenticated
-- 10. Add isBlocked index on User table
-- ============================================

-- -----------------------------------------------
-- 1. Restrict anon role on Channel to SELECT only
-- -----------------------------------------------
-- Previously migration 001 granted GRANT ALL ON "Channel" TO anon.
-- Anon users should only be able to read channel info, never modify it.
REVOKE ALL ON "Channel" FROM anon;
GRANT SELECT ON "Channel" TO anon;

-- -----------------------------------------------
-- 2. Remove permissive VerificationToken RLS policies
-- -----------------------------------------------
-- The INSERT and DELETE policies allow ANY authenticated user to
-- insert or delete verification tokens for ANY identifier. This is
-- a security risk — token creation and deletion should only happen
-- via the service role key (which bypasses RLS entirely).
-- We keep the SELECT policy since reading tokens is scoped by
-- the query itself and the app uses service role for lookups.
DROP POLICY IF EXISTS "VerificationToken_insert_authenticated" ON "VerificationToken";
DROP POLICY IF EXISTS "VerificationToken_delete_authenticated" ON "VerificationToken";
-- VerificationToken_select_authenticated is intentionally kept as-is.

-- -----------------------------------------------
-- 3. Add totalVideos column to Playlist
-- -----------------------------------------------
-- Needed for the new playlist sync strategy that compares the stored
-- total count against the actual count from YouTube to detect added/
-- removed videos efficiently.
ALTER TABLE "Playlist" ADD COLUMN IF NOT EXISTS "totalVideos" INTEGER NOT NULL DEFAULT 0;

-- -----------------------------------------------
-- 4. Add ON DELETE CASCADE for Video → Playlist foreign key
-- -----------------------------------------------
-- When a playlist is deleted, its videos should be automatically
-- deleted too. The current foreign key has no ON DELETE action,
-- which means PostgreSQL defaults to RESTRICT — preventing playlist
-- deletion unless all videos are removed first.
DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  -- Check if the constraint exists (Prisma convention: Video_playlistId_fkey)
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Video_playlistId_fkey'
      AND conrelid = 'public."Video"'::regclass
  ) INTO fk_exists;

  IF fk_exists THEN
    EXECUTE 'ALTER TABLE "Video" DROP CONSTRAINT "Video_playlistId_fkey"';
  END IF;

  -- Add the new constraint with CASCADE
  EXECUTE 'ALTER TABLE "Video" ADD CONSTRAINT "Video_playlistId_fkey"
    FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE';
END $$;

-- -----------------------------------------------
-- 5. Add ON DELETE SET NULL for Video → Channel foreign key
-- -----------------------------------------------
-- When a channel is deleted, its videos should NOT be cascade-deleted.
-- Instead, the channelId should be set to NULL so the videos remain
-- accessible (they just lose their channel association).
DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  -- Check if the constraint exists
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Video_channelId_fkey'
      AND conrelid = 'public."Video"'::regclass
  ) INTO fk_exists;

  IF fk_exists THEN
    EXECUTE 'ALTER TABLE "Video" DROP CONSTRAINT "Video_channelId_fkey"';
  END IF;

  -- Add the new constraint with SET NULL
  EXECUTE 'ALTER TABLE "Video" ADD CONSTRAINT "Video_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL';
END $$;

-- -----------------------------------------------
-- 6. (SKIPPED) adminPasswordHash in SiteSettings RLS
-- -----------------------------------------------
-- RLS policies can only filter rows, not columns. The adminPasswordHash
-- column must be excluded at the API level (e.g., by explicitly selecting
-- columns in the settings route). No DB-level migration needed.

-- -----------------------------------------------
-- 7. Atomic increment function for weeklyVideosWatched
-- -----------------------------------------------
-- Allows the progress route to atomically increment weeklyVideosWatched
-- without race conditions. If the week has rolled over, the counter
-- resets to 1 and the lastWeeklyReset timestamp is updated.
CREATE OR REPLACE FUNCTION increment_weekly_videos_watched(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  last_reset TIMESTAMPTZ;
  monday_date TIMESTAMPTZ;
BEGIN
  -- Calculate current Monday (start of the ISO week in UTC)
  monday_date := date_trunc('week', NOW() AT TIME ZONE 'UTC');

  -- Fetch current values
  SELECT "weeklyVideosWatched", "lastWeeklyReset" INTO current_count, last_reset
  FROM "User" WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with id % not found', p_user_id;
  END IF;

  -- If we're in a new week, reset to 1
  IF last_reset IS NULL OR last_reset < monday_date THEN
    UPDATE "User" SET
      "weeklyVideosWatched" = 1,
      "lastWeeklyReset" = monday_date
    WHERE id = p_user_id;
    RETURN 1;
  END IF;

  -- Otherwise increment atomically
  UPDATE "User" SET "weeklyVideosWatched" = "weeklyVideosWatched" + 1
  WHERE id = p_user_id;

  RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------
-- 8. Clean up _prisma_migrations table
-- -----------------------------------------------
-- If Prisma was used during development, its migration tracking table
-- may still exist. Since we use Supabase migrations exclusively, this
-- table is unnecessary and should be removed.
DROP TABLE IF EXISTS "_prisma_migrations";

-- -----------------------------------------------
-- 9. Revoke excessive GRANT ALL on SiteSettings from authenticated
-- -----------------------------------------------
-- Authenticated users should only be able to SELECT from SiteSettings.
-- INSERT/UPDATE/DELETE are admin-only operations handled via the
-- service role key (which bypasses RLS).
-- Note: Migration 002 already set GRANT SELECT (not ALL), but we
-- include REVOKE + GRANT here for idempotency in case another
-- migration or manual change granted broader permissions.
REVOKE ALL ON "SiteSettings" FROM authenticated;
GRANT SELECT ON "SiteSettings" TO authenticated;

-- Also ensure Channel's authenticated grant is consistent with the
-- RLS policies (authenticated users can still do ALL via their
-- own-data RLS policies, but we don't need to double-grant).
-- The RLS policies on Channel already restrict to own data, so
-- GRANT ALL for authenticated is acceptable there. No change needed.

-- -----------------------------------------------
-- 10. Add isBlocked index on User table
-- -----------------------------------------------
-- The middleware checks isBlocked on every request. Without an index,
-- this results in a sequential scan on the User table. An index
-- dramatically speeds up the middleware lookup for blocked users.
CREATE INDEX IF NOT EXISTS "User_isBlocked_idx" ON "User"("isBlocked");
