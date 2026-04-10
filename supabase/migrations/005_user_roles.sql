-- ============================================
-- Migration: User Roles & Admin Management
-- ============================================

-- -----------------------------------------------
-- 1. Add role column to User table
-- -----------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'role'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
  END IF;
END $$;

-- -----------------------------------------------
-- 2. Enhanced RLS Policies for Admin
-- -----------------------------------------------

-- Allow Admins to see all user profiles
DROP POLICY IF EXISTS "User_select_admin" ON "User";
CREATE POLICY "User_select_admin" ON "User"
  FOR SELECT USING (
    (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
  );

-- Allow Admins to update user roles
DROP POLICY IF EXISTS "User_update_admin" ON "User";
CREATE POLICY "User_update_admin" ON "User"
  FOR UPDATE USING (
    (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
  );

-- -----------------------------------------------
-- 3. Quota Tracking (Optional but helpful)
-- -----------------------------------------------
-- You can add a table here later to track daily usage per user
-- if the soft-quota needs to be strictly enforced.
