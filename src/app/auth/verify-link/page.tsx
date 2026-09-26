'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { 
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth'
import { auth as firebaseAuth } from '@/lib/firebase'

export default function VerifyLinkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyLink = async () => {
      const email = searchParams.get('email')
      
      if (!email) {
        setError('Invalid link. No email provided.')
        setIsLoading(false)
        return
      }

      if (!isSignInWithEmailLink(firebaseAuth, window.location.href)) {
        setError('Invalid sign-in link.')
        setIsLoading(false)
        return
      }

      try {
        const result = await signInWithEmailLink(firebaseAuth, email, window.location.href)
        const idToken = await result.user.getIdToken()
        
        
        const signInResult = await signIn('firebase', {
          idToken,
          redirect: false,
        })
        
        
        if (signInResult?.error) {
          console.error('[VerifyLink] NextAuth error:', signInResult.error)
          setError('Authentication failed: ' + signInResult.error)
        } else {
          window.location.href = '/dashboard'
        }
      } catch (err) {
        console.error('Email link verify error:', err)
        setError(err instanceof Error && err.message ? err.message : 'Failed to verify link')
      } finally {
        setIsLoading(false)
      }
    }

    verifyLink()
  }, [searchParams, router])

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: '#0C0A07' }}>
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.022,
      }} />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0" style={{
        width: 700, height: 500,
        background: 'radial-gradient(ellipse at top, rgba(212,135,10,0.055) 0%, transparent 68%)',
      }} />

      <motion.div
        className="absolute top-6 left-6 z-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/auth/login"
          className="flex items-center gap-2 transition-colors group"
          style={{ color: '#B8A888' }}
        >
          <div className="flex items-center justify-center w-9 h-9 border transition-all" 
            style={{ borderColor: 'rgba(212,135,10,0.1)', backgroundColor: 'rgba(255,255,255,0.018)' }}>
            <ArrowLeft className="h-4 w-4" style={{ color: '#B8A888' }} />
          </div>
          <span className="text-sm font-medium" style={{ fontFamily: 'Fira Mono, monospace' }}>Back</span>
        </Link>
      </motion.div>

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="relative border overflow-hidden" 
          style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', borderRadius: 0 }}>
          <div className="absolute top-0 left-0 right-0 h-px" 
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,135,10,0.3), transparent)' }} />

          <div className="p-8">
            <div className="flex justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Logo size={56} style={{ filter: 'drop-shadow(0 0 12px rgba(212,135,10,0.45))' }} />
              </motion.div>
            </div>

            {isLoading ? (
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 mx-auto mb-4"
                >
                  <Loader2 className="h-12 w-12" style={{ color: '#D4870A' }} />
                </motion.div>
                <p style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace' }}>Verifying your link...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '50%' }}>
                  <Mail className="h-8 w-8" style={{ color: '#EF4444' }} />
                </div>
                <p className="text-lg font-medium mb-2" style={{ color: '#EF4444', fontFamily: 'Fira Mono, monospace' }}>Verification Failed</p>
                <p className="text-sm mb-6" style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace' }}>
                  {error}
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block px-6 py-2 font-medium transition-all"
                  style={{ 
                    background: '#D4870A', 
                    color: '#0C0A07', 
                    fontFamily: 'Fira Mono, monospace' 
                  }}
                >
                  Back to Login
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  )
}