-- ============================================
-- Migration: Firebase Token Storage
-- ============================================

-- -----------------------------------------------
-- 1. Add Firebase UID column (unique identifier)
-- -----------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'firebaseUid'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "firebaseUid" TEXT UNIQUE;
  END IF;
END $$;

-- -----------------------------------------------
-- 2. Add Firebase ID Token column
-- -----------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'firebaseIdToken'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "firebaseIdToken" TEXT;
  END IF;
END $$;

-- -----------------------------------------------
-- 3. Add Firebase Refresh Token column
-- -----------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'firebaseRefreshToken'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "firebaseRefreshToken" TEXT;
  END IF;
END $$;

-- -----------------------------------------------
-- 4. Create index for firebaseUid lookup
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS "User_firebaseUid_idx" ON "User"("firebaseUid");