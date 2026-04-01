-- ============================================
-- Migration: Watch Break Settings + Row Level Security
-- ============================================

-- -----------------------------------------------
-- 1. Add watch break columns to UserSettings
-- -----------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'UserSettings' AND column_name = 'watchBreakEnabled'
  ) THEN
    ALTER TABLE "UserSettings" ADD COLUMN "watchBreakEnabled" BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'UserSettings' AND column_name = 'watchBreakMinutes'
  ) THEN
    ALTER TABLE "UserSettings" ADD COLUMN "watchBreakMinutes" INTEGER NOT NULL DEFAULT 45;
  END IF;
END $$;

-- -----------------------------------------------
-- 2. Enable Row Level Security on all user tables
-- -----------------------------------------------

-- User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User_select_own" ON "User";
CREATE POLICY "User_select_own" ON "User"
  FOR SELECT USING (auth.uid()::text = "id");
DROP POLICY IF EXISTS "User_update_own" ON "User";
CREATE POLICY "User_update_own" ON "User"
  FOR UPDATE USING (auth.uid()::text = "id");

-- Account table (NextAuth)
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Account_select_own" ON "Account";
CREATE POLICY "Account_select_own" ON "Account"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Account_insert_own" ON "Account";
CREATE POLICY "Account_insert_own" ON "Account"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Account_delete_own" ON "Account";
CREATE POLICY "Account_delete_own" ON "Account"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Session table (NextAuth)
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Session_select_own" ON "Session";
CREATE POLICY "Session_select_own" ON "Session"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Session_insert_own" ON "Session";
CREATE POLICY "Session_insert_own" ON "Session"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Session_delete_own" ON "Session";
CREATE POLICY "Session_delete_own" ON "Session"
  FOR DELETE USING (auth.uid()::text = "userId");

-- UserSettings table
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UserSettings_select_own" ON "UserSettings";
CREATE POLICY "UserSettings_select_own" ON "UserSettings"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "UserSettings_insert_own" ON "UserSettings";
CREATE POLICY "UserSettings_insert_own" ON "UserSettings"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "UserSettings_update_own" ON "UserSettings";
CREATE POLICY "UserSettings_update_own" ON "UserSettings"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "UserSettings_delete_own" ON "UserSettings";
CREATE POLICY "UserSettings_delete_own" ON "UserSettings"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Folder table
ALTER TABLE "Folder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Folder_select_own" ON "Folder";
CREATE POLICY "Folder_select_own" ON "Folder"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Folder_insert_own" ON "Folder";
CREATE POLICY "Folder_insert_own" ON "Folder"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Folder_update_own" ON "Folder";
CREATE POLICY "Folder_update_own" ON "Folder"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Folder_delete_own" ON "Folder";
CREATE POLICY "Folder_delete_own" ON "Folder"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Playlist table
ALTER TABLE "Playlist" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Playlist_select_own" ON "Playlist";
CREATE POLICY "Playlist_select_own" ON "Playlist"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Playlist_insert_own" ON "Playlist";
CREATE POLICY "Playlist_insert_own" ON "Playlist"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Playlist_update_own" ON "Playlist";
CREATE POLICY "Playlist_update_own" ON "Playlist"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Playlist_delete_own" ON "Playlist";
CREATE POLICY "Playlist_delete_own" ON "Playlist"
  FOR DELETE USING (auth.uid()::text = "userId");

-- PlaylistMark table
ALTER TABLE "PlaylistMark" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PlaylistMark_select_own" ON "PlaylistMark";
CREATE POLICY "PlaylistMark_select_own" ON "PlaylistMark"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "PlaylistMark_insert_own" ON "PlaylistMark";
CREATE POLICY "PlaylistMark_insert_own" ON "PlaylistMark"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "PlaylistMark_update_own" ON "PlaylistMark";
CREATE POLICY "PlaylistMark_update_own" ON "PlaylistMark"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "PlaylistMark_delete_own" ON "PlaylistMark";
CREATE POLICY "PlaylistMark_delete_own" ON "PlaylistMark"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Video table
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Video_select_own" ON "Video";
CREATE POLICY "Video_select_own" ON "Video"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Video_insert_own" ON "Video";
CREATE POLICY "Video_insert_own" ON "Video"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Video_update_own" ON "Video";
CREATE POLICY "Video_update_own" ON "Video"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Video_delete_own" ON "Video";
CREATE POLICY "Video_delete_own" ON "Video"
  FOR DELETE USING (auth.uid()::text = "userId");

-- VideoProgress table
ALTER TABLE "VideoProgress" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "VideoProgress_select_own" ON "VideoProgress";
CREATE POLICY "VideoProgress_select_own" ON "VideoProgress"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "VideoProgress_insert_own" ON "VideoProgress";
CREATE POLICY "VideoProgress_insert_own" ON "VideoProgress"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "VideoProgress_update_own" ON "VideoProgress";
CREATE POLICY "VideoProgress_update_own" ON "VideoProgress"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "VideoProgress_delete_own" ON "VideoProgress";
CREATE POLICY "VideoProgress_delete_own" ON "VideoProgress"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Note table
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Note_select_own" ON "Note";
CREATE POLICY "Note_select_own" ON "Note"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Note_insert_own" ON "Note";
CREATE POLICY "Note_insert_own" ON "Note"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Note_update_own" ON "Note";
CREATE POLICY "Note_update_own" ON "Note"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Note_delete_own" ON "Note";
CREATE POLICY "Note_delete_own" ON "Note"
  FOR DELETE USING (auth.uid()::text = "userId");

-- LibraryItem table
ALTER TABLE "LibraryItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "LibraryItem_select_own" ON "LibraryItem";
CREATE POLICY "LibraryItem_select_own" ON "LibraryItem"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "LibraryItem_insert_own" ON "LibraryItem";
CREATE POLICY "LibraryItem_insert_own" ON "LibraryItem"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "LibraryItem_update_own" ON "LibraryItem";
CREATE POLICY "LibraryItem_update_own" ON "LibraryItem"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "LibraryItem_delete_own" ON "LibraryItem";
CREATE POLICY "LibraryItem_delete_own" ON "LibraryItem"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Todo table
ALTER TABLE "Todo" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todo_select_own" ON "Todo";
CREATE POLICY "Todo_select_own" ON "Todo"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Todo_insert_own" ON "Todo";
CREATE POLICY "Todo_insert_own" ON "Todo"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Todo_update_own" ON "Todo";
CREATE POLICY "Todo_update_own" ON "Todo"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Todo_delete_own" ON "Todo";
CREATE POLICY "Todo_delete_own" ON "Todo"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Notification table
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Notification_select_own" ON "Notification";
CREATE POLICY "Notification_select_own" ON "Notification"
  FOR SELECT USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Notification_insert_own" ON "Notification";
CREATE POLICY "Notification_insert_own" ON "Notification"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Notification_update_own" ON "Notification";
CREATE POLICY "Notification_update_own" ON "Notification"
  FOR UPDATE USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Notification_delete_own" ON "Notification";
CREATE POLICY "Notification_delete_own" ON "Notification"
  FOR DELETE USING (auth.uid()::text = "userId");

-- SiteSettings (admin only — service role bypasses RLS, so just enable it)
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SiteSettings_select_authenticated" ON "SiteSettings";
CREATE POLICY "SiteSettings_select_authenticated" ON "SiteSettings"
  FOR SELECT USING (auth.role() = 'authenticated');

-- VerificationToken (NextAuth — no userId column; all operations via service role, but add policies for authenticated access)
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "VerificationToken_select_authenticated" ON "VerificationToken";
CREATE POLICY "VerificationToken_select_authenticated" ON "VerificationToken"
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "VerificationToken_insert_authenticated" ON "VerificationToken";
CREATE POLICY "VerificationToken_insert_authenticated" ON "VerificationToken"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "VerificationToken_delete_authenticated" ON "VerificationToken";
CREATE POLICY "VerificationToken_delete_authenticated" ON "VerificationToken"
  FOR DELETE USING (auth.role() = 'authenticated');

-- Grant authenticated role access
GRANT ALL ON "User" TO authenticated;
GRANT ALL ON "Account" TO authenticated;
GRANT ALL ON "Session" TO authenticated;
GRANT ALL ON "UserSettings" TO authenticated;
GRANT ALL ON "Folder" TO authenticated;
GRANT ALL ON "Playlist" TO authenticated;
GRANT ALL ON "PlaylistMark" TO authenticated;
GRANT ALL ON "Video" TO authenticated;
GRANT ALL ON "VideoProgress" TO authenticated;
GRANT ALL ON "Note" TO authenticated;
GRANT ALL ON "LibraryItem" TO authenticated;
GRANT ALL ON "Todo" TO authenticated;
GRANT ALL ON "Notification" TO authenticated;
GRANT SELECT ON "SiteSettings" TO authenticated;
GRANT SELECT ON "VerificationToken" TO authenticated;
