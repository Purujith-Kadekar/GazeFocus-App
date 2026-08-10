'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { endRouteLoading, startRouteTopLoader } from './RouteTopLoader'
import { clearUserData } from '@/lib/logout'
import {
  Home,
  FolderOpen,
  Search,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Film,
  LogOut,
  User,
  ListVideo,
  FileText,
  GripVertical,
  Eye,
  EyeOff,
  Calendar,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDashboardBootstrapCache, isDashboardBootstrapCacheFresh } from '@/lib/dashboard-bootstrap-cache'
import { useUIStore, useFolderStore, useAuthStore, useEyeTrackingStore, usePlaylistStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/layout/Logo'


import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CreateFolderModal } from '@/components/folders/CreateFolderModal'
import { ProfileModal } from '@/components/profile/ProfileModal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Folder, Playlist, LibraryItem } from '@/types'

interface SidebarProps {
  className?: string
}

interface SortableFolderProps {
  folder: Folder
  isExpanded: boolean
  isSidebarOpen: boolean
  selectedFolder: Folder | null
  pathname: string
  expandedFolders: Set<string>
  folderItems: LibraryItem[]
  onFolderClick: (folder: Folder) => void
  onToggleExpand: (folderId: string) => void
  onItemClick: (item: LibraryItem) => void
}

function SortableFolder({
  folder,
  isExpanded,
  isSidebarOpen,
  selectedFolder,
  pathname,
  expandedFolders,
  folderItems,
  onFolderClick,
  onToggleExpand,
  onItemClick,
}: SortableFolderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  const isActiveFolder = selectedFolder?.id === folder.id || pathname === `/folders/${folder.id}`

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          'flex items-center gap-2',
          !isSidebarOpen && 'justify-center'
        )}
      >
        {isSidebarOpen && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-accent rounded"
            aria-label={`Reorder folder ${folder.title}`}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <Button
          variant={isActiveFolder ? 'secondary' : 'ghost'}
          className={cn(
            'flex-1 justify-start gap-3',
            isActiveFolder && 'bg-primary/18 text-foreground border border-primary/40 shadow-sm hover:bg-primary/22',
            !isSidebarOpen && 'justify-center px-2 w-full'
          )}
          onClick={() => onFolderClick(folder)}
        >
          {isSidebarOpen ? (
            <>
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{folder.title}</span>
            </>
          ) : (
            <FolderOpen className="h-4 w-4 shrink-0" />
          )}
        </Button>
      </div>
      
      {isSidebarOpen && isExpanded && folderItems.length > 0 && (
        <div className="ml-6 mt-1 space-y-1">
          {folderItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 h-8 text-muted-foreground"
              onClick={() => onItemClick(item)}
            >
              {item.type === 'PLAYLIST' ? (
                <ListVideo className="h-3 w-3" />
              ) : (
                <Film className="h-3 w-3" />
              )}
              <span className="truncate text-xs">{item.title}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isSidebarOpen, toggleSidebar, setCurrentView, isDashboardBootLoading } = useUIStore()
  const { folders, selectedFolder, selectFolder, setFolders } = useFolderStore()
  const { playlists, setPlaylists } = usePlaylistStore()
  const { user, logout } = useAuthStore()
  const { isEnabled, isTracking, isFaceDetected, isLookingAtScreen, cameraStream } = useEyeTrackingStore()
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set<string>())
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [isFoldersSectionOpen, setIsFoldersSectionOpen] = useState(true)
  const [isSidebarFoldersLoading, setIsSidebarFoldersLoading] = useState(true)
  const [hasCompletedInitialFolderLoad, setHasCompletedInitialFolderLoad] = useState(false)

  // Auto-collapse folders when tracking starts (Watch Mode)
  useEffect(() => {
    if (isTracking) {
      setIsFoldersSectionOpen(false)
    } else {
      setIsFoldersSectionOpen(true)
    }
  }, [isTracking])

  // Sync camera stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream, isTracking])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    let active = true

    const fetchFolders = async () => {
      // If folders are already hydrated by MainLayout/dashboard, don't block sidebar rendering.
      if (folders.length > 0) {
        if (active) {
          setIsSidebarFoldersLoading(false)
          setHasCompletedInitialFolderLoad(true)
        }
        return
      }

      // Reuse the same bootstrap payload that powers fast dashboard refresh.
      const bootstrapCache = getDashboardBootstrapCache()
      if (bootstrapCache && isDashboardBootstrapCacheFresh(2 * 60 * 1000)) {
        const cachedFolders = Array.isArray(bootstrapCache.payload?.folders)
          ? (bootstrapCache.payload.folders as Folder[])
          : []

        if (active) {
          setFolders(cachedFolders)
          setIsSidebarFoldersLoading(false)
          setHasCompletedInitialFolderLoad(true)
        }
        return
      }

      setIsSidebarFoldersLoading(true)
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      try {
        const controller = new AbortController()
        timeoutId = setTimeout(() => controller.abort(), 6000)
        const res = await fetch('/api/folders', { signal: controller.signal })
        if (active && res.ok) {
          const foldersData = await res.json()
          setFolders(Array.isArray(foldersData) ? foldersData : [])
        }
      } catch (error) {
        console.error('Failed to fetch folders for sidebar:', error)
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        if (active) {
          setIsSidebarFoldersLoading(false)
          setHasCompletedInitialFolderLoad(true)
        }
      }
    }

    const fetchLibraryItems = async () => {
      try {
        const res = await fetch('/api/library-items')
        if (active && res.ok) {
          const itemsData = await res.json()
          setLibraryItems(Array.isArray(itemsData) ? itemsData : [])
        }
      } catch (error) {
        console.error('Failed to fetch library items for sidebar:', error)
      }
    }

    void fetchFolders()
    void fetchLibraryItems()

    return () => {
      active = false
    }
  }, [folders.length, setFolders])

  const toggleFolderExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleLogout = async () => {
    await clearUserData()
  }

  const handleFolderClick = (folder: Folder) => {
    router.push(`/folders/${folder.id}`)
  }

  const handlePlaylistClick = (playlist: Playlist) => {
    router.push(`/playlist/${playlist.id}`)
  }

  const handleProfileClick = () => {
    setIsProfileOpen(true)
  }

  const handleItemClick = (item: LibraryItem) => {
    if (item.type === 'PLAYLIST') {
      router.push(`/playlist/${item.externalId}`)
    } else {
      router.push(`/watch?v=${item.externalId}`)
    }
  }

  const safeFolders = (Array.isArray(folders) ? folders : []).filter(
    (folder): folder is Folder => Boolean(folder && typeof folder.id === 'string')
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = safeFolders.findIndex((item) => item.id === active.id)
      const newIndex = safeFolders.findIndex((item) => item.id === over.id)

      if (oldIndex < 0 || newIndex < 0) {
        return
      }

      const newFolders = arrayMove(safeFolders, oldIndex, newIndex)
      
      setFolders(newFolders)
      
      const folderIds = newFolders.map((item) => item.id)
      
      fetch('/api/folders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderIds }),
      }).catch(console.error)
    }
  }, [safeFolders, setFolders])

  const shouldShowSidebarFolderSkeleton =
    isSidebarOpen &&
    isFoldersSectionOpen &&
    (
      isSidebarFoldersLoading ||
      (pathname === '/dashboard' && isDashboardBootLoading && safeFolders.length === 0 && !hasCompletedInitialFolderLoad)
    )

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 z-40 h-screen border-r border-b bg-background shrink-0',
          isSidebarOpen ? 'w-64' : 'w-16',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-4">
            {isSidebarOpen ? (
              <Link href="/dashboard" className="flex items-center gap-2">
                <Logo size={32} />
                <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.05rem', color: '#F2EDE4' }}>
                  GazeFocus
                </span>
              </Link>
            ) : (
              <Link href="/dashboard" className="flex items-center justify-center">
                <Logo size={32} />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn('h-8 w-8', !isSidebarOpen && 'mx-auto')}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="space-y-1">
              <NavItem
                id="onboarding-dashboard"
                icon={Home}
                label="Dashboard"
                collapsed={!isSidebarOpen}
                active={pathname === '/dashboard'}
                href="/dashboard"
              />
              <NavItem
                id="onboarding-search"
                icon={Search}
                label="Search"
                collapsed={!isSidebarOpen}
                active={pathname.startsWith('/search')}
                href="/search"
              />
              <NavItem
                id="onboarding-calendar"
                icon={Calendar}
                label="Calendar"
                collapsed={!isSidebarOpen}
                href="/calendar"
                active={pathname === '/calendar'}
              />
              <NavItem
                id="onboarding-videos"
                icon={Film}
                label="Videos"
                collapsed={!isSidebarOpen}
                href="/videos"
                active={pathname === '/videos' || pathname.startsWith('/video/')}
              />
              <NavItem
                id="onboarding-playlists"
                icon={ListVideo}
                label="Playlists"
                collapsed={!isSidebarOpen}
                href="/playlists"
                active={pathname === '/playlists' || pathname.startsWith('/playlist/')}
              />
              <NavItem
                id="onboarding-channels"
                icon={Users}
                label="Channels"
                collapsed={!isSidebarOpen}
                href="/channels"
                active={pathname === '/channels' || pathname.startsWith('/channel/')}
              />
              <NavItem
                id="onboarding-notes"
                icon={FileText}
                label="Notes"
                collapsed={!isSidebarOpen}
                href="/notes"
                active={pathname.startsWith('/notes')}
              />
            </nav>

            <Separator className="my-4" />

            {isSidebarOpen && (
              <div id="onboarding-folders" className="mb-2 flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
                  onClick={() => setIsFoldersSectionOpen(!isFoldersSectionOpen)}
                >
                  {isFoldersSectionOpen ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  Folders
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsCreateFolderOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isFoldersSectionOpen && (

            shouldShowSidebarFolderSkeleton ? (
              <div className="space-y-2 px-2 py-1">
                <div className="h-8 w-full rounded-xl skeleton-shimmer boneyard-accent-bone" />
                <div className="h-8 w-full rounded-xl skeleton-shimmer boneyard-accent-bone" />
                <div className="h-8 w-full rounded-xl skeleton-shimmer boneyard-accent-bone" />
              </div>
            ) : (

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={safeFolders.map((f) => f.id)} 
                strategy={verticalListSortingStrategy}
              >
                <nav className="space-y-1">
                  {safeFolders.map((folder) => {
                    const isExpanded = expandedFolders.has(folder.id)
                    const folderItems = libraryItems.filter(item => item.folderId === folder.id)
                    
                    return (
                      <SortableFolder
                        key={folder.id}
                        folder={folder}
                        isExpanded={isExpanded}
                        isSidebarOpen={isSidebarOpen}
                        selectedFolder={selectedFolder}
                        pathname={pathname}
                        expandedFolders={expandedFolders}
                        folderItems={folderItems}
                        onFolderClick={handleFolderClick}
                        onToggleExpand={toggleFolderExpand}
                        onItemClick={handleItemClick}
                      />
                    )
                  })}
                  {safeFolders.length === 0 && isSidebarOpen && (
                    <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No folders yet. Create one to organize your playlists.
                    </p>
                  )}
                </nav>
              </SortableContext>
            </DndContext>
            )
            )}

            <Separator className="my-4" />

            <nav className="space-y-1">
              <NavItem
                id="onboarding-settings"
                icon={Settings}
                label="Settings"
                collapsed={!isSidebarOpen}
                active={pathname.startsWith('/settings')}
                onClick={() => router.push('/settings')}
              />
            </nav>

            {/* Camera Preview Area - Only shown during tracking */}
            {isTracking && (
              <div className="px-2 mt-4 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={cn(
                  "relative rounded-xl overflow-hidden bg-black border-2 transition-all duration-300",
                  isLookingAtScreen 
                    ? "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                    : "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                )}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-video object-cover scale-x-[-1]"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-1 right-1 flex gap-1">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      isLookingAtScreen ? "bg-green-500 animate-pulse" : "bg-red-500"
                    )} />
                  </div>
                  
                  {!isLookingAtScreen && (
                    <div className="absolute inset-0 bg-red-500/10 backdrop-none pointer-events-none flex items-center justify-center">
                      <EyeOff className="h-6 w-6 text-red-500/50" />
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <p className={cn(
                    "text-[10px] text-center font-bold uppercase tracking-wider transition-colors",
                    isLookingAtScreen ? "text-green-500" : "text-red-500"
                  )}>
                    {isLookingAtScreen ? "Focus Locked" : "User Distracted"}
                  </p>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t bg-background/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-2',
                    !isSidebarOpen && 'justify-center px-2'
                  )}
                >
                  <Avatar className="h-6 w-6">
                    {user?.image && <AvatarImage src={user.image} />}
                    <AvatarFallback className="text-xs">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isSidebarOpen && (
                    <span className="truncate text-sm">{user?.name || user?.email}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <CreateFolderModal
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
      />

      <ProfileModal
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </>
  )
}

interface NavItemProps {
  href?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  collapsed: boolean
  active?: boolean
  onClick?: () => void
  id?: string
}

function NavItem({ href, icon: Icon, label, collapsed, active, onClick, id }: NavItemProps) {
  const router = useRouter()
  const pathname = usePathname()

  const getRefreshEventName = (targetHref: string) => {
    const targetPath = targetHref.split('?')[0]

    if (targetPath === '/dashboard') return 'refresh-dashboard'
    if (targetPath === '/videos') return 'refresh-videos'
    if (targetPath === '/playlists') return 'refresh-playlists'
    if (targetPath === '/channels') return 'refresh-channels'
    if (targetPath === '/folders') return 'refresh-folders'
    if (targetPath === '/notes') return 'refresh-notes'
    if (targetPath === '/calendar') return 'refresh-calendar'

    return null
  }

  const handleNavClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!href) {
      onClick?.()
      return
    }

    const currentPath = pathname.split('?')[0]
    const targetPath = href.split('?')[0]
    const isSamePage = currentPath === targetPath

    if (isSamePage) {
      event.preventDefault()

      if (targetPath === '/dashboard') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }

      const refreshEventName = getRefreshEventName(targetPath)
      if (refreshEventName) {
        startRouteTopLoader()
        window.dispatchEvent(new CustomEvent(refreshEventName))

        // Dashboard same-page clicks can be fully cache-resolved with no fetch.
        // Complete on next tick so the bar appears instantly and also ends instantly.
        if (targetPath === '/dashboard') {
          window.setTimeout(() => endRouteLoading(), 0)
        }
      }
      return
    }

    onClick?.()
  }

  const button = (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      className={cn(
        'w-full justify-start gap-3',
        active && 'bg-primary/18 text-foreground border border-primary/40 shadow-sm hover:bg-primary/22',
        collapsed && 'justify-center px-2'
      )}
      onClick={handleNavClick}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Button>
  )

  if (href) {
    return (
      <div id={id}>
        <Link
          href={href}
          prefetch
          onMouseEnter={() => router.prefetch(href)}
          onFocus={() => router.prefetch(href)}
        >
          {button}
        </Link>
      </div>
    )
  }

  return <div id={id}>{button}</div>
}
