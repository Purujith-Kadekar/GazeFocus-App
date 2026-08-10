import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Rate limiting — simple in-memory store (resets on cold start, good enough for a personal app)
const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX      = 3    // max submissions
const RATE_LIMIT_WINDOW   = 60 * 60 * 1000  // per hour (ms)

function checkRateLimit(ip: string): boolean {
  const now  = Date.now()
  const entry = rateLimit.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

/**
 * Sanitize user input for safe insertion into HTML email templates.
 * Prevents XSS by escaping HTML special characters.
 */
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit by IP ──────────────────────────────────────────────────
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before submitting again.' },
        { status: 429 }
      )
    }

    // ── Parse & validate body ─────────────────────────────────────────────
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const { name, email, subject, message } = body as {
      name?: string
      email?: string
      subject?: string
      message?: string
    }

    if (!name?.trim())    return NextResponse.json({ error: 'Name is required.'    }, { status: 400 })
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }

    // ── Env vars ──────────────────────────────────────────────────────────
    const SMTP_SERVER     = process.env.SMTP_SERVER
    const SMTP_PORT       = Number(process.env.SMTP_PORT ?? '465')
    const SENDER_EMAIL    = process.env.SENDER_EMAIL
    const SENDER_PASSWORD = process.env.SENDER_PASSWORD
    const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL

    if (!SMTP_SERVER || !SENDER_EMAIL || !SENDER_PASSWORD || !RECIPIENT_EMAIL) {
      console.error('[contact] Missing SMTP env vars')
      return NextResponse.json({ error: 'Mail service is not configured.' }, { status: 500 })
    }

    // ── Nodemailer transporter ────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      host:   SMTP_SERVER,
      port:   SMTP_PORT,
      secure: SMTP_PORT === 465,   // true for 465, false for 587
      auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASSWORD,
      },
    })

    const submittedAt = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    // ── Sanitize all user input for XSS prevention ────────────────────────
    const safeName    = sanitizeHtml(name.trim())
    const safeEmail   = sanitizeHtml(email.trim())
    const safeSubject = sanitizeHtml((subject ?? '—').trim())
    const safeMessage = sanitizeHtml(message.trim())

    // ── Plain text fallback ───────────────────────────────────────────────
    const textBody = `
New contact form submission from your Linktree

Name:      ${name.trim()}
Email:     ${email.trim()}
Subject:   ${subject?.trim() || '—'}
Time:      ${submittedAt} IST

Message:
${message.trim()}
    `.trim()

    // ── HTML email (with sanitized user input) ────────────────────────────
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060A14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060A14;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#0D1B2E;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8892B0;font-family:'Courier New',monospace;">— new message</p>
            <h1 style="margin:0;font-size:22px;color:#E6F1FF;font-weight:600;">Someone reached out ✦</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#8892B0;">${submittedAt} IST · via Linktree contact form</p>
          </td>
        </tr>

        <!-- Fields -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <tr>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);width:90px;vertical-align:top;">
                  <span style="font-size:11px;font-family:'Courier New',monospace;letter-spacing:0.08em;color:#8892B0;text-transform:uppercase;">Name</span>
                </td>
                <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:top;">
                  <span style="font-size:14px;color:#E6F1FF;">${safeName}</span>
                </td>
              </tr>

              <tr>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:top;">
                  <span style="font-size:11px;font-family:'Courier New',monospace;letter-spacing:0.08em;color:#8892B0;text-transform:uppercase;">Email</span>
                </td>
                <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:top;">
                  <a href="mailto:${encodeURIComponent(email.trim())}" style="font-size:14px;color:#4FACFE;text-decoration:none;">${safeEmail}</a>
                </td>
              </tr>

              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <span style="font-size:11px;font-family:'Courier New',monospace;letter-spacing:0.08em;color:#8892B0;text-transform:uppercase;">Subject</span>
                </td>
                <td style="padding:10px 0 10px 16px;vertical-align:top;">
                  <span style="font-size:14px;color:#E6F1FF;">${safeSubject}</span>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding:20px 32px 0;">
            <p style="margin:0 0 10px;font-size:11px;font-family:'Courier New',monospace;letter-spacing:0.08em;color:#8892B0;text-transform:uppercase;">Message</p>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 20px;">
              <p style="margin:0;font-size:14px;color:#CCD6F6;line-height:1.75;white-space:pre-wrap;">${safeMessage}</p>
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:28px 32px 32px;text-align:center;">
            <a href="mailto:${encodeURIComponent(email.trim())}?subject=Re: ${encodeURIComponent(subject?.trim() || 'Your message')}"
               style="display:inline-block;background:#4FACFE;color:#060A14;text-decoration:none;padding:13px 32px;border-radius:9999px;font-size:14px;font-weight:700;letter-spacing:0.02em;">
              Reply to ${safeName} →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:11px;color:#8892B0;font-family:'Courier New',monospace;">
              Sent via gaze-focus.vercel.app · Purujith Kadekar
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim()

    // ── Send ──────────────────────────────────────────────────────────────
    await transporter.sendMail({
      from:     `"Linktree Contact" <${SENDER_EMAIL}>`,
      to:       RECIPIENT_EMAIL,
      replyTo:  email.trim(),
      subject:  `[Linktree] ${subject?.trim() || 'New message'} — from ${name.trim()}`,
      text:     textBody,
      html:     htmlBody,
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error('[contact] Failed to send email:', err)
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    )
  }
}

// Block all other methods
export async function GET()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
export async function PUT()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
export async function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
