'use client'

import { Suspense, useMemo, useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/layout/Logo'
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  OAuthProvider,
  sendSignInLinkToEmail
} from 'firebase/auth'
import { auth as firebaseAuth, app as firebaseApp } from '@/lib/firebase'
import { db } from '@/lib/db'
import { beginRouteLoading, endRouteLoading } from '@/components/layout/RouteTopLoader'

function logFirebaseError(context: string, err: any) {
  console.error(`[${context}] Firebase error:`, err)
  console.error(`[${context}] Error code:`, err?.code)
  console.error(`[${context}] Error message:`, err?.message)
  if (err?.customData) {
    console.error(`[${context}] Custom data:`, err?.customData)
  }
  if (err?.email) {
    console.error(`[${context}] Email:`, err?.email)
  }
}

function getFirebaseErrorMessage(err: any): string {
  if (!err) return 'Login failed'

  const code = err?.code
  const message = err?.message

  switch (code) {
    case 'auth/internal-error':
      return 'Configuration error. Please check Firebase setup.'
    case 'auth/popup-closed-by-user':
      return 'Login was cancelled'
    case 'auth/cancelled-popup-request':
      return 'Only one popup allowed at a time'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    case 'auth/popup-blocked':
      return 'Popup blocked. Please allow popups for this site.'
    default:
      return message || 'Login failed'
  }
}

function FirebaseConfigStatus() {
  const [configStatus, setConfigStatus] = useState<{
    valid: boolean
    issues: string[]
  }>({ valid: true, issues: [] })

  useEffect(() => {
    const checkConfig = () => {
      if (!firebaseApp) {
        setConfigStatus({
          valid: false,
          issues: ['Firebase app is not initialized']
        })
        return
      }

      const issues: string[] = []
      const options = firebaseApp.options

      if (!options) {
        issues.push('Firebase options are missing')
      } else {
        if (!options.apiKey) issues.push('apiKey is missing')
        if (!options.authDomain) issues.push('authDomain is missing')
        if (!options.projectId) issues.push('projectId is missing')

        if (options.apiKey === 'YOUR_API_KEY' || options.apiKey?.includes('YOUR_')) {
          issues.push('apiKey appears to be a placeholder')
        }
      }

      setConfigStatus({
        valid: issues.length === 0,
        issues
      })
    }

    checkConfig()
  }, [])

  if (configStatus.valid) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg px-4 py-3"
      style={{ 
        background: 'rgba(239,68,68,0.95)', 
        color: '#fff',
        border: '1px solid rgba(239,68,68,1)',
        fontFamily: 'Fira Mono, monospace',
        fontSize: '12px'
      }}>
      <div className="font-bold mb-2">Firebase Configuration Error</div>
      {configStatus.issues.map((issue, i) => (
        <div key={i} className="opacity-90">• {issue}</div>
      ))}
    </div>
  )
}


function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState('')
  const [emailLinkMode, setEmailLinkMode] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  useEffect(() => {
    if (status === 'loading' || isLoading || isRedirecting) {
      beginRouteLoading()
    } else {
      endRouteLoading()
    }
  }, [status, isLoading, isRedirecting])

  const queryError = useMemo(() => {
    const authError = searchParams.get('error')
    const isVerified = searchParams.get('verified')

    if (isVerified === '1') {
      return ''
    }

    if (authError === 'Blocked') {
      return 'Your account has been blocked. Please contact support.'
    }
    if (authError === 'EmailNotVerified') {
      return 'Email not verified. Please verify your email before logging in.'
    }
    if (authError === 'AccessDenied') {
      return 'Access denied. You may be blocked or signups are currently disabled.'
    }

    return authError ? 'Authentication failed. Please try again.' : ''
  }, [searchParams])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!result) {
        setError('Login failed. Please try again.')
        setIsLoading(false)
        return
      }

      if (result.error) {
        if (result.error.includes('EmailNotVerified')) {
          setError('Email not verified. Use the verification page and then login again.')
        } else {
          setError('Invalid email or password')
        }
        setIsLoading(false)
        return
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.replace('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong')
      setIsLoading(false)
    }
  }

  const handleEmailLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firebaseAuth) {
      setError('Firebase not initialized. Please refresh the page.')
      return
    }
    setIsLoading(true)
    setError('')
    
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/verify-link?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
      }
      
      await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings)
      setLinkSent(true)
    } catch (err: any) {
      logFirebaseError('Email Link', err)
      setError(getFirebaseErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

   const handleGoogleLogin = async () => {
    if (!firebaseAuth) {
      setError('Firebase not initialized. Please refresh the page.')
      return
    }
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(firebaseAuth, provider)
      const idToken = await result.user.getIdToken()
      const user = result.user
      
      const email = (user.email || '').toLowerCase()
      
      // Create user in Supabase if doesn't exist
      if (email) {
        try {
          let existingUser: any = null
          try {
            const res = await db.from('User').select('id').eq('email', email).single()
            existingUser = res.data
          } catch (e) { }
          
          if (!existingUser) {
            const now = new Date().toISOString()
            const rawName = user.displayName || (user as any).reloadUserInfo?.displayName || email.split('@')[0]
            const name = rawName?.trim() || email.split('@')[0]
            try {
              const { error: insertError } = await db.from('User').insert({
                id: crypto.randomUUID(),
                email: email,
                name: name,
                image: user.photoURL || (user as any).reloadUserInfo?.photoURL || user.providerData?.[0]?.photoURL || '',
                emailVerified: true,
                createdAt: now,
                updatedAt: now,
                lastLoginDate: now,
              })
              if (insertError) {
                console.error('User insert error:', insertError)
              }
            } catch (e: any) {
              console.error('User insert exception:', e)
            }
          }
        } catch (e) {}
      }
      
        // User created in Supabase, proceed to dashboard
        // NextAuth verification happens in background
        setIsLoading(false)
        setIsRedirecting(true)
        await signIn('firebase', { idToken, redirect: false })
        router.replace('/dashboard')
    } catch (err: any) {
      logFirebaseError('Google Login', err)
      setError(getFirebaseErrorMessage(err))
    } finally {
      setIsLoading(false)
      setIsRedirecting(false)
    }
  }

   const handleGitHubLogin = async () => {
    if (!firebaseAuth) {
      setError('Firebase not initialized. Please refresh the page.')
      return
    }
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
            const res = await db.from('User').select('id').eq('email', email).single()
            existingUser = res.data
          } catch (e) { }

          if (!existingUser) {
            const now = new Date().toISOString()
            const rawName = user.displayName || (user as any).reloadUserInfo?.displayName || email.split('@')[0]
            const name = rawName?.trim() || email.split('@')[0]
            await db.from('User').insert({
              id: crypto.randomUUID(),
              email: email,
              name: name,
              image: user.photoURL || (user as any).reloadUserInfo?.photoURL || user.providerData?.[0]?.photoURL || '',
              emailVerified: true,
              createdAt: now,
              updatedAt: now,
              lastLoginDate: now,
            })
          }
        } catch (e) { }
      }

      setIsLoading(false)
      setIsRedirecting(true)
      await signIn('firebase', { idToken, redirect: false })
      router.replace('/dashboard')
    } catch (err: any) {
      logFirebaseError('GitHub Login', err)
      setError(getFirebaseErrorMessage(err))
    } finally {
      setIsLoading(false)
      setIsRedirecting(false)
    }
  }

   const handleTwitterLogin = async () => {
    if (!firebaseAuth) {
      setError('Firebase not initialized. Please refresh the page.')
      return
    }
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
            const res = await db.from('User').select('id').eq('email', email).single()
            existingUser = res.data
          } catch (e) { }

          if (!existingUser) {
            const now = new Date().toISOString()
            const rawName = user.displayName || (user as any).reloadUserInfo?.displayName || email.split('@')[0]
            const name = rawName?.trim() || email.split('@')[0]
            await db.from('User').insert({
              id: crypto.randomUUID(),
              email: email,
              name: name,
              image: user.photoURL || (user as any).reloadUserInfo?.photoURL || user.providerData?.[0]?.photoURL || '',
              emailVerified: true,
              createdAt: now,
              updatedAt: now,
              lastLoginDate: now,
            })
          }
        } catch (e) { }
      }

      setIsLoading(false)
      setIsRedirecting(true)
      await signIn('firebase', { idToken, redirect: false })
      router.replace('/dashboard')
    } catch (err: any) {
      logFirebaseError('Twitter Login', err)
      setError(getFirebaseErrorMessage(err))
    } finally {
      setIsLoading(false)
      setIsRedirecting(false)
    }
  }

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

      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-4xl mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="relative border overflow-hidden" 
            style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', borderRadius: 0 }}>
            <div className="absolute top-0 left-0 right-0 h-px" 
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,135,10,0.3), transparent)' }} />

            <div className="p-4 md:p-8">
              <div className="flex justify-center mb-6">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Logo size={56} style={{ filter: 'drop-shadow(0 0 12px rgba(212,135,10,0.45))' }} />
                </motion.div>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fraunces, serif', color: '#F2EDE4' }}>Welcome back</h1>
                <p style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace', fontSize: '14px' }}>Continue with your preferred provider</p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleGoogleLogin}
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
                  Continue with Google
                </Button>

                <Button
                  onClick={handleGitHubLogin}
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
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </Button>

                <Button
                  onClick={handleTwitterLogin}
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
                  Continue with X (Twitter)
                </Button>
              </div>

              <div className="mt-8 text-center text-sm" style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace' }}>
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="font-medium transition-colors" style={{ color: '#D4870A' }}>
                  Sign up
                </Link>
              </div>
             </div>
           </div>

<div className="relative border overflow-hidden" 
              style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', borderRadius: 0 }}>
              <div className="absolute top-0 left-0 right-0 h-px" 
                style={{ background: 'linear-gradient(90deg, transparent, rgba(212,135,10,0.3), transparent)' }} />

              <div className="p-4 md:p-8">
               <div className="text-center mb-8">
                 <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fraunces, serif', color: '#F2EDE4' }}>Sign In</h2>
                 <p style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace', fontSize: '14px' }}>
                   {emailLinkMode ? 'Magic Link' : 'Enter your credentials'}
                 </p>
                </div>

                {linkSent ? (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(212,135,10,0.1)', borderRadius: '50%' }}>
                    <svg className="h-8 w-8" style={{ color: '#D4870A' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2" style={{ color: '#F2EDE4', fontFamily: 'Fira Mono, monospace' }}>Check your email</p>
                  <p className="text-sm mb-4" style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace' }}>
                    We sent a magic link to <span style={{ color: '#D4870A' }}>{email}</span>
                  </p>
                  <button
                    onClick={() => { setLinkSent(false); setEmail(''); }}
                    className="text-sm underline"
                    style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace' }}
                  >
                    Use a different method
                  </button>
                </motion.div>
               ) : (
                 <form onSubmit={emailLinkMode ? handleEmailLinkLogin : handleEmailLogin} className="space-y-5">
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

                  {emailLinkMode ? null : (
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium" style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace' }}>Password</label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
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
                  )}

                  {(error || queryError) && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm px-3 py-2"
                      style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'Fira Mono, monospace' }}
                    >
                      {error || queryError}
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
                    disabled={isLoading || isRedirecting}
                  >
                    {isLoading || isRedirecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : emailLinkMode ? <Mail className="h-4 w-4 mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                    {isRedirecting ? 'Redirecting...' : isLoading ? 'Signing in...' : emailLinkMode ? 'Send Magic Link' : 'Sign In'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setEmailLinkMode(!emailLinkMode); setError(''); }}
                      className="text-sm underline"
                      style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace' }}
                    >
                      {emailLinkMode ? 'Use password instead' : 'Use magic link instead'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}