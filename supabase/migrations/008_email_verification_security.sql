-- Email verification hardening for credentials auth.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "authProvider" TEXT NOT NULL DEFAULT 'credentials';

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "verificationCodeHash" TEXT;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "verificationCodeExpiresAt" TIMESTAMPTZ;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "verificationCodeAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "verificationCodeSentAt" TIMESTAMPTZ;

UPDATE "User"
SET "authProvider" = CASE
  WHEN "passwordHash" IS NULL THEN 'google'
  ELSE 'credentials'
END
WHERE "authProvider" IS NULL OR "authProvider" = '';

DO $$
DECLARE
  email_verified_type TEXT;
BEGIN
  SELECT data_type
  INTO email_verified_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'User'
    AND column_name = 'emailVerified';

  IF email_verified_type = 'boolean' THEN
    EXECUTE 'UPDATE "User" SET "emailVerified" = TRUE WHERE "emailVerified" IS NULL';
  ELSE
    EXECUTE 'UPDATE "User" SET "emailVerified" = NOW() WHERE "emailVerified" IS NULL';
  END IF;
END
$$;
