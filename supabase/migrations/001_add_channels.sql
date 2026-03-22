-- ============================================
-- GazeFocus Channel Table Migration
-- ============================================

-- Drop existing Channel table if it exists
DROP TABLE IF EXISTS "Channel" CASCADE;

-- Create the Channel table with TEXT userId to match User table
CREATE TABLE "Channel" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "youtubeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "thumbnail" TEXT,
  "subscriberCount" TEXT,
  "videoCount" TEXT,
  "isLive" BOOLEAN NOT NULL DEFAULT FALSE,
  "liveVideoId" TEXT,
  "liveTitle" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint
ALTER TABLE "Channel" 
  ADD CONSTRAINT "Channel_youtubeId_userId_unique" 
  UNIQUE ("youtubeId", "userId");

-- Add check constraint
ALTER TABLE "Channel" 
  ADD CONSTRAINT "Channel_youtubeId_not_empty" 
  CHECK (char_length("youtubeId") > 0);

-- Create indexes
CREATE INDEX "Channel_userId_idx" ON "Channel"("userId");
CREATE INDEX "Channel_youtubeId_idx" ON "Channel"("youtubeId");
CREATE INDEX "Channel_isLive_idx" ON "Channel"("isLive");

-- Add channelId to Video table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Video' AND column_name = 'channelId'
  ) THEN
    ALTER TABLE "Video" ADD COLUMN "channelId" UUID REFERENCES "Channel"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for video-channel relationship
CREATE INDEX IF NOT EXISTS "Video_channelId_idx" ON "Video"("channelId");

-- Enable Row Level Security
ALTER TABLE "Channel" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Channel_select" ON "Channel";
CREATE POLICY "Channel_select" ON "Channel"
  FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Channel_insert" ON "Channel";
CREATE POLICY "Channel_insert" ON "Channel"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Channel_update" ON "Channel";
CREATE POLICY "Channel_update" ON "Channel"
  FOR UPDATE USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Channel_delete" ON "Channel";
CREATE POLICY "Channel_delete" ON "Channel"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Grant permissions
GRANT ALL ON "Channel" TO authenticated;
GRANT ALL ON "Channel" TO anon;
