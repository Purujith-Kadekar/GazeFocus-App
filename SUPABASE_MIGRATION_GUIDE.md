# GazeFocus — Supabase Migration & Setup Guide

## Complete Production-Ready Guide

This document walks you through every step needed to properly set up, migrate, and maintain the GazeFocus Supabase database. Follow the sections in order.

---

## 1. Prerequisites

Before starting, ensure you have:

- A **Supabase project** created at [https://supabase.com](https://supabase.com)
- The **Supabase CLI** installed: `npm install -g supabase`
- Your project linked: `supabase link --project-ref <your-project-ref>`
- The following environment variables set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> ⚠️ **NEVER** commit `.env.local` to git. Use `.env.example` as a template.

---

## 2. Understanding the Migration Files

The project has **15 migration files** in `supabase/migrations/`. They must be applied **in order** (the filename prefix `001_` through `015_` ensures this).

| # | File | Purpose |
|---|------|---------|
| 001 | `add_channels.sql` | Creates Channel table + RLS policies |
| 002 | `watch_break_settings_and_rls.sql` | UserSettings table, RLS for all tables |
| 003 | `admin_password.sql` | SiteSettings table for admin config |
| 004 | `community_cache.sql` | ChannelCache for community data |
| 005 | `user_roles.sql` | Role-based access (user/admin) |
| 006 | `add_user_premium_flag.sql` | Premium subscription tracking |
| 007 | `channel_json_cache_and_tokens.sql` | JSON cache columns, auth tokens |
| 008 | `email_verification_security.sql` | Email verification with OTP hash + attempts tracking |
| 009 | `firebase_auth_provider.sql` | Firebase auth integration columns |
| 010 | `firebase_tokens.sql` | Firebase token storage |
| 011 | `add_isLive_to_videocache.sql` | Live stream detection columns |
| 012 | `add_performance_indexes.sql` | Critical indexes for dashboard/queries |
| 013 | `streak_atomicity.sql` | Atomic streak update RPC function |
| 014 | `security_hardening.sql` | RLS fixes, CASCADE deletes, revokes excessive grants |
| 015 | `library_items_unique_constraint.sql` | Unique constraint for LibraryItem upserts |

---

## 3. Running Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Link your project (if not already linked)
supabase link --project-ref <your-project-ref>

# Push all pending migrations to Supabase
supabase db push

# Verify migrations were applied
supabase db diff --use-migra
```

### Option B: Using the Supabase Dashboard SQL Editor

If you prefer to run migrations manually:

1. Go to **Supabase Dashboard → SQL Editor**
2. Open each migration file from `supabase/migrations/` **in order** (001 → 015)
3. Paste the SQL and click **Run**
4. After each migration, verify in **Table Editor** that the expected changes occurred

### Option C: Using the Supabase Management API

For automated deployments:

```bash
# Generate a migration diff
supabase db diff --use-migra -f new_changes

# Apply via management API
supabase db push
```

---

## 4. Critical Security Configuration

### 4.1 RLS (Row Level Security) Policies

After migration 014, your RLS policies are properly configured. Here's the security model:

| Table | anon role | authenticated role | Service role |
|-------|-----------|--------------------|--------------|
| User | No access | Own data only | Full access |
| Video | No access | Own data only | Full access |
| Playlist | No access | Own data only | Full access |
| Note | No access | Own data only | Full access |
| VideoProgress | No access | Own data only | Full access |
| LibraryItem | No access | Own data only | Full access |
| Folder | No access | Own data only | Full access |
| Channel | SELECT only | Own data only | Full access |
| SiteSettings | No access | SELECT only | Full access |
| VerificationToken | SELECT only | SELECT only | Full access |

> ⚠️ **The app currently uses the service role key (`SUPABASE_SERVICE_ROLE_KEY`) for all database operations**, which bypasses RLS entirely. This is intentional for now — the API routes enforce ownership checks via `getCurrentUser()` and `.eq('userId', user.id)` filters. In the future, you may want to switch client-side operations to use the anon key with per-request user context for stricter security.

### 4.2 Admin Portal Security

- Admin routes are **local-only** (accessible only from `localhost`/`127.0.0.1`)
- Admin auth uses JWT tokens with `ADMIN_SECRET` or `NEXTAUTH_SECRET`
- Password hashing uses bcrypt (12 rounds) for stored admin passwords
- Constant-time string comparison prevents timing attacks

### 4.3 OTP Email Verification Security

- OTP codes are hashed with **per-verification random salt** (sha256)
- Hash format: `saltHex:hashHex` — prevents rainbow table attacks
- Constant-time comparison using `Buffer.equals()` prevents timing attacks
- Max 5 verification attempts before lockout
- OTP expires after 10 minutes (configurable via `EMAIL_OTP_EXPIRY_MINUTES`)
- Resend cooldown: 60 seconds (configurable via `EMAIL_OTP_RESEND_COOLDOWN_SECONDS`)

---

## 5. Database Schema Overview

### Key Tables and Relationships

```
User (id: UUID)
  ├── Video (userId → User.id, playlistId → Playlist.id ON DELETE CASCADE)
  ├── Playlist (userId → User.id)
  │    └── Video (playlistId → Playlist.id ON DELETE CASCADE)
  ├── VideoProgress (userId → User.id, youtubeId: text)
  ├── Note (userId → User.id, youtubeId: text)
  ├── Folder (userId → User.id)
  ├── LibraryItem (userId → User.id, UNIQUE(userId, type, externalId))
  ├── PlaylistMark (userId → User.id, youtubeId: text)
  ├── UserSettings (userId → User.id)
  └── ChannelCache (userId → User.id)

Channel (id: UUID)
  ├── Video (channelId → Channel.id ON DELETE SET NULL)
  └── ChannelCache (channelId → Channel.id)

SiteSettings (id: 'global' singleton)
```

### Important Cascade Rules

- **Playlist → Video**: `ON DELETE CASCADE` — deleting a playlist automatically deletes all its videos
- **Channel → Video**: `ON DELETE SET NULL` — deleting a channel keeps videos but sets `channelId` to null
- **Video → VideoProgress, Note, LibraryItem**: Manual cascade in API code (not DB-level FK, since these reference `youtubeId` not `id`)

---

## 6. RPC Functions

Two atomic RPC functions exist for race-free operations:

### `increment_weekly_videos_watched(p_user_id TEXT) → INTEGER`

Called when a video is first completed. Atomically:
1. Checks if the week has rolled over (compares `lastWeeklyReset` against current Monday in UTC)
2. If new week: resets counter to 1, updates `lastWeeklyReset`
3. If same week: increments counter by 1

### `update_user_activity_and_streak(p_user_id TEXT, p_current_timestamp TIMESTAMPTZ) → JSON`

Called on user activity (video watch, page visit). Atomically:
1. Calculates days since last activity
2. If first activity ever: sets streak to 1
3. If active yesterday: increments streak
4. If gap > 1 day: resets streak to 1
5. Updates `longestStreak` if current streak exceeds it
6. Returns updated streak data as JSON

---

## 7. Applying Migrations to an Existing Database

If you already have a Supabase database with data from an earlier version of GazeFocus:

### Step 1: Check Current State

```bash
# View current tables and columns
supabase db diff --use-migra

# Or check in the Dashboard → Table Editor
```

### Step 2: Apply Migrations Incrementally

**For a fresh database:**
```bash
supabase db push  # Applies ALL migrations at once
```

**For an existing database that may have some migrations already applied:**

1. Check which migrations have been applied by looking at the `_prisma_migrations` table (if it exists, migration 014 will remove it)
2. Run each **missing** migration manually in the SQL Editor
3. Start with migration 014 (security hardening) if you haven't applied it — it's the most critical

### Step 3: Verify After Each Migration

After applying critical migrations (014 and 015), verify:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check CASCADE constraint on Video → Playlist
SELECT conname, contype, confdeltype 
FROM pg_constraint 
WHERE conrelid = 'public."Video"'::regclass AND contype = 'f';

-- Check unique constraint on LibraryItem
SELECT conname FROM pg_constraint 
WHERE conrelid = 'public."LibraryItem"'::regclass AND contype = 'u';

-- Check indexes exist
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';

-- Check RPC functions exist
SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%weekly%' OR proname LIKE '%streak%';
```

### Step 4: Verify `totalVideos` Column

Migration 014 adds `totalVideos` to Playlist. Check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Playlist' AND column_name = 'totalVideos';
```

---

## 8. Seed Data (Development Only)

The `/api/seed` endpoint creates test data for development. It's **disabled in production** (checks `NODE_ENV === 'production'`).

```bash
# In development, seed your database:
curl -X POST http://localhost:3000/api/seed \
  -H "Cookie: next-auth.session-token=<your-session-token>"
```

---

## 9. Common Issues and Solutions

### Issue: "relation 'PlaylistMark' does not exist"

The `PlaylistMark` table must exist for playlist completion tracking. If you see this error, the initial schema setup didn't include it. Create it:

```sql
CREATE TABLE IF NOT EXISTS "PlaylistMark" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "youtubeId" TEXT NOT NULL,
  finished BOOLEAN NOT NULL DEFAULT false,
  "finishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "youtubeId")
);
```

### Issue: "duplicate key value violates unique constraint"

This can happen if you had duplicate data before applying migration 015. The migration includes a cleanup step that deletes duplicates, keeping the newest row.

### Issue: "RPC function not found"

If `increment_weekly_videos_watched` or `update_user_activity_and_streak` aren't found, the progress and activity routes have fallback logic that does manual increments. Apply migrations 013 and 014 to create these functions.

### Issue: "RLS policy blocks operations"

If you switch from service role key to anon key, you'll need RLS policies. Migration 002 sets up the policies, and migration 014 hardens them. The app currently uses the service role key which bypasses RLS — this is safe as long as the API routes properly filter by `userId`.

---

## 10. Environment Variables Checklist

Ensure all these are set in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# NextAuth
NEXTAUTH_SECRET=<random-secret-at-least-32-chars>
NEXTAUTH_URL=http://localhost:3000  # or your production URL

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
AUTH_GOOGLE_ID=<same-as-GOOGLE_CLIENT_ID>
AUTH_GOOGLE_SECRET=<same-as-GOOGLE_CLIENT_SECRET>

# YouTube
YOUTUBE_API_KEY=<from-google-console>

# Admin
ADMIN_USERNAME=<your-admin-username>
ADMIN_PASSWORD=<your-admin-password-min-8-chars>
# Optional: ADMIN_SECRET=<dedicated-admin-jwt-secret>

# Email OTP Verification
EMAIL_VERIFICATION_SECRET=<random-secret-or-use-NEXTAUTH_SECRET>
EMAIL_OTP_LENGTH=6
EMAIL_OTP_EXPIRY_MINUTES=10
EMAIL_OTP_RESEND_COOLDOWN_SECONDS=60
EMAIL_OTP_MAX_ATTEMPTS=5

# SMTP (for email verification)
SMTP_HOST=<smtp-server>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-username>
SMTP_PASS=<smtp-password>
SMTP_FROM=<from-email-address>

# Firebase (optional, for mobile auth)
NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<measurement-id>
AUTH_FIREBASE_ID=<firebase-web-client-id>
AUTH_FIREBASE_SECRET=<firebase-web-client-secret>
FIREBASE_SERVICE_ACCOUNT_JSON=<json-string-of-service-account>
```

---

## 11. Production Deployment Checklist

Before deploying to production:

1. ✅ Apply all 15 migrations to your Supabase database
2. ✅ Set all required environment variables in your hosting platform
3. ✅ Set `NODE_ENV=production` (this disables seed and debug endpoints)
4. ✅ Verify RLS policies are enabled (`SELECT tablename, rowsecurity FROM pg_tables`)
5. ✅ Verify CASCADE constraints exist on Video → Playlist FK
6. ✅ Verify unique constraints on LibraryItem and VideoProgress
7. ✅ Verify RPC functions exist (`increment_weekly_videos_watched`, `update_user_activity_and_streak`)
8. ✅ Remove or restrict the `/api/auth/debug` endpoint (it's already gated by `NODE_ENV !== 'production'`)
9. ✅ Test playlist import with a real YouTube playlist (Invidious → Piped → YouTube API fallback)
10. ✅ Test playlist sync (RSS → Invidious/Piped → YouTube API fallback)
11. ✅ Verify admin portal is accessible only from localhost
12. ✅ Set up SMTP for email verification
13. ✅ Test user signup + email verification flow
14. ✅ Test eye tracking (GazeEngine + MediaPipe Face Landmarker)
15. ✅ Run `npm run build` and verify no TypeScript compilation errors

---

## 12. Monitoring & Maintenance

### Daily Tasks
- Check Supabase logs for errors: Dashboard → Logs
- Monitor YouTube API quota usage (free tier: 10,000 units/day)
- The QuotaEngine automatically tracks and manages quota

### Weekly Tasks  
- Review user activity patterns (streak data, weeklyVideosWatched)
- Check for orphaned data (videos without playlists, notes without videos)

### Monthly Tasks
- Update Invidious/Piped instance lists in `src/lib/youtube/alt-sources.ts` (instances can go down)
- Review and update RLS policies if new features are added
- Regenerate Supabase types if schema changes: `supabase gen types typescript --linked > src/types/supabase.ts`

---

## 13. Regenerating TypeScript Types

After any schema change (migration, manual column addition, etc.), regenerate the Supabase TypeScript types:

```bash
# Generate types from your linked Supabase project
supabase gen types typescript --linked > src/types/supabase.ts

# Or generate from a local database
supabase gen types typescript --local > src/types/supabase.ts
```

This ensures the `Database` type in `src/types/supabase.ts` matches your actual database schema, reducing `as any` casts.

---

## 14. Backup Strategy

Supabase provides automatic daily backups for paid plans. For the free tier:

```bash
# Manual backup via pg_dump
pg_dump "postgresql://<user>:<pass>@<host>:5432/postgres" > backup.sql

# Or use Supabase CLI
supabase db dump -f backup.sql
```

The project also includes historical backups in `backups/database/monthly-snapshot-2026-03/`.

---

*This guide covers everything needed to set up and maintain your GazeFocus Supabase database. If you encounter issues not covered here, check the Supabase documentation at [https://supabase.com/docs](https://supabase.com/docs).*
