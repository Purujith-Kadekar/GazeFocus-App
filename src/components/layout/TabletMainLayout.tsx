'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Play, ListVideo, FolderOpen, Search, Settings } from 'lucide-react'
import { Header } from './Header'

interface TabletMainLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/videos', label: 'Videos', icon: Play },
  { href: '/playlists', label: 'Playlists', icon: ListVideo },
  { href: '/folders', label: 'Folders', icon: FolderOpen },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function TabletMainLayout({ children }: TabletMainLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto w-full max-w-6xl px-5 py-5">
        <div className="mb-5 rounded-3xl border border-border bg-card/80 p-2 shadow-sm backdrop-blur">
          <div className="grid grid-cols-6 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <main className="min-h-[calc(100vh-190px)]">{children}</main>
      </div>
    </div>
  )
}
