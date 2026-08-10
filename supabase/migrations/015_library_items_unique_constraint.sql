-- ============================================
-- Migration 015: LibraryItem unique constraint
-- ============================================
-- Adds a unique constraint on (userId, type, externalId) for LibraryItem
-- to support safe upserts and prevent duplicate library entries.
-- This is required by the updated library-items API route which uses
-- upsert with onConflict instead of the old select-then-insert pattern.
-- ============================================

-- First, clean up any existing duplicate rows (keep the newest one)
-- before adding the constraint, since duplicates would prevent the
-- constraint from being created.
DELETE FROM "LibraryItem" a USING "LibraryItem" b
WHERE a.id < b.id
  AND a."userId" = b."userId"
  AND a.type = b.type
  AND a."externalId" = b."externalId";

-- Add the unique constraint
ALTER TABLE "LibraryItem"
  ADD CONSTRAINT "LibraryItem_userId_type_externalId_unique"
  UNIQUE ("userId", type, "externalId");

-- ============================================
-- Also add unique constraint on VideoProgress
-- ============================================
-- The progress route uses upsert with onConflict: 'userId,youtubeId'
-- but we should ensure this constraint exists at the DB level too.
-- Check if it already exists (it should from the initial schema).
-- ============================================
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'VideoProgress_userId_youtubeId_unique'
      AND conrelid = 'public."VideoProgress"'::regclass
  ) INTO constraint_exists;

  IF NOT constraint_exists THEN
    -- First clean up duplicates
    DELETE FROM "VideoProgress" a USING "VideoProgress" b
    WHERE a.id < b.id
      AND a."userId" = b."userId"
      AND a."youtubeId" = b."youtubeId";

    -- Check for existing unique index (might be created via index instead)
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'VideoProgress_userId_youtubeId_unique'
        AND tablename = 'VideoProgress'
    ) INTO constraint_exists;

    IF NOT constraint_exists THEN
      ALTER TABLE "VideoProgress"
        ADD CONSTRAINT "VideoProgress_userId_youtubeId_unique"
        UNIQUE ("userId", "youtubeId");
    END IF;
  END IF;
END $$;
