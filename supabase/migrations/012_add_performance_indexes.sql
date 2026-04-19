-- ============================================
-- Migration: Performance Indexes for GazeFocus
-- ============================================

-- LibraryItem: Critical for dashboard load and folder/item deletions
CREATE INDEX IF NOT EXISTS "LibraryItem_userId_idx" ON "LibraryItem"("userId");
CREATE INDEX IF NOT EXISTS "LibraryItem_folderId_idx" ON "LibraryItem"("folderId");
CREATE INDEX IF NOT EXISTS "LibraryItem_externalId_idx" ON "LibraryItem"("externalId");

-- Video: Critical for playlist/channel views and library queries
CREATE INDEX IF NOT EXISTS "Video_userId_idx" ON "Video"("userId");
CREATE INDEX IF NOT EXISTS "Video_playlistId_idx" ON "Video"("playlistId");
CREATE INDEX IF NOT EXISTS "Video_channelId_idx" ON "Video"("channelId");
CREATE INDEX IF NOT EXISTS "Video_youtubeId_userId_idx" ON "Video"("youtubeId", "userId");

-- Playlist & Channel: User-specific filtering
CREATE INDEX IF NOT EXISTS "Playlist_userId_idx" ON "Playlist"("userId");
CREATE INDEX IF NOT EXISTS "Channel_userId_idx" ON "Channel"("userId");

-- Notes & Todos: Dashboard listing
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");
CREATE INDEX IF NOT EXISTS "Note_youtubeId_idx" ON "Note"("youtubeId");
CREATE INDEX IF NOT EXISTS "Todo_userId_idx" ON "Todo"("userId");

-- Progress tracking
CREATE INDEX IF NOT EXISTS "VideoProgress_userId_idx" ON "VideoProgress"("userId");
CREATE INDEX IF NOT EXISTS "VideoProgress_youtubeId_idx" ON "VideoProgress"("youtubeId");
