-- Separate premium access from admin portal authentication.
-- Premium controls quota entitlement, while admin access is handled by admin_session JWT.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT FALSE;
