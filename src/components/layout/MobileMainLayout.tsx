'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Play, ListVideo, FolderOpen, CalendarDays, Users, Settings } from 'lucide-react'
import { Header } from './Header'

interface MobileMainLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/videos', label: 'Videos', icon: Play },
  { href: '/playlists', label: 'Lists', icon: ListVideo },
  { href: '/folders', label: 'Folders', icon: FolderOpen },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/channels', label: 'Channels', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileMainLayout({ children }: MobileMainLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto w-full max-w-md px-3 py-3 pb-28">
        <main className="min-h-[calc(100vh-220px)]">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-7 gap-0.5 px-1 py-1.5">
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
                    : item.href === '/folders'
                    ? 'folders'
                    : item.href === '/calendar'
                    ? 'calendar'
                    : item.href === '/channels'
                    ? 'channels'
                    : 'settings'
                }`}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors ${
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
