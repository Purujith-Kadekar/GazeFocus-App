-- ============================================
-- Migration 018: Drop unused User.role column
-- ============================================
-- The "role" column and its two RLS policies from migration
-- 005_user_roles.sql were never effective:
--
--  1. All app traffic reaches Postgres through the Next.js API
--     routes using the Supabase SERVICE-ROLE key, which bypasses
--     Row Level Security entirely.
--  2. End users never authenticate through Supabase Auth
--     (login is NextAuth credentials / Google / Firebase-token
--     exchange), so auth.uid() is always NULL for app traffic
--     and the policies can never match.
--  3. Admin portal access is gated exclusively by the separate
--     admin_session JWT cookie (src/lib/admin-auth.ts), which has
--     nothing to do with this column.
--
-- Verified before dropping: no code reads User.role anywhere in
-- src/ (the only `.role` hits are the admin JWT's own claim), and
-- the generated type in src/types/supabase.ts already omits it.
-- Premium/billing state lives in "isPremium" (migration 006).
-- ============================================

-- Remove the ineffective RLS policies first.
DROP POLICY IF EXISTS "User_select_admin" ON "User";
DROP POLICY IF EXISTS "User_update_admin" ON "User";

-- Then the column itself.
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";
