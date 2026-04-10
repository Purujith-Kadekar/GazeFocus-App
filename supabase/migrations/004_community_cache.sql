-- ============================================
-- Migration: Scalable YouTube Community Cache
-- ============================================

-- -----------------------------------------------
-- 1. Create ChannelCache Table
-- -----------------------------------------------
DROP TABLE IF EXISTS "ChannelCache" CASCADE;
CREATE TABLE "ChannelCache" (
  "youtubeId" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "thumbnail" TEXT,
  "uploadsPlaylistId" TEXT,
  "lastSyncedAt" TIMESTAMPTZ,
  "nextPageToken" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- 2. Create VideoCache Table
-- -----------------------------------------------
DROP TABLE IF EXISTS "VideoCache" CASCADE;
CREATE TABLE "VideoCache" (
  "youtubeId" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "thumbnail" TEXT,
  "duration" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMPTZ,
  "channelId" TEXT REFERENCES "ChannelCache"("youtubeId") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- 3. Indexes
-- -----------------------------------------------
CREATE INDEX "VideoCache_channelId_idx" ON "VideoCache"("channelId");
CREATE INDEX "ChannelCache_lastSyncedAt_idx" ON "ChannelCache"("lastSyncedAt");

-- -----------------------------------------------
-- 4. Enable Row Level Security (RLS)
-- -----------------------------------------------
ALTER TABLE "ChannelCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VideoCache" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- 5. RLS Policies
-- -----------------------------------------------

-- Anyone authenticated can SELECT
DROP POLICY IF EXISTS "ChannelCache_select_all" ON "ChannelCache";
CREATE POLICY "ChannelCache_select_all" ON "ChannelCache"
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "VideoCache_select_all" ON "VideoCache";
CREATE POLICY "VideoCache_select_all" ON "VideoCache"
  FOR SELECT USING (auth.role() = 'authenticated');

-- Note: INSERT/UPDATE/DELETE will be done via service_role/admin logic 
-- which bypasses RLS, so no explicit policies needed for those.

-- -----------------------------------------------
-- 6. Grants
-- -----------------------------------------------
GRANT SELECT ON "ChannelCache" TO authenticated;
GRANT SELECT ON "VideoCache" TO authenticated;
GRANT SELECT ON "ChannelCache" TO anon;
GRANT SELECT ON "VideoCache" TO anon;
