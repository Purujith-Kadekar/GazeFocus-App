'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion'
import {
  Eye, Play, FolderOpen, FileText,
  BarChart2, RefreshCw, Lock, CheckSquare,
  ArrowRight, Settings, Zap,
} from 'lucide-react'

/* ── Fonts + global selection theming ── */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=Fira+Mono:wght@400;500&display=swap');
::selection { background: rgba(212,135,10,0.38); color: #F9F4EC; }
::-moz-selection { background: rgba(212,135,10,0.38); color: #F9F4EC; }
`

/* ── Reveal wrapper ── */
function Reveal({
  children,
  delay = 0,
  className = '',
  from = 'bottom',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  from?: 'bottom' | 'left' | 'right'
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const initial =
    from === 'left' ? { opacity: 0, x: -32 }
    : from === 'right' ? { opacity: 0, x: 32 }
    : { opacity: 0, y: 28 }
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ── Iris SVG motif ── */
function IrisMotif({ size = 64, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={glow ? { filter: 'drop-shadow(0 0 12px rgba(212,135,10,0.45))' } : undefined}
    >
      <ellipse cx="32" cy="32" rx="28" ry="17" stroke="#D4870A" strokeWidth="1.5" />
      <line x1="4" y1="32" x2="10" y2="32" stroke="#D4870A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="54" y1="32" x2="60" y2="32" stroke="#D4870A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="13" stroke="#D4870A" strokeWidth="1" opacity="0.4" />
      <circle cx="32" cy="32" r="8" fill="#0C0A07" stroke="#D4870A" strokeWidth="1.5" />
      {/* Pre-computed iris detail lines at 0°, 45°, 90°, 135° — static to avoid hydration mismatch */}
      <line x1="40.5"  y1="32"    x2="44.5"  y2="32"    stroke="#D4870A" strokeWidth="0.8" opacity="0.5" />
      <line x1="38.01" y1="38.01" x2="40.84" y2="40.84" stroke="#D4870A" strokeWidth="0.8" opacity="0.5" />
      <line x1="32"    y1="40.5"  x2="32"    y2="44.5"  stroke="#D4870A" strokeWidth="0.8" opacity="0.5" />
      <line x1="25.99" y1="38.01" x2="23.16" y2="40.84" stroke="#D4870A" strokeWidth="0.8" opacity="0.5" />
      <circle cx="35" cy="29" r="2" fill="#D4870A" opacity="0.7" />
    </svg>
  )
}

/* ── Animated hero iris ── */
function HeroIris() {
  return (
    <motion.div
      className="relative mx-auto"
      style={{ width: 140, height: 140 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
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
          <filter id="ig">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <ellipse cx="70" cy="70" rx="60" ry="36" fill="#1A1510" stroke="#D4870A" strokeWidth="1" opacity="0.8" />
        <circle cx="70" cy="70" r="28" fill="#0C0A07" stroke="#D4870A" strokeWidth="1.2" opacity="0.9" />
        {/* 12 iris texture lines — pre-computed to avoid SSR/client float mismatch */}
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
        <motion.circle cx="70" cy="70" r="13" fill="#D4870A" filter="url(#ig)"
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

/* ── Feature card ── */
function FeatureCard({ icon: Icon, title, desc, tag, delay }: {
  icon: typeof Eye; title: string; desc: string; tag?: string; delay: number
}) {
  return (
    <Reveal delay={delay}>
      <motion.div
        className="group relative p-7 h-full"
        style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(212,135,10,0.1)' }}
        whileHover={{ background: 'rgba(212,135,10,0.04)', borderColor: 'rgba(212,135,10,0.22)' }}
        transition={{ duration: 0.2 }}
      >
        {tag && (
          <span className="absolute top-4 right-4 text-xs px-2 py-0.5"
            style={{ background: 'rgba(212,135,10,0.12)', color: '#D4870A', fontFamily: 'Fira Mono, monospace', fontSize: '10px', letterSpacing: '0.06em' }}>
            {tag}
          </span>
        )}
        <div className="w-9 h-9 flex items-center justify-center mb-5"
          style={{ background: 'rgba(212,135,10,0.1)', color: '#D4870A' }}>
          <Icon size={17} />
        </div>
        <h3 className="mb-3" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 600, color: '#F2EDE4' }}>
          {title}
        </h3>
        <p style={{ color: '#DDD0B8', fontFamily: 'Fira Mono, monospace', fontSize: '13px', lineHeight: '1.85' }}>
          {desc}
        </p>
      </motion.div>
    </Reveal>
  )
}

/* ── Section label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5"
      style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', color: '#D0C0A0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      <IrisMotif size={14} />
      {children}
    </div>
  )
}

/* ── Main page ── */
export default function LandingPage() {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const creatorRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -40])

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0C0A07', color: '#F2EDE4' }}>
      <style>{FONTS}</style>

      {/* Grain texture */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.022,
      }} />

      {/* Warm top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0" style={{
        width: 700, height: 500,
        background: 'radial-gradient(ellipse at top, rgba(212,135,10,0.055) 0%, transparent 68%)',
      }} />

      {/* ── NAVBAR ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(12,10,7,0.88)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(212,135,10,0.08)' }}
        initial={{ y: -80 }} animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => scrollTo(heroRef)} className="flex items-center gap-3 cursor-pointer">
            <IrisMotif size={26} />
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.05rem', color: '#F2EDE4' }}>
              GazeFocus
            </span>
          </button>

          <div className="hidden md:flex items-center gap-8"
            style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#D0C0A0' }}>
            {[
              { label: 'Features', ref: featuresRef },
              { label: 'How It Works', ref: howItWorksRef },
              { label: 'Creator', ref: creatorRef },
            ].map(({ label, ref }) => (
              <button key={label} onClick={() => scrollTo(ref)} className="transition-colors hover:text-[#D4870A]">{label}</button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login"
              className="px-3 py-2 transition-colors hover:text-[#D4870A]"
              style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', color: '#D0C0A0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Sign In
            </Link>
            <Link href="/auth/signup">
              <motion.button
                style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#D4870A', color: '#0C0A07', padding: '8px 18px', fontWeight: 500 }}
                whileHover={{ background: '#F0A022' }} whileTap={{ scale: 0.97 }}>
                Get Started
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-14 overflow-hidden">
        <div className="absolute inset-x-0 pointer-events-none" style={{ top: '33%', height: 1, background: 'rgba(212,135,10,0.04)' }} />
        <div className="absolute inset-x-0 pointer-events-none" style={{ top: '66%', height: 1, background: 'rgba(212,135,10,0.04)' }} />

        <motion.div className="relative z-10 max-w-4xl mx-auto px-6 text-center" style={{ y: heroY }}>
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-10"
            style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', color: '#D4870A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4870A', display: 'inline-block' }} />
            Real-time eye tracking · On-device · Free
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4870A', display: 'inline-block' }} />
          </motion.div>

          {/* Iris */}
          <div className="mb-10"><HeroIris /></div>

          {/* Headline */}
          <div className="overflow-hidden mb-6">
            {[
              { text: 'Your video pauses', weight: 300, italic: true, color: '#C4B49A' },
              { text: 'when you look away.', weight: 900, italic: false, color: '#F2EDE4' },
            ].map(({ text, weight, italic, color }, i) => (
              <motion.div key={text}
                initial={{ y: '105%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
                <h1 style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
                  fontWeight: weight,
                  fontStyle: italic ? 'italic' : 'normal',
                  color,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}>
                  {text}
                </h1>
              </motion.div>
            ))}
          </div>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
            style={{ fontFamily: 'Fira Mono, monospace', fontSize: '14px', color: '#DDD0B8', maxWidth: '460px', margin: '0 auto 40px', lineHeight: 1.9, letterSpacing: '0.025em' }}>
            GazeFocus uses MediaPipe face landmarks to detect where you're looking — entirely in your browser. Zero camera data leaves your device.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/auth/signup')}
              className="group flex items-center gap-3 cursor-pointer"
              style={{ fontFamily: 'Fira Mono, monospace', fontSize: '14px', letterSpacing: '0.07em', textTransform: 'uppercase', background: '#D4870A', color: '#0C0A07', padding: '14px 32px', fontWeight: 500, border: 'none' }}>
              Start Learning Free
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="flex items-center gap-3 cursor-pointer"
              style={{ fontFamily: 'Fira Mono, monospace', fontSize: '14px', letterSpacing: '0.07em', textTransform: 'uppercase', border: '1px solid rgba(212,135,10,0.5)', color: '#DDD0B8', padding: '14px 32px', background: 'transparent' }}>
              <Play size={12} /> Sign In
            </button>
          </motion.div>

          {/* Privacy footnote */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
            className="flex items-center justify-center gap-2 mt-8"
            style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', color: '#A89878', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            <Lock size={9} /> No camera data leaves your device — ever
          </motion.div>
        </motion.div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,135,10,0.15), transparent)' }} />

      {/* ── STATS ── */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderLeft: '1px solid rgba(212,135,10,0.07)' }}>
            {[
              { value: '2,500+', label: 'Active Learners' },
              { value: '50k+', label: 'Hours Focused' },
              { value: '120k+', label: 'Videos Watched' },
              { value: '4.9 / 5', label: 'User Rating' },
            ].map((s, i) => (
              <div key={s.label} style={{ borderRight: '1px solid rgba(212,135,10,0.07)', borderTop: '1px solid rgba(212,135,10,0.07)', borderBottom: '1px solid rgba(212,135,10,0.07)' }}>
                <Reveal delay={i * 0.08}>
                  <div className="text-center py-10">
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.5rem, 4.5vw, 4rem)', fontWeight: 900, color: '#D4870A', lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', color: '#D0C0A0', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 8 }}>
                      {s.label}
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef} className="relative py-28 scroll-mt-14">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="mb-16">
            <SectionLabel>Everything you need</SectionLabel>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 700, color: '#F2EDE4', lineHeight: 1.15, maxWidth: 520 }}>
              Built for the{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4870A' }}>seriously focused</span>{' '}
              learner.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(212,135,10,0.06)' }}>
            {[
              { icon: Eye, title: 'Smart Pause', tag: 'Core Feature', desc: "Video automatically pauses when gaze detection detects you've looked away — and resumes the instant you look back. No manual intervention required." },
              { icon: Settings, title: '3 Focus Modes', desc: 'Choose between Light, Moderate, and Strict — each controls how quickly the video pauses when you look away. Match the mode to your session.' },
              { icon: Zap, title: 'Configurable Threshold', desc: 'Set your pause sensitivity from 1 to 10 seconds. Short sessions? Hair-trigger. Marathon study block? Give yourself a little slack.' },
              { icon: BarChart2, title: 'Focus & Distraction Tracking', desc: 'A live focus-state indicator shows whether you\'re in-zone. Your distraction count is logged per session so you can trend over time.' },
              { icon: FolderOpen, title: 'Folders & Playlists', desc: 'Organise everything into folders. Import entire YouTube playlists with one paste — full playlist sync support included.' },
              { icon: FileText, title: 'Timestamped Notes', tag: 'Popular', desc: 'Capture notes while watching. Each note is pinned to the exact video timestamp — click any note to jump straight back to that moment.' },
              { icon: RefreshCw, title: 'Playlist Auto-Sync', desc: 'Background scheduler syncs your playlists for new YouTube uploads every 30 minutes. Hit Refresh any time for a manual pull.' },
              { icon: CheckSquare, title: 'Todo List', desc: 'Attach a learning to-do list to your session. Track tasks, tick off concepts, and stay on top of what you planned to cover.' },
              { icon: Lock, title: 'Fully On-Device', tag: 'Privacy', desc: 'Eye tracking runs in WebAssembly via MediaPipe. No camera frames, no gaze data, nothing is transmitted outside your browser tab.' },
            ].map((f, i) => (
              <div key={f.title} style={{ background: '#0C0A07' }}>
                <FeatureCard {...f} delay={i * 0.06} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={howItWorksRef} className="relative py-28 scroll-mt-14">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(212,135,10,0.025) 0%, transparent 60%)' }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            {/* Left */}
            <Reveal from="left">
              <SectionLabel>How It Works</SectionLabel>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', fontWeight: 700, lineHeight: 1.15, color: '#F2EDE4' }}>
                From paste to{' '}
                <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4870A' }}>deep focus</span>
                {' '}in three steps.
              </h2>
              <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '14px', color: '#DDD0B8', lineHeight: 1.9, marginTop: 24, maxWidth: 340 }}>
                No installs. No extensions. Just your browser, your webcam, and your YouTube library.
              </p>
            </Reveal>

            {/* Right: steps */}
            <div className="flex flex-col gap-10">
              {[
                { n: '01', title: 'Paste a YouTube video or playlist', desc: 'Drop any YouTube URL. Full playlists are imported in one go and sync automatically in the background every 30 minutes.' },
                { n: '02', title: 'Pick your focus mode', desc: 'Choose Light, Moderate, or Strict. Light gives you a longer grace period before pausing — Strict pauses the moment your gaze drifts. Switch any time.' },
                { n: '03', title: 'Enable eye tracking and start watching', desc: 'One toggle activates the focus engine. Look away — it pauses. Look back — it resumes. Take timestamped notes throughout.' },
              ].map(({ n, title, desc }, i) => (
                <Reveal key={n} delay={i * 0.12}>
                  <div className="flex gap-6">
                    <div className="shrink-0 pt-1" style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', color: '#D4870A', opacity: 0.9, letterSpacing: '0.08em', width: 28 }}>
                      {n}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 600, color: '#F2EDE4', marginBottom: 8 }}>{title}</h3>
                      <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', color: '#DDD0B8', lineHeight: 1.85 }}>{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,135,10,0.12), transparent)' }} />

      {/* ── MESSAGE FROM THE CREATOR ── */}
      <section ref={creatorRef} className="relative py-28 scroll-mt-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            {/* Label */}
            <div className="flex items-center justify-center gap-3 mb-12"
              style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', color: '#D0C0A0', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              <div style={{ width: 28, height: 1, background: 'rgba(212,135,10,0.3)' }} />
              Message from the Creator
              <div style={{ width: 28, height: 1, background: 'rgba(212,135,10,0.3)' }} />
            </div>

            {/* Quote */}
            <blockquote style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
              fontWeight: 600,
              color: '#F2EDE4',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              marginBottom: '40px',
            }}>
              "I built GazeFocus because I kept drifting mid-lecture without even noticing.
              The goal was simple — make your screen hold you accountable,
              so{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4870A' }}>
                your attention finally stays where your eyes do.
              </span>
              "
            </blockquote>

            {/* Divider */}
            <div style={{ width: 40, height: 1, background: 'rgba(212,135,10,0.25)', margin: '0 auto 28px' }} />

            {/* Name + title */}
            <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', color: '#D0C0A0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Purujith Kadekar
            </p>
            <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', color: '#A89878', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '36px' }}>
              Creator · GazeFocus
            </p>

            {/* Social links */}
            <div className="flex items-center justify-center gap-6 mb-12"
              style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', color: '#D0C0A0', letterSpacing: '0.06em' }}>
              <a href="https://github.com/Purujith-Kadekar" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#D4870A] transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
              <span style={{ color: '#A89878' }}>·</span>
              <a href="https://gaze-focus.vercel.app" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#D4870A] transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Live App
              </a>
            </div>

            {/* CTA */}
            <Link href="/auth/signup">
              <motion.button className="group inline-flex items-center gap-3"
                style={{ fontFamily: 'Fira Mono, monospace', fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#D4870A', color: '#0C0A07', padding: '14px 36px', fontWeight: 500 }}
                whileHover={{ background: '#F0A022' }} whileTap={{ scale: 0.97 }}>
                Try It Free
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(212,135,10,0.07)', padding: '36px 0' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <IrisMotif size={20} />
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '0.95rem', color: '#F2EDE4' }}>GazeFocus</span>
          </div>
          <div className="flex items-center gap-6"
            style={{ fontFamily: 'Fira Mono, monospace', fontSize: '13px', color: '#D0C0A0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <button onClick={() => scrollTo(featuresRef)} className="hover:text-[#D4870A] transition-colors">Features</button>
            <button onClick={() => scrollTo(howItWorksRef)} className="hover:text-[#D4870A] transition-colors">How It Works</button>
            <Link href="/auth/login" className="hover:text-[#D4870A] transition-colors">Sign In</Link>
          </div>
          <p style={{ fontFamily: 'Fira Mono, monospace', fontSize: '12px', color: '#A89878', letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} GazeFocus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
