-- Run on BOTH source and target DB and compare outputs.

-- 1) Total rows by table (public schema)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2) Prisma migration history
SELECT migration_name, finished_at, rolled_back_at
FROM "_prisma_migrations"
ORDER BY finished_at;

-- 3) Core business sanity samples
SELECT COUNT(*) AS users FROM "User";
SELECT COUNT(*) AS folders FROM "Folder";
SELECT COUNT(*) AS notes FROM "Note";
SELECT COUNT(*) AS videos FROM "Video";
SELECT COUNT(*) AS playlists FROM "Playlist";

-- 4) Most recent updates (ensure latest activity migrated)
SELECT MAX("updatedAt") AS latest_user_update FROM "User";
SELECT MAX("updatedAt") AS latest_note_update FROM "Note";
SELECT MAX("updatedAt") AS latest_video_update FROM "Video";
SELECT MAX("updatedAt") AS latest_playlist_update FROM "Playlist";

-- 5) Constraint sanity checks (should return 0)
SELECT COUNT(*) AS orphan_folders
FROM "Folder" f
LEFT JOIN "User" u ON f."userId" = u.id
WHERE u.id IS NULL;

SELECT COUNT(*) AS orphan_notes
FROM "Note" n
LEFT JOIN "User" u ON n."userId" = u.id
WHERE u.id IS NULL;

SELECT COUNT(*) AS orphan_videos
FROM "Video" v
LEFT JOIN "User" u ON v."userId" = u.id
WHERE u.id IS NULL;
