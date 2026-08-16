// ============================================
// GazeFocus Agent — email delivery channel
// ============================================
// Digest email sent by the cron endpoint when deadline
// reminders come due while the user isn't looking at the
// app. Reuses the existing nodemailer SMTP transport.

import nodemailer from 'nodemailer'
import type { DueReminder } from '@/types'

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
const smtpPort = Number(process.env.SMTP_PORT || 465)
const smtpSecure = (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true'
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFrom = process.env.SMTP_FROM || smtpUser

function getTransporter() {
  if (!smtpUser || !smtpPass || !smtpFrom) return null
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  })
}

function urgencyLabel(deadlineAt: string | null, now = Date.now()): string {
  if (!deadlineAt) return 'scheduled'
  const remaining = Date.parse(deadlineAt) - now
  if (remaining < 0) return 'OVERDUE'
  if (remaining < 4 * 60 * 60 * 1000) return 'urgent — under 4 hours left'
  if (remaining < 24 * 60 * 60 * 1000) return 'today'
  return `${Math.floor(remaining / (24 * 60 * 60 * 1000))} days left`
}

function formatDeadline(deadlineAt: string | null): string {
  if (!deadlineAt) return ''
  return new Date(deadlineAt).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export interface AgentEmailResult {
  sent: boolean
  skipped?: 'smtp-not-configured' | 'no-recipient'
}

/**
 * Send one digest email per user covering every due reminder.
 * Failures return { sent: false } so the caller leaves
 * emailSentAt NULL and retries on the next cron run.
 */
export async function sendAgentDigestEmail(
  to: string,
  name: string | null | undefined,
  reminders: DueReminder[]
): Promise<AgentEmailResult> {
  if (!to) return { sent: false, skipped: 'no-recipient' }

  const transporter = getTransporter()
  if (!transporter) {
    console.warn('[Agent] SMTP env vars are missing; reminder email skipped')
    return { sent: false, skipped: 'smtp-not-configured' }
  }

  const displayName = name?.trim() || to.split('@')[0] || 'there'
  const now = Date.now()

  const rows = reminders
    .map((r) => {
      const urgency = urgencyLabel(r.deadlineAt, now)
      const when = formatDeadline(r.deadlineAt)
      const color = urgency === 'OVERDUE' ? '#dc2626' : urgency.startsWith('urgent') ? '#ea580c' : '#6b7280'
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">
            <div style="font-weight:600;font-size:15px;color:#111827">${escapeHtml(r.title)}</div>
            <div style="font-size:13px;color:${color};margin-top:2px">
              ${r.kind === 'AUDIT' ? 'Focus check-in — ' : ''}${escapeHtml(urgency)}
              ${when ? ` &middot; due ${escapeHtml(when)}` : ''}
            </div>
          </td>
        </tr>`
    })
    .join('')

  const overdueCount = reminders.filter(
    (r) => r.deadlineAt && Date.parse(r.deadlineAt) < now
  ).length

  const subject =
    overdueCount > 0
      ? `⏰ GazeFocus: ${overdueCount} overdue + ${reminders.length - overdueCount} needing attention`
      : `⏰ GazeFocus: ${reminders.length} task${reminders.length > 1 ? 's' : ''} needing your attention`

  const text = reminders
    .map((r) => `- ${r.title} (${urgencyLabel(r.deadlineAt, now)})`)
    .join('\n')

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      text: `Hi ${displayName},\n\nYour GazeFocus agent has ${reminders.length} reminder${reminders.length > 1 ? 's' : ''}:\n\n${text}\n\nOpen GazeFocus to act on them (start now, snooze, or complete).\n\n- GazeFocus Agent`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:560px">
          <h2 style="margin-bottom:4px">Your GazeFocus agent needs you</h2>
          <p style="margin-top:0;color:#6b7280">Hi ${escapeHtml(displayName)}, these came due while you were away:</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px">${rows}</table>
          <p style="margin-top:16px">
            <a href="${process.env.NEXTAUTH_URL || 'https://gazefocus.app'}/dashboard"
               style="background:#D4870A;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Open GazeFocus
            </a>
          </p>
          <p style="font-size:12px;color:#9ca3af;margin-top:16px">
            You're getting this because deadline alerts fire while the app is closed.
            Open the app to snooze, start, or complete tasks.
          </p>
        </div>`,
    })
    return { sent: true }
  } catch (error) {
    console.error('[Agent] Failed to send reminder email:', error)
    return { sent: false }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
