'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Play, ListVideo, FolderOpen, CalendarDays, Users, Settings, FileText, Link2 } from 'lucide-react'
import { MobileHeader } from './MobileHeader'
import { MobileFooter } from './MobileFooter'

interface MobileMainLayoutProps {
  children: React.ReactNode
}

// Mirrors the desktop sidebar's destinations (dashboard, search (header),
// calendar, videos, playlists, resources, channels, notes, settings,
// folders). The header carries search; the nav carries the rest. 9 items
// in rows of four keeps every touch target comfortable on small screens.
const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/videos', label: 'Videos', icon: Play },
  { href: '/playlists', label: 'Lists', icon: ListVideo },
  { href: '/resources', label: 'Links', icon: Link2 },
  { href: '/folders', label: 'Folders', icon: FolderOpen },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/channels', label: 'Channels', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileMainLayout({ children }: MobileMainLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-[100dvh] bg-background">
      <MobileHeader />
      <div className="mx-auto w-full max-w-lg px-3 pt-20 pb-32">
        <main className="min-h-[calc(100dvh-220px)]">{children}</main>
        <MobileFooter />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                id={`onboarding-mobile-nav-${
                  item.href === '/dashboard'
                    ? 'dashboard'
                    : item.href === '/videos'
                    ? 'videos'
                    : item.href === '/playlists'
                    ? 'playlists'
                    : item.href === '/resources'
                    ? 'resources'
                    : item.href === '/folders'
                    ? 'folders'
                    : item.href === '/calendar'
                    ? 'calendar'
                    : item.href === '/notes'
                    ? 'notes'
                    : item.href === '/channels'
                    ? 'channels'
                    : 'settings'
                }`}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
