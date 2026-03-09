'use client'

import { useRef } from 'react'
import Link from 'next/link'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import {
  Eye, Focus, BookOpen, Brain, Sparkles, ArrowRight,
  Play, BarChart3, FileText, Folder, Shield, Zap,
  ChevronDown, Star, Users, Clock, CheckCircle2,
} from 'lucide-react'

/* ──────────────────────────────────────────────
   Deterministic pseudo-random to avoid hydration mismatch
   ────────────────────────────────────────────── */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/* ──────────────────────────────────────────────
   Animated floating particles background
   ────────────────────────────────────────────── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: seeded(i * 4) * 4 + 2,
            height: seeded(i * 4 + 1) * 4 + 2,
            left: `${seeded(i * 4 + 2) * 100}%`,
            top: `${seeded(i * 4 + 3) * 100}%`,
            background: i % 3 === 0
              ? 'rgba(108, 60, 224, 0.3)'
              : i % 3 === 1
              ? 'rgba(59, 130, 246, 0.3)'
              : 'rgba(255, 255, 255, 0.1)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, seeded(i * 5) * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: seeded(i * 5 + 1) * 4 + 4,
            repeat: Infinity,
            delay: seeded(i * 5 + 2) * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Animated eye logo with scanning beam
   ────────────────────────────────────────────── */
function AnimatedEyeLogo({ size = 120 }: { size?: number }) {
  return (
    <motion.div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '2px solid rgba(108, 60, 224, 0.3)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '2px solid rgba(59, 130, 246, 0.3)' }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* SVG eye */}
      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6C3CE0" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#hero-bg)" />
        <path d="M32 18C20 18 12 32 12 32s8 14 20 14 20-14 20-14-8-14-20-14z" fill="rgba(255,255,255,0.95)" />
        <circle cx="32" cy="32" r="9" fill="#1E1B4B" />

        {/* Animated pupil */}
        <motion.circle
          cx="32" cy="32" r="4.5" fill="#6C3CE0" filter="url(#glow)"
        />

        {/* Spinning dashed ring */}
        <motion.circle
          cx="32" cy="32" r="7" fill="none"
          stroke="#3B82F6" strokeWidth="1.2" strokeDasharray="3 3"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '32px 32px' }}
        />

        {/* Crosshairs */}
        <line x1="32" y1="23" x2="32" y2="27" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="32" y1="37" x2="32" y2="41" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="23" y1="32" x2="27" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="37" y1="32" x2="41" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="35" cy="29" r="2" fill="rgba(255,255,255,0.6)" />
      </svg>
    </motion.div>
  )
}

/* ──────────────────────────────────────────────
   Animated scan-line across the hero
   ────────────────────────────────────────────── */
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(108,60,224,0.5) 30%, rgba(59,130,246,0.5) 70%, transparent 100%)',
        boxShadow: '0 0 20px rgba(108,60,224,0.3)',
      }}
      animate={{ top: ['0%', '100%', '0%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    />
  )
}

/* ──────────────────────────────────────────────
   Animated counter
   ────────────────────────────────────────────── */
function AnimatedNumber({ value, label }: { value: number; label: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { damping: 40, stiffness: 80 })

  if (isInView) motionVal.set(value)

  return (
    <div ref={ref} className="text-center">
      <motion.span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        {spring}
      </motion.span>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Staggered reveal wrapper
   ────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ──────────────────────────────────────────────
   Feature card with hover tilt
   ────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
}: {
  icon: typeof Eye
  title: string
  description: string
  gradient: string
  delay: number
}) {
  return (
    <Reveal delay={delay}>
      <motion.div
        className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-full overflow-hidden"
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Hover gradient overlay */}
        <motion.div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
          style={{ filter: 'blur(40px)' }}
        />

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 border border-purple-500/20">
            <Icon className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
      </motion.div>
    </Reveal>
  )
}

/* ──────────────────────────────────────────────
   Dashboard mockup with animations
   ────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <motion.div
      className="relative w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 60, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {/* Browser chrome */}
      <div className="bg-slate-800 rounded-t-xl border border-slate-700 p-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 bg-slate-700/50 rounded-md px-3 py-1 text-xs text-slate-400 text-center">
          gazefocus.app/dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div className="bg-slate-900/90 border border-t-0 border-slate-700 rounded-b-xl p-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="h-3 w-24 bg-slate-700 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-700" />
            <motion.div
              className="h-8 w-8 rounded-lg bg-green-500/30 border border-green-500/50"
              animate={{ boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 12px rgba(34,197,94,0.4)', '0 0 0px rgba(34,197,94,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {['Videos Watched', 'Study Hours', 'Current Streak', 'Notes'].map((label, i) => (
            <motion.div
              key={label}
              className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            >
              <div className="h-2 w-16 bg-slate-600 rounded mb-2" />
              <motion.div
                className="h-6 w-10 bg-gradient-to-r from-purple-500/40 to-blue-500/40 rounded"
                animate={{ width: ['40px', '60px', '40px'] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Video player area */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 bg-slate-800/80 rounded-xl border border-slate-700/50 aspect-video flex items-center justify-center relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-blue-500/5"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Play className="h-6 w-6 text-white ml-1" />
            </motion.div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: '0%' }}
                whileInView={{ width: '65%' }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
          {/* Notes panel */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/50 p-3 space-y-2">
            <div className="h-3 w-16 bg-slate-600 rounded" />
            {[1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                className="h-2 bg-slate-700/60 rounded"
                style={{ width: `${90 - i * 12}%` }}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reflective glow underneath */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 blur-2xl rounded-full" />
    </motion.div>
  )
}

/* ──────────────────────────────────────────────
   Testimonial card
   ────────────────────────────────────────────── */
function TestimonialCard({
  quote,
  name,
  role,
  delay,
}: {
  quote: string
  name: string
  role: string
  delay: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-full">
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
        <div>
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-slate-500 text-xs">{role}</p>
        </div>
      </div>
    </Reveal>
  )
}

/* ──────────────────────────────────────────────
   MAIN LANDING PAGE
   ────────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const features = [
    {
      icon: Eye,
      title: 'Eye Tracking Focus',
      description: 'AI-powered gaze detection auto-pauses videos when you look away. Stay engaged without lifting a finger.',
      gradient: 'bg-gradient-to-br from-purple-500/10 to-transparent',
    },
    {
      icon: Play,
      title: 'Distraction-Free Player',
      description: 'Watch YouTube without the clutter. No recommended videos, no comments, no distractions.',
      gradient: 'bg-gradient-to-br from-blue-500/10 to-transparent',
    },
    {
      icon: FileText,
      title: 'Integrated Notes',
      description: 'Take timestamped notes while watching. Click any note to jump straight to that moment.',
      gradient: 'bg-gradient-to-br from-green-500/10 to-transparent',
    },
    {
      icon: Folder,
      title: 'Smart Folders',
      description: 'Organize your learning into custom folders. Group playlists and videos by topic or project.',
      gradient: 'bg-gradient-to-br from-orange-500/10 to-transparent',
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Track your streaks, watch time, and learning patterns with beautiful visual analytics.',
      gradient: 'bg-gradient-to-br from-pink-500/10 to-transparent',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Eye tracking runs entirely in your browser. No camera data is ever sent to any server.',
      gradient: 'bg-gradient-to-br from-cyan-500/10 to-transparent',
    },
  ]

  const steps = [
    { icon: Sparkles, title: 'Add any YouTube video or playlist', description: 'Paste a link and start learning instantly.' },
    { icon: Focus, title: 'Enable eye tracking', description: 'One click to activate intelligent focus detection.' },
    { icon: Brain, title: 'Learn distraction-free', description: 'Take notes, track progress, and stay focused.' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer"
          >
            <AnimatedEyeLogo size={36} />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              GazeFocus
            </span>
          </button>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <button onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">How It Works</button>
            <button onClick={() => testimonialsRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Testimonials</button>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link href="/auth/signup">
              <motion.button
                className="text-sm font-medium px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO SECTION ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <FloatingParticles />
        <ScanLine />

        {/* Radial gradient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,60,224,0.15)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.1)_0%,transparent_60%)]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <motion.div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center" style={{ y: heroY, opacity: heroOpacity }}>
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Focus Technology</span>
          </motion.div>

          {/* Animated Logo */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 100 }}
          >
            <AnimatedEyeLogo size={100} />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              Learn with
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Your Eyes
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            GazeFocus uses real-time eye tracking to keep you focused.
            Videos pause when you look away. No distractions. Pure learning.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Link href="/auth/signup">
              <motion.button
                className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-lg shadow-2xl shadow-purple-500/30"
                whileHover={{ scale: 1.05, boxShadow: '0 25px 60px rgba(108,60,224,0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                Start Learning Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link href="/auth/login">
              <motion.button
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white font-semibold text-lg backdrop-blur"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="h-5 w-5" />
                Sign In
              </motion.button>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="h-6 w-6 text-slate-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-16">
            <p className="text-purple-400 font-semibold text-sm uppercase tracking-wider mb-3">See It in Action</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
              Your <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Personal Learning Studio</span>
            </h2>
          </Reveal>
          <DashboardMockup />
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section ref={featuresRef} className="relative py-20 sm:py-32 scroll-mt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(108,60,224,0.08)_0%,transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-16">
            <p className="text-purple-400 font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Stay Focused</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built for serious learners who want to make every minute count.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={howItWorksRef} className="relative py-20 sm:py-32 scroll-mt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-16">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
              Three Steps to{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Deep Focus</span>
            </h2>
          </Reveal>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.2}>
                  <div className="relative text-center">
                    {/* Step number */}
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 relative"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      <step.icon className="h-7 w-7 text-purple-400" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                    </motion.div>
                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400">{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, label: 'Active Learners', value: '2,500+' },
              { icon: Clock, label: 'Hours Focused', value: '50,000+' },
              { icon: BookOpen, label: 'Videos Watched', value: '120,000+' },
              { icon: Star, label: 'User Rating', value: '4.9/5' },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <stat.icon className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section ref={testimonialsRef} className="relative py-20 sm:py-32 scroll-mt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.08)_0%,transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-16">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
              Loved by{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Focused Learners</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="The eye tracking is a game changer. I used to catch myself scrolling on my phone while videos played. Not anymore. GazeFocus keeps me honest."
              name="Priya S."
              role="Computer Science Student"
              delay={0}
            />
            <TestimonialCard
              quote="I've tried every productivity app out there. This is the first one that actually made me focus. The distraction-free player alone is worth it."
              name="Marcus T."
              role="Self-Taught Developer"
              delay={0.15}
            />
            <TestimonialCard
              quote="The timestamped notes are incredible for online courses. I can review a whole lecture in minutes by just clicking through my notes."
              name="Aisha K."
              role="Graduate Researcher"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 via-transparent to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <motion.div
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 sm:p-16"
              whileHover={{ borderColor: 'rgba(108,60,224,0.3)' }}
            >
              <AnimatedEyeLogo size={64} />
              <div className="mt-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                  Ready to{' '}
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Focus?</span>
                </h2>
                <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                  Join thousands of learners who are using GazeFocus to study smarter, stay focused, and achieve their goals.
                </p>
                <Link href="/auth/signup">
                  <motion.button
                    className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-lg shadow-2xl shadow-purple-500/30"
                    whileHover={{ scale: 1.05, boxShadow: '0 25px 60px rgba(108,60,224,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started — It&apos;s Free
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  No credit card required
                </p>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AnimatedEyeLogo size={28} />
              <span className="font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                GazeFocus
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <button onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-slate-300 transition-colors">Features</button>
              <button onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-slate-300 transition-colors">How It Works</button>
              <Link href="/auth/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            </div>
            <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} GazeFocus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
