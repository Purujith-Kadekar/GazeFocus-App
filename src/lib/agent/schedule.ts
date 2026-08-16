// ============================================
// GazeFocus Agent — scheduling math
// ============================================
// Pure functions shared by the API routes and the client
// daemon. All timestamps are ISO strings; comparisons are
// done on epoch millis to avoid timezone drift.

export const HOUR_MS = 60 * 60 * 1000
export const DAY_MS = 24 * HOUR_MS

/** How often the "I will do it now" audit loop re-checks the user. */
export const AUDIT_INTERVAL_MS = 15 * 60 * 1000

/** Client polling cadence for due reminders. */
export const AGENT_POLL_INTERVAL_MS = 30 * 1000

/**
 * Dynamic interval compression (spec Feature 2, Scenario A).
 *
 * Time remaining before deadline -> deferral step:
 *   > 24h        -> remind again in 4 hours
 *   4h .. 24h    -> remind again in 1 hour
 *   < 4h         -> remind again in 30 minutes (imminent zone)
 *
 * Returns the next fire time as an epoch number.
 */
export function computeDeferralMs(deadlineIso: string | null, nowMs = Date.now()): number {
  const deadlineMs = deadlineIso ? Date.parse(deadlineIso) : NaN
  const timeRemaining = Number.isNaN(deadlineMs) ? -1 : deadlineMs - nowMs

  if (timeRemaining > DAY_MS) {
    return nowMs + 4 * HOUR_MS
  }
  if (timeRemaining >= 4 * HOUR_MS) {
    return nowMs + HOUR_MS
  }
  return nowMs + 30 * 60 * 1000
}

/** Convenience wrapper returning an ISO string. */
export function computeDeferralIso(deadlineIso: string | null, nowMs = Date.now()): string {
  return new Date(computeDeferralMs(deadlineIso, nowMs)).toISOString()
}

/**
 * First reminder for a freshly created deadline task:
 * give a heads-up proportional to how far out the deadline is.
 *   > 48h away -> fire 24h before the deadline
 *   4h..48h    -> fire 1h before the deadline
 *   < 4h       -> fire within 15 minutes
 */
export function computeInitialFireMs(deadlineIso: string, nowMs = Date.now()): number {
  const deadlineMs = Date.parse(deadlineIso)
  if (Number.isNaN(deadlineMs)) return nowMs + 15 * 60 * 1000

  const timeRemaining = deadlineMs - nowMs
  if (timeRemaining > 48 * HOUR_MS) {
    return Math.min(deadlineMs - DAY_MS, nowMs + 4 * HOUR_MS)
  }
  if (timeRemaining > 4 * HOUR_MS) {
    return deadlineMs - HOUR_MS
  }
  return nowMs + 15 * 60 * 1000
}

export function computeInitialFireIso(deadlineIso: string, nowMs = Date.now()): string {
  return new Date(computeInitialFireMs(deadlineIso, nowMs)).toISOString()
}

/** Minutes until an ISO timestamp (negative if past). */
export function minutesUntil(iso: string, nowMs = Date.now()): number {
  return Math.round((Date.parse(iso) - nowMs) / 60000)
}
