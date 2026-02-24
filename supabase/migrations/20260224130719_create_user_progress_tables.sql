/*
  # Create User Progress Tracking Tables

  1. New Tables
    - `profiles` - User profile information linked to Supabase auth
    - `user_folders` - Folder structure for organizing playlists
    - `user_playlists` - Custom playlists created by users
    - `playlist_videos` - Videos in user's playlists
    - `watch_progress` - Track progress for each video watched
    - `playlist_progress` - Overall progress per playlist

  2. Security
    - Enable RLS on all tables
    - All tables are scoped to authenticated user
    - Users can only access their own data

  3. Important Notes
    - Timestamps use CURRENT_TIMESTAMP for automatic tracking
    - watch_progress records when a user last watched a video
    - playlist_progress tracks completion percentage
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS user_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own folders"
  ON user_folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create folders"
  ON user_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON user_folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON user_folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES user_folders(id) ON DELETE SET NULL,
  youtube_id text,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  video_count integer DEFAULT 0,
  is_custom boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own playlists"
  ON user_playlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create playlists"
  ON user_playlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
  ON user_playlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
  ON user_playlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS playlist_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES user_playlists(id) ON DELETE CASCADE,
  youtube_video_id text NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  duration_seconds integer,
  position integer,
  added_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read playlist videos"
  ON playlist_videos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_playlists
      WHERE user_playlists.id = playlist_videos.playlist_id
      AND user_playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add videos to own playlists"
  ON playlist_videos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_playlists
      WHERE user_playlists.id = playlist_videos.playlist_id
      AND user_playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete videos from own playlists"
  ON playlist_videos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_playlists
      WHERE user_playlists.id = playlist_videos.playlist_id
      AND user_playlists.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL REFERENCES user_playlists(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES playlist_videos(id) ON DELETE CASCADE,
  youtube_video_id text NOT NULL,
  watched_seconds integer DEFAULT 0,
  total_seconds integer,
  completion_percent integer DEFAULT 0,
  last_watched_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, video_id)
);

ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own watch progress"
  ON watch_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert watch progress"
  ON watch_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch progress"
  ON watch_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS playlist_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL REFERENCES user_playlists(id) ON DELETE CASCADE,
  total_videos integer DEFAULT 0,
  watched_videos integer DEFAULT 0,
  completion_percent integer DEFAULT 0,
  total_watch_time_seconds integer DEFAULT 0,
  last_updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, playlist_id)
);

ALTER TABLE playlist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own playlist progress"
  ON playlist_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert playlist progress"
  ON playlist_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlist progress"
  ON playlist_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_folders_user_id ON user_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_user_id ON user_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_folder_id ON user_playlists(folder_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist_id ON playlist_videos(playlist_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_user_id ON watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_playlist_id ON watch_progress(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_progress_user_id ON playlist_progress(user_id);
