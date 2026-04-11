'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function VerifyEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams])
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsVerifying(true)

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      setMessage('Email verified successfully. You can now sign in.')
      setTimeout(() => {
        router.push('/auth/login?verified=1')
      }, 800)
    } catch (verifyError) {
      console.error('Verification failed:', verifyError)
      setError('Something went wrong while verifying your email')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')
    setIsResending(true)

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not resend code')
        return
      }

      setMessage('A new verification code has been sent to your email.')
    } catch (resendError) {
      console.error('Resend failed:', resendError)
      setError('Something went wrong while resending the code')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0C0A07' }}>
      <div className="w-full max-w-md border p-6" style={{ borderColor: 'rgba(212,135,10,0.1)', background: 'rgba(255,255,255,0.018)' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F2EDE4' }}>Verify Your Email</h1>
        <p className="text-sm mb-5" style={{ color: '#DDD0B8' }}>
          Enter the verification code sent to your email address.
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', color: '#F2EDE4' }}
          />
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', color: '#F2EDE4', letterSpacing: '4px' }}
          />

          {error ? <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p> : null}
          {message ? <p className="text-sm" style={{ color: '#22C55E' }}>{message}</p> : null}

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify Email
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="w-full mt-3"
          onClick={handleResend}
          disabled={isResending}
          style={{ borderColor: 'rgba(212,135,10,0.1)', color: '#DDD0B8' }}
        >
          {isResending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Resend Code
        </Button>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}
