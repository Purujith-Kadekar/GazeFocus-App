'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0A0118]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0118] via-[#1a0a3e] to-[#0A0118]" />
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #6C3CE0 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: (i % 4) + 2,
              height: (i % 4) + 2,
              left: `${(i * 5.3) % 100}%`,
              top: `${(i * 7.1) % 100}%`,
              background: i % 2 === 0 ? 'rgba(108, 60, 224, 0.4)' : 'rgba(59, 130, 246, 0.4)',
            }}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: (i % 5) * 0.5, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Back button */}
      <motion.div
        className="absolute top-6 left-6 z-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Back</span>
        </Link>
      </motion.div>

      {/* Login card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6C3CE0, #3B82F6)' }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Eye className="h-7 w-7 text-white" />
              </motion.div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-slate-400 text-sm">Sign in to continue your focused learning journey</p>
            </div>

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
                <TabsTrigger value="email" className="rounded-lg text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                  Email
                </TabsTrigger>
                <TabsTrigger value="google" className="rounded-lg text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                  Google
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-300">Password</label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
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
                    className="w-full h-11 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
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

            <div className="mt-6 text-center text-sm text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
