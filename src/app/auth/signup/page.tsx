'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/layout/Logo'
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendSignInLinkToEmail
} from 'firebase/auth'
import { auth as firebaseAuth } from '@/lib/firebase'
import { db } from '@/lib/db'



export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailLinkMode, setEmailLinkMode] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [checkLoading, setCheckLoading] = useState(true)

  useEffect(() => {
    const checkSignupStatus = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          setSignupEnabled(data.signupEnabled !== false)
        }
      } catch {
        setSignupEnabled(true)
      } finally {
        setCheckLoading(false)
      }
    }
    checkSignupStatus()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()

      console.log('[Signup] API Response:', { status: res.status, data })

      if (!res.ok) {
        const errorMsg = data.error || 'Failed to create account'
        console.error('[Signup] Error:', errorMsg)
        setError(errorMsg)
        return
      }

      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
      router.refresh()
    } catch (err) {
      console.error('[Signup] Exception:', err)
      setError('Something went wrong: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLinkSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (name.trim().length < 1) {
      setError('Please enter your name')
      return
    }
    
    setIsLoading(true)
    
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/verify-link?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
      }
      
      await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings)
      setLinkSent(true)
    } catch (err: any) {
      console.error('Email link error:', err)
      setError(err.message || 'Failed to send link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(firebaseAuth, provider)
      const idToken = await result.user.getIdToken()
      
      const user = result.user
      const email = (user.email || '').toLowerCase()
      
      if (email) {
        try {
          let existingUser: any = null
          try {
            const userRes = await fetch(`/api/user/check?email=${encodeURIComponent(email)}`)
            if (userRes.ok) {
              const data = await userRes.json()
              existingUser = data.exists ? { id: data.userId } : null
            }
          } catch (e) {}

          if (!existingUser) {
            const now = new Date().toISOString()
            const rawName = user.displayName || (user as any).reloadUserInfo?.displayName || email.split('@')[0]
            const name = rawName?.trim() || email.split('@')[0]
            try { 
              await fetch('/api/user/create', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                  email, 
                  name, 
                  image: user.photoURL || (user as any).reloadUserInfo?.photoURL || user.providerData?.[0]?.photoURL || '', 
                  emailVerified: now 
                }) 
              }) 
            } catch (e) {} 
          }
        } catch (e) {}
      }
      
      const signInResult = await signIn('firebase', {
        idToken,
        redirect: false,
      })
      
      if (signInResult?.error) {
        setError('Sign up failed')
      } else {
        router.replace('/dashboard')
      }
    } catch (err: any) {
      console.error('Firebase signup error:', err)
      setError(err.message || 'Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubSignup = async () => {
    setIsLoading(true)
    try {
      const provider = new GithubAuthProvider()
      const result = await signInWithPopup(firebaseAuth, provider)
      const idToken = await result.user.getIdToken()
      
      const user = result.user
      const email = (user.email || '').toLowerCase()
      
      if (email) {
        try {
          let existingUser: any = null
          try {
            const userRes = await fetch(`/api/user/check?email=${encodeURIComponent(email)}`)
            if (userRes.ok) {
              const data = await userRes.json()
              existingUser = data.exists ? { id: data.userId } : null
            }
          } catch (e) {}

          if (!existingUser) {
            const now = new Date().toISOString()
            const rawName = user.displayName || (user as any).reloadUserInfo?.displayName || email.split('@')[0]
            const name = rawName?.trim() || email.split('@')[0]
            try { 
              await fetch('/api/user/create', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                  email, 
                  name, 
                  image: user.photoURL || (user as any).reloadUserInfo?.photoURL || user.providerData?.[0]?.photoURL || '', 
                  emailVerified: now 
                }) 
              }) 
            } catch (e) {} 
          }
        } catch (e) {}
      }

      const signInResult = await signIn('firebase', {
        idToken,
        redirect: false,
      })

      if (signInResult?.error) {
        setError('Sign up failed')
      } else {
        router.replace('/dashboard')
      }
    } catch (err: any) {
      console.error('GitHub signup error:', err)
      setError(err.message || 'Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwitterSignup = async () => {
    setIsLoading(true)
    try {
      const provider = new OAuthProvider('twitter.com')
      const result = await signInWithPopup(firebaseAuth, provider)
      const idToken = await result.user.getIdToken()
      
      const user = result.user
      const email = (user.email || '').toLowerCase()
      
      if (email) {
        try {
          let existingUser: any = null
          try {
            const userRes = await fetch(`/api/user/check?email=${encodeURIComponent(email)}`)
            if (userRes.ok) {
              const data = await userRes.json()
              existingUser = data.exists ? { id: data.userId } : null
            }
          } catch (e) {}

          if (!existingUser) {
            const now = new Date().toISOString()
            const rawName = user.displayName || (user as any).reloadUserInfo?.displayName || email.split('@')[0]
            const name = rawName?.trim() || email.split('@')[0]
            try { 
              await fetch('/api/user/create', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                  email, 
                  name, 
                  image: user.photoURL || (user as any).reloadUserInfo?.photoURL || user.providerData?.[0]?.photoURL || '', 
                  emailVerified: now 
                }) 
              }) 
            } catch (e) {} 
          }
        } catch (e) {}
      }

      const signInResult = await signIn('firebase', {
        idToken,
        redirect: false,
      })

      if (signInResult?.error) {
        setError('Sign up failed')
      } else {
        router.replace('/dashboard')
      }
    } catch (err: any) {
      console.error('Twitter signup error:', err)
      setError(err.message || 'Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: '#0C0A07' }}>
      {/* Grain texture */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.022,
      }} />

      {/* Warm glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0" style={{
        width: 700, height: 500,
        background: 'radial-gradient(ellipse at top, rgba(212,135,10,0.055) 0%, transparent 68%)',
      }} />

      {/* Back button */}
      <motion.div
        className="absolute top-6 left-6 z-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/"
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

      {/* Signup card */}
      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-4xl mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="relative border overflow-hidden" 
          style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', borderRadius: 0 }}>
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px" 
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,135,10,0.3), transparent)' }} />

          {isLoading && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
              className="w-full h-1 origin-left"
              style={{ backgroundColor: '#D4870A' }}
            />
          )}

          <div className="p-4 md:p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Logo size={56} style={{ filter: 'drop-shadow(0 0 12px rgba(212,135,10,0.45))' }} />
              </motion.div>
            </div>

            {checkLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#D4870A' }} />
              </div>
            ) : !signupEnabled ? (
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Fraunces, serif', color: '#F2EDE4' }}>Signups Closed</h1>
                <p style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace', fontSize: '14px', marginBottom: '1rem' }}>New user registrations are temporarily disabled</p>
                <p style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace', fontSize: '13px' }}>Please check back later or contact support</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fraunces, serif', color: '#F2EDE4' }}>Create an Account</h1>
                  <p style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace', fontSize: '14px' }}>Start your focused learning journey</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - OAuth Providers */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-medium mb-4" style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace' }}>
                      Continue with
                    </h2>
                    
                    {/* Google */}
                    <Button
                      onClick={handleGoogleSignup}
                      variant="outline"
                      className="w-full h-11 transition-all"
                      style={{ 
                        background: 'rgba(255,255,255,0.018)', 
                        borderColor: 'rgba(212,135,10,0.1)', 
                        color: '#DDD0B8', 
                        fontFamily: 'Fira Mono, monospace',
                        borderRadius: 0 
                      }}
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                    </Button>

                    {/* GitHub */}
                    <Button
                      onClick={handleGitHubSignup}
                      variant="outline"
                      className="w-full h-11 transition-all"
                      style={{ 
                        background: 'rgba(255,255,255,0.018)', 
                        borderColor: 'rgba(212,135,10,0.1)', 
                        color: '#DDD0B8', 
                        fontFamily: 'Fira Mono, monospace',
                        borderRadius: 0 
                      }}
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="white">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </Button>

                    {/* Twitter / X */}
                    <Button
                      onClick={handleTwitterSignup}
                      variant="outline"
                      className="w-full h-11 transition-all"
                      style={{ 
                        background: 'rgba(255,255,255,0.018)', 
                        borderColor: 'rgba(212,135,10,0.1)', 
                        color: '#DDD0B8', 
                        fontFamily: 'Fira Mono, monospace',
                        borderRadius: 0 
                      }}
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="white">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X (Twitter)
                    </Button>
                  </div>

                  {/* Right Column - Email Registration */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-medium mb-4" style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace' }}>
                      {emailLinkMode ? 'Sign up with magic link' : 'Or register with email'}
                    </h2>

                    {linkSent ? (
                      <div className="text-center py-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(212,135,10,0.2)' }}
                        >
                          <svg className="h-8 w-8" style={{ color: '#D4870A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </motion.div>
                        <p className="text-lg font-medium mb-2" style={{ color: '#F2EDE4', fontFamily: 'Fraunces, serif' }}>Check your email</p>
                        <p style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace', fontSize: '14px' }}>We've sent a magic link to<br/><span className="text-white">{email}</span></p>
                      </div>
                    ) : (
                      <form onSubmit={emailLinkMode ? handleEmailLinkSignup : handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium" style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace' }}>Name</label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-11"
                            style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', color: '#F2EDE4', fontFamily: 'Fira Mono, monospace' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-medium" style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace' }}>Email</label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                            style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', color: '#F2EDE4', fontFamily: 'Fira Mono, monospace' }}
                          />
                        </div>
                        
                        {emailLinkMode ? (
                          <div className="pt-2" />
                        ) : (
                          <>
                            <div className="space-y-2">
                              <label htmlFor="password" className="text-sm font-medium" style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace' }}>Password</label>
                              <div className="relative">
                                <Input
                                  id="password"
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Create a password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  required
                                  className="h-11 pr-10"
                                  style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', color: '#F2EDE4', fontFamily: 'Fira Mono, monospace' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                  style={{ color: '#B8A888' }}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace' }}>Confirm Password</label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-11"
                                style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', color: '#F2EDE4', fontFamily: 'Fira Mono, monospace' }}
                              />
                            </div>
                          </>
                        )}

                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm px-3 py-2"
                            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'Fira Mono, monospace' }}
                          >
                            {error}
                          </motion.p>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-11 font-medium transition-all"
                          style={{ 
                            background: '#D4870A', 
                            color: '#0C0A07', 
                            fontFamily: 'Fira Mono, monospace', 
                            borderRadius: 0 
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          {isLoading ? 'Signing up...' : emailLinkMode ? 'Send Magic Link' : 'Create Account'}
                        </Button>
                        
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEmailLinkMode(!emailLinkMode)
                              setError('')
                            }}
                            className="text-sm transition-colors"
                            style={{ color: '#D4870A', fontFamily: 'Fira Mono, monospace' }}
                          >
                            {emailLinkMode ? 'Use password instead' : 'Use magic link instead'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </>
            )}

            {!checkLoading && signupEnabled && (
              <div className="mt-6 text-center text-sm" style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace' }}>
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium transition-colors" style={{ color: '#D4870A' }}>
                  Sign in
                </Link>
              </div>
            )}

            {!checkLoading && !signupEnabled && (
              <div className="mt-6 text-center text-sm" style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace' }}>
                <Link href="/auth/login" className="font-medium transition-colors" style={{ color: '#D4870A' }}>
                  Sign in to your account
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}