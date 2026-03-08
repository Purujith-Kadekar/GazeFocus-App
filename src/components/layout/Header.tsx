'use client'

import { useState } from 'react'
import { Search, Plus, Bell, Menu, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useUIStore, useEyeTrackingStore, useFolderStore } from '@/store/useStore'
import { SearchModal } from '@/components/search/SearchModal'
import { AddContentModal } from '@/components/search/AddContentModal'

export function Header() {
  const { toggleSidebar, isSidebarOpen } = useUIStore()
  const { isEnabled: eyeTrackingEnabled, setEnabled: setEyeTrackingEnabled, isCalibrated, isLookingAtScreen } = useEyeTrackingStore()
  const { folders } = useFolderStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return [
            { id: '1', title: 'Video ready', message: 'Your video is ready to watch', time: '2 min ago', read: false },
            { id: '2', title: 'Progress milestone', message: 'You completed 5 videos this week!', time: '1 hour ago', read: false },
            { id: '3', title: 'New features', message: 'Check out the new note-taking feature', time: '1 day ago', read: true },
          ]
        }
      }
    }
    return [
      { id: '1', title: 'Video ready', message: 'Your video is ready to watch', time: '2 min ago', read: false },
      { id: '2', title: 'Progress milestone', message: 'You completed 5 videos this week!', time: '1 hour ago', read: false },
      { id: '3', title: 'New features', message: 'Check out the new note-taking feature', time: '1 day ago', read: true },
    ]
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const clearAllNotifications = () => {
    setNotifications([])
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify([]))
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Spacer for mobile */}
        <div className="md:hidden w-8" />

        {/* Search Bar - Center */}
        <div className="flex-1 max-w-md mx-auto">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground bg-background border border-border hover:bg-accent hover:text-accent-foreground dark:border-white/30"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Search playlists and videos...</span>
            <span className="sm:hidden">Search...</span>
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Add Content Button */}
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Content</span>
          </Button>

          {/* Eye Tracking Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={eyeTrackingEnabled ? 'default' : 'outline'}
                  size="icon"
                  className={eyeTrackingEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
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
                {eyeTrackingEnabled && (
                  <p className="text-xs text-muted-foreground">
                    {isCalibrated ? 'Calibrated' : 'Not calibrated'}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
                  >
                    {unreadCount}
                  </Badge>
                )}
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
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
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
        </div>
      </header>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <AddContentModal open={isAddOpen} onOpenChange={setIsAddOpen} folders={folders} />
    </>
  )
}
