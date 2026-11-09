-- Migration 019: LINK library items (website / article resources)
--
-- Users can save any website (docs, articles, GitHub repos, courses) as a
-- "resource" alongside videos and playlists. Resources are stored as
-- LibraryItem rows with type='LINK'; externalId is the URL (unique per
-- user under the existing (userId, type, externalId) constraint) and
-- metadata carries { url, description }.
--
-- The real production column is an enum-backed check in some databases
-- and a plain text column in others; both paths are handled below.

-- 1) Enum case: add 'LINK' to LibraryItemType if it is an enum type.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LibraryItemType' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER TYPE "LibraryItemType" ADD VALUE IF NOT EXISTS ''LINK''';
  END IF;
END $$;

-- 2) Text-column case: widen the CHECK constraint (if any) to allow LINK.
--    (No-op when the column is an enum or has no constraint.)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class r ON r.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = r.relnamespace
  WHERE r.relname = 'LibraryItem' AND n.nspname = 'public'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%LibraryItemType%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "LibraryItem" DROP CONSTRAINT %I', constraint_name);
    EXECUTE 'ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItemType_check"
      CHECK ("type" IN (''PLAYLIST'', ''VIDEO'', ''CHANNEL'', ''FOLDER'', ''LINK''))';
  END IF;
END $$;

-- 3) RLS: existing LibraryItem policies are keyed on userId only, so LINK
--    rows are covered automatically. Index for the resources list query.
CREATE INDEX IF NOT EXISTS "LibraryItem_userId_type_idx"
  ON "LibraryItem"("userId", "type");

-- 4) Make PostgREST pick up the new enum value immediately.
NOTIFY pgrst, 'reload schema';
