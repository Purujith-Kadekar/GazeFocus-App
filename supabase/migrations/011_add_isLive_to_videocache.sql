-- Migration 011: Add isLive column to VideoCache
-- ============================================

ALTER TABLE "VideoCache" ADD COLUMN "isLive" BOOLEAN DEFAULT FALSE;

CREATE INDEX "VideoCache_isLive_idx" ON "VideoCache"("isLive");