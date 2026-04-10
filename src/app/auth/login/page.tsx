'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Logo } from '@/components/layout/Logo'



export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'Blocked') {
      setError('Your account has been blocked. Please contact support.')
      return
    }
    if (authError === 'AccessDenied') {
      setError('Access denied. You may be blocked or signups are currently disabled.')
      return
    }
    if (authError) {
      setError('Authentication failed. Please try again.')
    }
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

      // Handle different response scenarios
      if (!result) {
        setError('Login failed. Please try again.')
        setIsLoading(false)
        return
      }

      if (result.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      // Success - wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.replace('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong')
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard', redirect: true })
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

      {/* Login card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="relative border overflow-hidden" 
          style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(212,135,10,0.1)', borderRadius: 0 }}>
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px" 
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,135,10,0.3), transparent)' }} />

          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Logo size={56} style={{ filter: 'drop-shadow(0 0 12px rgba(212,135,10,0.45))' }} />
              </motion.div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fraunces, serif', color: '#F2EDE4' }}>Welcome back</h1>
              <p style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace', fontSize: '14px' }}>Sign in to continue your focused learning journey</p>
            </div>

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 p-1" 
                style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(212,135,10,0.1)' }}>
                <TabsTrigger value="email" className="text-sm transition-all" 
                  style={{ fontFamily: 'Fira Mono, monospace', color: '#B8A888', borderRadius: 0 }}
                  data-state-active-style={{ background: '#D4870A', color: '#0C0A07' }}>
                  Email
                </TabsTrigger>
                <TabsTrigger value="google" className="text-sm transition-all" 
                  style={{ fontFamily: 'Fira Mono, monospace', color: '#B8A888', borderRadius: 0 }}
                  data-state-active-style={{ background: '#D4870A', color: '#0C0A07' }}>
                  Google
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-5">
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
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="google">
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
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm" style={{ color: '#B8A888', fontFamily: 'Fira Mono, monospace' }}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium transition-colors" style={{ color: '#D4870A' }}>
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}