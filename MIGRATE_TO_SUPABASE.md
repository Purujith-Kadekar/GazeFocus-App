# Prisma Postgres -> Supabase Postgres Migration (Safe Cutover)

## Prerequisites

- PostgreSQL client tools installed and in PATH:
  - `pg_dump`
  - `pg_restore`
  - `psql`
- Supabase project created.
- Supabase direct Postgres connection string available from:
  - Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI (direct)

## Required env values

- Source DB URL (your current Prisma-hosted Postgres): `DATABASE_URL`
- Target DB URL (Supabase direct URI): `SUPABASE_DIRECT_URL`

Do not use pooler URL for restore.

## Zero-loss strategy

1. Put app in maintenance/read-only mode for a short window.
2. Run migration script (backup + restore + row-count verification).
3. Run Prisma migration checks on Supabase.
4. Update app `DATABASE_URL` to Supabase pooled URL for runtime.
5. Keep old DB untouched for rollback window.

## Run migration script (PowerShell)

```powershell
./scripts/db-migrate-prisma-to-supabase.ps1 `
  -SourceDbUrl "$env:DATABASE_URL" `
  -TargetDbUrl "<SUPABASE_DIRECT_URL>"
```

You can also pass the template URL and enter password securely when prompted:

```powershell
./scripts/db-migrate-prisma-to-supabase.ps1 `
  -SourceDbUrl "$env:DATABASE_URL" `
  -TargetDbUrl "postgresql://postgres:[YOUR-PASSWORD]@db.cdjzqayribgfsekveeks.supabase.co:5432/postgres"
```

## Prisma validation after restore

```powershell
$env:DATABASE_URL="<SUPABASE_DIRECT_URL>"
npx prisma migrate status
npx prisma migrate deploy
```

## Optional SQL sanity checks

Run `scripts/sql/post-migration-checks.sql` on both source and target DB and compare output.

## Cutover

- Runtime (app): use Supabase pooled URL in `DATABASE_URL`.
- Keep a separate `DIRECT_URL` env for Prisma migration commands.

## Rollback

If anything looks wrong:
- Revert `DATABASE_URL` to old Prisma Postgres URL.
- Keep Supabase DB for investigation.
