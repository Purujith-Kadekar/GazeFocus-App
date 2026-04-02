-- ============================================================
-- Migration: Admin password storage in SiteSettings
-- ============================================================
-- Adds an optional adminPasswordHash column to SiteSettings so
-- the admin can change their password from within the portal.
-- The column is nullable: when NULL the app falls back to the
-- ADMIN_PASSWORD environment variable.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SiteSettings' AND column_name = 'adminPasswordHash'
  ) THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "adminPasswordHash" TEXT;
  END IF;
END $$;
