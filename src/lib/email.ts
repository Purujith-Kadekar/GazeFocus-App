import nodemailer from 'nodemailer'

type SendWelcomeEmailInput = {
  to: string
  name?: string | null
}

type SendVerificationOtpEmailInput = {
  to: string
  name?: string | null
  code: string
  expiresInMinutes: number
}

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
const smtpPort = Number(process.env.SMTP_PORT || 465)
const smtpSecure = (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true'
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFrom = process.env.SMTP_FROM || smtpUser

function getTransporter() {
  if (!smtpUser || !smtpPass || !smtpFrom) {
    return null
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
}

export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('[Email] SMTP env vars are missing; welcome email was skipped')
    return false
  }

  const displayName = input.name?.trim() || input.to.split('@')[0] || 'there'
  const appName = 'GazeFocus'

  await transporter.sendMail({
    from: smtpFrom,
    to: input.to,
    subject: `Welcome to ${appName}`,
    text: `Hi ${displayName},\n\nWelcome to ${appName}. Your account has been created successfully.\n\nYou can now log in and start your focus sessions.\n\n- ${appName} Team`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111"><h2>Welcome to ${appName}</h2><p>Hi ${displayName},</p><p>Your account has been created successfully.</p><p>You can now log in and start your focus sessions.</p><p style="margin-top:20px">- ${appName} Team</p></div>`,
  })

  return true
}

export async function sendVerificationOtpEmail(input: SendVerificationOtpEmailInput): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('[Email] SMTP env vars are missing; verification email was skipped')
    return false
  }

  const displayName = input.name?.trim() || input.to.split('@')[0] || 'there'
  const appName = 'GazeFocus'

  await transporter.sendMail({
    from: smtpFrom,
    to: input.to,
    subject: `Verify your ${appName} account`,
    text: `Hi ${displayName},\n\nYour verification code is: ${input.code}\n\nThis code expires in ${input.expiresInMinutes} minutes.\n\nIf you did not request this, you can ignore this email.\n\n- ${appName} Team`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111"><h2>Verify your ${appName} account</h2><p>Hi ${displayName},</p><p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">${input.code}</p><p>This code expires in ${input.expiresInMinutes} minutes.</p><p>If you did not request this, you can ignore this email.</p><p style="margin-top:20px">- ${appName} Team</p></div>`,
  })

  return true
}
