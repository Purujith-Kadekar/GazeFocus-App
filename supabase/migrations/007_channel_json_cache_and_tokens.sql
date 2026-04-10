-- ============================================
-- Migration: Channel JSON Cache + Token Controls
-- ============================================

-- Store full channel snapshots as JSON so live/videos pages can reuse DB data.
CREATE TABLE IF NOT EXISTS "ChannelJsonCache" (
  "channelId" TEXT PRIMARY KEY,
  "payload" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "latestVideoPublishedAt" TIMESTAMPTZ NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ChannelJsonCache_latestVideoPublishedAt_idx"
  ON "ChannelJsonCache"("latestVideoPublishedAt");

ALTER TABLE "ChannelJsonCache" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ChannelJsonCache_select_authenticated" ON "ChannelJsonCache";
CREATE POLICY "ChannelJsonCache_select_authenticated"
  ON "ChannelJsonCache"
  FOR SELECT
  USING (auth.role() = 'authenticated');

GRANT SELECT ON "ChannelJsonCache" TO authenticated;

-- Global per-user daily token limit configurable from admin settings.
ALTER TABLE "SiteSettings"
ADD COLUMN IF NOT EXISTS "userDailyTokenLimit" INTEGER NOT NULL DEFAULT 200;

-- Per-user daily token usage tracking.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "apiTokensUsed" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "apiTokensResetAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();
