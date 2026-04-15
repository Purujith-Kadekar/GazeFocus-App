-- ============================================
-- Migration: Enable RLS on _prisma_migrations
-- ============================================
-- The _prisma_migrations table is in the public schema, which is exposed via
-- PostgREST. Enabling RLS with no permissive policies ensures that no role
-- (anon or authenticated) can read or modify migration history through the API.
-- The table is only accessed by the service role (which bypasses RLS), so
-- normal application behaviour is unaffected.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
