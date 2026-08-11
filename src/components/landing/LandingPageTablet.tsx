'use client'

import { useRef } from 'react'
import Link from 'next/link'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion'
import {
  Eye, Play, FolderOpen, FileText,
  BarChart2, RefreshCw, Lock, Zap,
  ArrowRight,
} from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

const COLORS = {
  background: '#0C0A07',
  backgroundAlt: '#0C0C0A',
  text: '#F2EDE4',
  accent: '#D4870A',
  muted: '#DDD0B8',
  mutedDark: '#B8A888',
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function HeroIris() {
  return (
    <motion.div
      className="relative mx-auto"
      style={{ width: 90, height: 90 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ border: '1px solid rgba(212,135,10,0.2)', borderRadius: '50%' }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ border: '1px solid rgba(212,135,10,0.1)', borderRadius: '50%' }}
        animate={{ scale: [1, 1.65, 1], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      <svg viewBox="0 0 140 140" className="w-full h-full">
        <defs>
          <filter id="ig-m">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <ellipse cx="70" cy="70" rx="60" ry="36" fill="#1A1510" stroke="#D4870A" strokeWidth="1" opacity="0.8" />
        <circle cx="70" cy="70" r="28" fill="#0C0A07" stroke="#D4870A" strokeWidth="1.2" opacity="0.9" />
        <line x1="90"    y1="70"    x2="97"    y2="70"    stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="87.32" y1="80"    x2="93.38" y2="83.5"  stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="80"    y1="87.32" x2="83.5"  y2="93.38" stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="70"    y1="90"    x2="70"    y2="97"    stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="60"    y1="87.32" x2="56.5"  y2="93.38" stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="52.68" y1="80"    x2="46.62" y2="83.5"  stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="50"    y1="70"    x2="43"    y2="70"    stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="52.68" y1="60"    x2="46.62" y2="56.5"  stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="60"    y1="52.68" x2="56.5"  y2="46.62" stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="70"    y1="50"    x2="70"    y2="43"    stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="80"    y1="52.68" x2="83.5"  y2="46.62" stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <line x1="87.32" y1="60"    x2="93.38" y2="56.5"  stroke="#D4870A" strokeWidth="0.8" opacity="0.3" />
        <motion.circle cx="70" cy="70" r="13" fill="#D4870A" filter="url(#ig-m)"
          animate={{ r: [13, 10, 13] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="70" cy="70" r="8" fill="#0C0A07" />
        <motion.circle cx="70" cy="70" r="23" fill="none" stroke="#D4870A" strokeWidth="0.6"
          strokeDasharray="2 5" opacity="0.4"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '70px 70px' }}
        />
        <circle cx="76" cy="63" r="4" fill="#F0A022" opacity="0.5" />
        <line x1="10" y1="70" x2="18" y2="70" stroke="#D4870A" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="122" y1="70" x2="130" y2="70" stroke="#D4870A" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

function FeatureItem({ icon: Icon, title, desc }: { icon: typeof Eye; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4" style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(212,135,10,0.1)' }}>
      <div className="shrink-0 w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(212,135,10,0.1)', color: '#D4870A' }}>
        <Icon size={18} />
      </div>
      <div>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600, color: '#F2EDE4', marginBottom: 4 }}>
          {title}
        </h3>
        <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', color: '#DDD0B8', lineHeight: 1.7 }}>
          {desc}
        </p>
      </div>
    </div>
  )
}

function StepItem({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-7 h-7 flex items-center justify-center text-xs" style={{ fontFamily: 'Fira Mono, monospace', color: '#D4870A', border: '1px solid rgba(212,135,10,0.3)' }}>
        {n}
      </div>
      <div>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', fontWeight: 600, color: '#F2EDE4', marginBottom: 4 }}>{title}</h3>
        <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', color: '#DDD0B8', lineHeight: 1.7 }}>{desc}</p>
      </div>
    </div>
  )
}

export default function LandingPageMobile() {
  const heroRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const howItWorksRef = useRef<HTMLElement>(null)
  const creatorRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -20])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: COLORS.background, color: COLORS.text }}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.022,
      }} />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0" style={{
        width: 400, height: 300,
        background: 'radial-gradient(ellipse at top, rgba(212,135,10,0.055) 0%, transparent 68%)',
      }} />

      {/* HEADER */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
        style={{ background: 'rgba(12,10,7,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(212,135,10,0.08)' }}
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 cursor-pointer">
            <Logo size={22} />
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1rem', color: '#F2EDE4' }}>
              GazeFocus
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-2 py-1.5 text-xs" style={{ fontFamily: 'Fira Mono, monospace', color: '#B8A888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Sign In
            </Link>
            <Link href="/auth/signup" className="px-3 py-1.5 text-xs" style={{ fontFamily: 'Fira Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#D4870A', color: '#0C0A07', fontWeight: 500 }}>
              Get Started
            </Link>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-16 pb-8 px-4 overflow-hidden">
        <motion.div className="max-w-md mx-auto text-left" style={{ y: heroY }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-3"
            style={{ fontFamily: 'Fira Mono, monospace', fontSize: '10px', color: '#D4870A', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4870A', display: 'inline-block' }} />
            Real-time eye tracking
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4870A', display: 'inline-block' }} />
          </motion.div>

          <div className="mb-2"><HeroIris /></div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="overflow-hidden mb-2"
          >
            <h1 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#F2EDE4',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}>
              Your video pauses{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4870A' }}>when you look away.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            style={{ fontFamily: 'Fira Mono, monospace', fontSize: '11px', color: '#DDD0B8', lineHeight: 1.7, marginBottom: '20px' }}
          >
            GazeFocus uses eye tracking to auto-pause YouTube videos when you look away. Zero data leaves your device.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            <Link href="/auth/signup" className="flex items-center justify-center gap-2" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', letterSpacing: '0.07em', textTransform: 'uppercase', background: '#D4870A', color: '#0C0A07', padding: '12px 20px', fontWeight: 500 }}>
              Start Learning Free
              <ArrowRight size={14} />
            </Link>
            <Link href="/auth/login" className="flex items-center justify-center gap-2" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', letterSpacing: '0.07em', textTransform: 'uppercase', border: '1px solid rgba(212,135,10,0.5)', color: '#DDD0B8', padding: '12px 20px' }}>
              <Play size={12} /> Sign In
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex items-center justify-center gap-2 mt-4"
            style={{ fontFamily: 'Fira Mono, monospace', fontSize: '10px', color: '#A89878', letterSpacing: '0.07em', textTransform: 'uppercase' }}
          >
            <Lock size={9} /> No camera data leaves your device
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section ref={featuresRef} className="relative py-8 px-4 scroll-mt-14">
        <div className="max-w-md mx-auto">
          <Reveal>
            <div className="flex items-center gap-2 mb-2" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '10px', color: '#B8A888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Logo size={12} />
              Everything you need
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', fontWeight: 700, color: '#F2EDE4', lineHeight: 1.2 }}>
              Built for the{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4870A' }}>seriously focused</span> learner.
            </h2>
          </Reveal>

          <div className="mt-5 flex flex-col gap-2">
            <Reveal delay={0.1}>
              <FeatureItem icon={Eye} title="Smart Pause" desc="Video auto-pauses when you look away — resumes when you look back." />
            </Reveal>
            <Reveal delay={0.15}>
              <FeatureItem icon={Zap} title="3 Focus Modes" desc="Light, Moderate, Strict — each controls pause sensitivity." />
            </Reveal>
            <Reveal delay={0.2}>
              <FeatureItem icon={FolderOpen} title="Folders & Playlists" desc="Organize videos into folders. Import whole playlists." />
            </Reveal>
            <Reveal delay={0.25}>
              <FeatureItem icon={FileText} title="Timestamped Notes" desc="Capture notes pinned to exact timestamps. Click to jump back." />
            </Reveal>
            <Reveal delay={0.3}>
              <FeatureItem icon={BarChart2} title="Focus Analytics" desc="Track focus state and distraction count per session." />
            </Reveal>
            <Reveal delay={0.35}>
              <FeatureItem icon={Lock} title="Fully On-Device" desc="Eye tracking runs local via MediaPipe. Nothing transmitted." />
            </Reveal>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howItWorksRef} className="relative py-8 px-4 scroll-mt-14">
        <div className="max-w-md mx-auto">
          <Reveal>
            <div className="flex items-center gap-2 mb-2" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '10px', color: '#B8A888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Logo size={12} />
              How It Works
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', fontWeight: 700, color: '#F2EDE4', lineHeight: 1.2 }}>
              From paste to{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4870A' }}>deep focus</span> in 3 steps.
            </h2>
          </Reveal>

          <div className="mt-5 flex flex-col gap-4">
            <Reveal delay={0.1}>
              <StepItem n="01" title="Paste a YouTube URL" desc="Drop any video, playlist, or channel URL. Content imports instantly." />
            </Reveal>
            <Reveal delay={0.2}>
              <StepItem n="02" title="Pick your focus mode" desc="Light gives grace period. Strict pauses immediately. Switch anytime." />
            </Reveal>
            <Reveal delay={0.3}>
              <StepItem n="03" title="Enable eye tracking & watch" desc="Toggle on. Look away — it pauses. Look back — it resumes." />
            </Reveal>
          </div>
        </div>
      </section>

      {/* CREATOR */}
      <section ref={creatorRef} className="relative py-8 px-4 scroll-mt-14">
        <div className="max-w-md mx-auto">
          <Reveal>
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 mb-4" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '10px', color: '#B8A888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <div style={{ width: 20, height: 1, background: 'rgba(212,135,10,0.3)' }} />
                Message from the Creator
                <div style={{ width: 20, height: 1, background: 'rgba(212,135,10,0.3)' }} />
              </div>

              <blockquote style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#F2EDE4',
                lineHeight: 1.35,
                marginBottom: '20px',
              }}>
                "I built GazeFocus because I kept drifting mid-lecture without noticing.
                The goal was simple — make your screen hold you accountable, so{' '}
                <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4870A' }}>
                  your attention finally stays where your eyes do.
                </span>
                "
              </blockquote>

              <div style={{ width: 32, height: 1, background: 'rgba(212,135,10,0.25)', margin: '0 auto 16px' }} />

              <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '11px', color: '#B8A888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Purujith Kadekar
              </p>
              <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '10px', color: '#A89878', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '24px' }}>
                Creator · GazeFocus
              </p>

              <div className="flex items-center justify-center gap-4 mb-4" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '11px', color: '#B8A888', letterSpacing: '0.06em' }}>
                <a href="https://github.com/Purujith-Kadekar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#D4870A] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </a>
                <span style={{ color: '#A89878' }}>·</span>
                <a href="https://gaze-focus.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#D4870A] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Live App
                </a>
              </div>

              <Link href="/auth/signup" className="inline-flex items-center gap-2" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#D4870A', color: '#0C0A07', padding: '10px 24px', fontWeight: 500 }}>
                Try It Free
                <ArrowRight size={12} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-6 px-4" style={{ borderTop: '1px solid rgba(212,135,10,0.08)' }}>
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Logo size={16} />
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '0.9rem', color: '#F2EDE4' }}>GazeFocus</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-3" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '10px', color: '#B8A888', letterSpacing: '0.06em' }}>
            <Link href="/auth/login" className="hover:text-[#D4870A] transition-colors">Sign In</Link>
            <span style={{ color: '#A89878' }}>|</span>
            <Link href="/auth/signup" className="hover:text-[#D4870A] transition-colors">Get Started</Link>
            <span style={{ color: '#A89878' }}>|</span>
            <a href="https://github.com/Purujith-Kadekar/GazeFocus" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4870A] transition-colors">GitHub</a>
          </div>
          <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '10px', color: '#A89878', letterSpacing: '0.04em' }}>
            © 2026 GazeFocus. Built for focused learners.
          </p>
        </div>
      </footer>
    </div>
  )
}