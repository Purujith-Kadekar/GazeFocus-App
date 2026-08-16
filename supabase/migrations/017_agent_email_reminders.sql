-- ============================================
-- Migration 017: Agent email reminder delivery
-- ============================================
-- Adds email as a second delivery channel for the proactive
-- scheduling agent. The cron endpoint scans for PENDING
-- reminders whose fire time has passed and which have not
-- been emailed yet (emailSentAt IS NULL), sends each user a
-- single digest email, then stamps emailSentAt.
--
-- The reminder stays PENDING for the in-app daemon so the
-- interactive AgentInbox dialog still claims it later — email
-- is the attention hook, the dialog is the action surface.
-- ============================================

ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMPTZ;

-- Partial index for the cron scan: overdue, un-emailed rows only.
CREATE INDEX IF NOT EXISTS "Reminder_email_pending_idx"
  ON "Reminder"("fireAt")
  WHERE "status" = 'PENDING' AND "emailSentAt" IS NULL;
