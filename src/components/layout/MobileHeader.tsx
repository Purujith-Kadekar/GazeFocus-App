'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Bell, Eye, EyeOff, Settings, LogOut } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEyeTrackingStore, useFolderStore } from '@/store/useStore'
import { SearchModal } from '@/components/search/SearchModal'
import { AddContentModal } from '@/components/search/AddContentModal'
import { Logo } from './Logo'
import { clearUserData } from '@/lib/logout'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function MobileHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { isEnabled: eyeTrackingEnabled, setEnabled: setEyeTrackingEnabled } = useEyeTrackingStore()
  const { folders } = useFolderStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { data: session } = useSession()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const clearAllNotifications = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: unreadIds }),
        })
      } catch {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-full max-w-lg items-center gap-2 px-4">
          {/* Brand */}
          <Link id="onboarding-mobile-brand" href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Logo size={24} />
            <span className="text-sm font-semibold text-foreground">GazeFocus</span>
          </Link>

          {/* Search Bar - Center */}
          <div id="onboarding-search-bar" className="flex-1 min-w-0 mx-auto">
            <Button
              variant="outline"
              className="hidden w-full justify-start overflow-hidden border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:border-white/30 md:flex"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Search...</span>
            </Button>
          </div>

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Mobile Search Button */}
            <Button
              id="onboarding-mobile-search"
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              aria-label="Open search"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Add Content Button */}
            <Button id="onboarding-add-content" size="icon" className="h-9 w-9 sm:w-auto sm:px-3" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add</span>
            </Button>

            {/* Eye Tracking Status */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    id="onboarding-eye-tracking"
                    variant={eyeTrackingEnabled ? 'default' : 'outline'}
                    size="icon"
                    aria-label={eyeTrackingEnabled ? 'Disable eye tracking' : 'Enable eye tracking'}
                    className={`h-9 w-9 transition-colors duration-150 ${eyeTrackingEnabled ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => setEyeTrackingEnabled(!eyeTrackingEnabled)}
                  >
                    {eyeTrackingEnabled ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Eye Tracking {eyeTrackingEnabled ? 'On' : 'Off'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Notifications */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 transition-transform" aria-label="Open notifications menu">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground transition-opacity"
                    style={{ opacity: unreadCount > 0 ? 1 : 0 }}>
                    {unreadCount}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{notification.message}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-center justify-center text-sm text-muted-foreground cursor-pointer"
                  onClick={clearAllNotifications}
                >
                  Clear all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu - Show on mobile */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full transition-all duration-150" 
                  aria-label="User menu"
                >
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {session?.user?.name || 'User'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={async () => {
                  await clearUserData()
                }} className="text-red-500">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <AddContentModal open={isAddOpen} onOpenChange={setIsAddOpen} folders={folders} />
    </>
  )
}