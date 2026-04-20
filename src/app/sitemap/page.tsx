import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Home, Info, CircleHelp, Lock, FileText,
  LogIn, UserPlus, LayoutDashboard, Play, ListVideo,
  Calendar, StickyNote, Search, Settings, Tv, FolderOpen,
} from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'GazeFocus site structure — all pages and sections at a glance.',
  alternates: { canonical: '/sitemap' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'GazeFocus Sitemap',
    description: 'GazeFocus site structure — all pages and sections at a glance.',
    url: 'https://gaze-focus.vercel.app/sitemap',
    type: 'website',
  },
}

/* ── Design tokens (match landing page) ─────────────────────────── */
const AMBER       = '#D4870A'
const AMBER_LINE  = 'rgba(212,135,10,0.35)'
const AMBER_CARD  = 'rgba(212,135,10,0.065)'
const AMBER_BDR   = 'rgba(212,135,10,0.18)'
const AMBER_ROOT  = 'rgba(212,135,10,0.13)'
const TEXT        = '#F2EDE4'
const TEXT_DIM    = '#DDD0B8'
const TEXT_MUTED  = '#A89878'
const MONO        = 'Fira Mono, monospace'
const SERIF       = 'Fraunces, serif'

/* ── Site tree data ──────────────────────────────────────────────── */
const categories = [
  {
    id: 'public',
    label: 'Public',
    badge: 'PUBLIC',
    badgeBg: 'rgba(107,227,154,0.12)',
    badgeFg: '#6BE39A',
    catBorder: 'rgba(107,227,154,0.22)',
    pages: [
      { label: 'Home',           href: '/',                      icon: Home,         desc: 'Landing page'        },
      { label: 'About',          href: '/about',                  icon: Info,         desc: 'Mission & founder'   },
      { label: 'FAQ',            href: '/faq',                   icon: CircleHelp,   desc: 'Common questions'    },
      { label: 'Privacy Policy', href: '/privacy-policy',         icon: Lock,         desc: 'Data practices'      },
      { label: 'Terms',          href: '/terms-and-conditions',   icon: FileText,     desc: 'Terms of service'    },
    ],
  },
  {
    id: 'auth',
    label: 'Auth',
    badge: 'AUTH',
    badgeBg: 'rgba(120,170,255,0.12)',
    badgeFg: '#78AAFF',
    catBorder: 'rgba(120,170,255,0.22)',
    pages: [
      { label: 'Sign In',  href: '/auth/login',   icon: LogIn,    desc: 'Log in to your account' },
      { label: 'Sign Up',  href: '/auth/signup',  icon: UserPlus, desc: 'Create an account'       },
    ],
  },
  {
    id: 'app',
    label: 'App',
    badge: 'PRIVATE',
    badgeBg: 'rgba(212,135,10,0.12)',
    badgeFg: '#D4870A',
    catBorder: AMBER_BDR,
    pages: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, desc: 'Overview & todos'    },
      { label: 'Videos',    href: '/videos',    icon: Play,             desc: 'Your video library'  },
      { label: 'Playlists', href: '/playlists', icon: ListVideo,        desc: 'Collections'         },
      { label: 'Calendar',  href: '/calendar',  icon: Calendar,         desc: 'Study schedule'      },
      { label: 'Notes',     href: '/notes',     icon: StickyNote,       desc: 'Timestamped notes'   },
      { label: 'Search',    href: '/search',    icon: Search,           desc: 'Find anything'       },
      { label: 'Settings',  href: '/settings',  icon: Settings,         desc: 'Preferences'         },
      { label: 'Channels',  href: '/channels',  icon: Tv,               desc: 'YouTube channels'    },
      { label: 'Folders',   href: '/folders',   icon: FolderOpen,       desc: 'Organise content'    },
    ],
  },
]

/* ── Page ────────────────────────────────────────────────────────── */
export default function SitemapPage() {
  return (
    <div style={{ background: '#0C0A07', minHeight: '100vh', color: TEXT }}>

      {/* Ambient top glow — matches landing page */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 420, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at top, rgba(212,135,10,0.048) 0%, transparent 70%)',
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: '72px 24px 48px' }}>

        {/* ── Page header ── */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
            fontFamily: MONO, fontSize: 11, color: AMBER,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
            Site Structure
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
          </div>

          <h1 style={{
            fontFamily: SERIF,
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 700, color: TEXT, lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}>
            Sitemap
          </h1>

          <p style={{
            fontFamily: MONO, fontSize: 13, color: TEXT_MUTED,
            marginTop: 14, letterSpacing: '0.025em',
          }}>
            Every page and section of GazeFocus, mapped in one place.
          </p>
        </div>

        {/* ── Visual tree ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Root node */}
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            background: AMBER_ROOT,
            border: `1px solid ${AMBER}`,
            padding: '11px 28px',
            textDecoration: 'none',
          }}>
            <Logo size={22} />
            <span style={{ fontFamily: SERIF, fontSize: '1.2rem', fontWeight: 700, color: TEXT }}>
              GazeFocus
            </span>
            <span style={{
              fontFamily: MONO, fontSize: 9.5, color: AMBER,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: 'rgba(212,135,10,0.12)', padding: '2px 7px',
            }}>
              HOME
            </span>
          </Link>

          {/* Stem from root down to horizontal branch */}
          <div style={{ width: 1, height: 44, background: AMBER_LINE }} />

          {/* ── Branch section ── */}
          {/* Position: relative so we can overlay the horizontal connector line */}
          <div style={{ position: 'relative', width: '100%' }}>

            {/*
              Horizontal connector line spanning from center of col-1 to center of col-3.
              With display:grid and 3 equal columns (1fr 1fr 1fr) and no gap,
              the centers fall at exactly  1/6 (16.67%),  3/6 (50%),  5/6 (83.33%).
              So the line goes from left=16.67% to right=16.67% (width=66.67%).
            */}
            <div style={{
              position: 'absolute', top: 0,
              left: 'calc(100% / 6)',
              right: 'calc(100% / 6)',
              height: 1,
              background: AMBER_LINE,
              zIndex: 0,
            }} />

            {/* 3 category columns — no gap so center math stays exact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

              {categories.map((cat) => (
                <div key={cat.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '0 16px',
                }}>

                  {/* Vertical drop from horizontal line down to category card */}
                  <div style={{ width: 1, height: 44, background: AMBER_LINE }} />

                  {/* Category header card */}
                  <div style={{
                    background: 'rgba(255,255,255,0.022)',
                    border: `1px solid ${cat.catBorder}`,
                    padding: '10px 20px',
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: 230,
                  }}>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: cat.badgeFg, background: cat.badgeBg,
                      padding: '2px 8px', marginBottom: 7,
                    }}>
                      {cat.badge}
                    </span>
                    <div style={{ fontFamily: SERIF, fontSize: '1.05rem', fontWeight: 600, color: TEXT }}>
                      {cat.label}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT_MUTED, marginTop: 3 }}>
                      {cat.pages.length} page{cat.pages.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Vertical connector from category to pages */}
                  <div style={{ width: 1, height: 30, background: AMBER_LINE }} />

                  {/* Page cards */}
                  <div style={{
                    width: '100%',
                    ...(cat.id === 'app'
                      ? { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }
                      : { display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 230 }),
                  }}>
                    {cat.pages.map((page) => {
                      const Icon = page.icon
                      return (
                        <Link
                          key={page.href}
                          href={page.href}
                          className="group"
                          style={{
                            display: 'flex', flexDirection: 'column', gap: 4,
                            background: AMBER_CARD,
                            border: `1px solid ${AMBER_BDR}`,
                            padding: '8px 10px',
                            textDecoration: 'none',
                            transition: 'background 0.18s, border-color 0.18s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon size={11} style={{ color: AMBER, flexShrink: 0 }} />
                            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: TEXT_DIM }}>
                              {page.label}
                            </span>
                          </div>
                          <span style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT_MUTED, lineHeight: 1.5 }}>
                            {page.desc}
                          </span>
                        </Link>
                      )
                    })}
                  </div>

                </div>
              ))}

            </div>
          </div>

        </div>

        {/* XML sitemap note */}
        <div style={{
          textAlign: 'center', marginTop: 64,
          fontFamily: MONO, fontSize: 11, color: TEXT_MUTED,
          letterSpacing: '0.06em',
        }}>
          Machine-readable version:{' '}
          <a
            href="/sitemap.xml"
            style={{ color: AMBER, textDecoration: 'none', borderBottom: `1px solid ${AMBER_LINE}` }}
          >
            sitemap.xml
          </a>
        </div>

        {/* Bottom rule */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,135,10,0.15), transparent)',
          marginTop: 48,
        }} />

      </main>

      <SiteFooter />
    </div>
  )
}
