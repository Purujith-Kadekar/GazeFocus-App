'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Play,
  CheckCircle,
  FileText,
  Clock,
  Flame,
  TrendingUp,
  BookOpen,
  ListVideo,
  FolderOpen,
  MoreVertical,
  Trash2,
  Edit3,
  Star,
  Target,
  Users,
  Radio,
  RefreshCw,
} from 'lucide-react'
import { StatsCard } from './StatsCard'
import { ContinueWatching } from './ContinueWatching'
import { RecentFolders } from './RecentFolders'
import { PlaylistsSection } from './PlaylistsSection'
import { TodoList } from './TodoList'
import { ReminderDialog } from './ReminderDialog'
import DashboardSkeleton from './DashboardSkeleton'
import { useReminderChecker } from '@/hooks/useReminderChecker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFolderStore, useVideoStore, useNoteStore, useDashboardStore, useUIStore, useTodoStore } from '@/store/useStore'
import { formatWatchTime, cn } from '@/lib/utils'
import { getDashboardBootstrapCache, isDashboardBootstrapCacheFresh, setDashboardBootstrapCache } from '@/lib/dashboard-bootstrap-cache'
import type { Video, Note, Folder, Playlist, Channel, ChannelWithFolder } from '@/types'

type PlaylistWithFolder = Playlist & { folderId: string | null }

interface DashboardStats {
  totalPlaylists: number
  completedPlaylists: number
  totalVideos: number
  watchedVideos: number
  weeklyVideosWatched: number
  totalNotes: number
  importantNotes: number
  totalWatchTime: number
  streak: number
  longestStreak?: number
  totalChannels: number
  liveChannels: number
}

interface DashboardBootstrapResponse {
  userId: string
  folders: Folder[]
  videos: Video[]
  notes: Note[]
  stats: DashboardStats
  completedVideos: string[]
  playlists: PlaylistWithFolder[]
  completedPlaylists: string[]
  todos: any[]
  settings: { weeklyGoal?: number } | null
  channels: Channel[]
}

export function Dashboard() {
  const router = useRouter()
  const { folders, setFolders } = useFolderStore()
  const { videos, setVideos } = useVideoStore()
  const { notes, setNotes } = useNoteStore()
  const { stats, setStats, setRecentVideos, setRecentFolders, setImportantNotes } = useDashboardStore()
  const { setCurrentView, setAddModalOpen, setDashboardBootLoading } = useUIStore()
  const { setTodos } = useTodoStore()
  const [isLoading, setIsLoading] = useState(() => !getDashboardBootstrapCache()?.payload)
  const { dueTodos, dialogOpen, setDialogOpen, dismissReminder, dismissAll } = useReminderChecker()

  const [playlists, setPlaylists] = useState<PlaylistWithFolder[]>([])
  const [completedPlaylists, setCompletedPlaylists] = useState<Set<string>>(new Set())
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set())
  const [weeklyGoal, setWeeklyGoal] = useState(10)
  const [channels, setChannels] = useState<Channel[]>([])
  const [isRefreshingLive, setIsRefreshingLive] = useState(false)
  const hasPrefetchedRoutes = useRef(false)

  const applyBootstrapData = useCallback((data: DashboardBootstrapResponse) => {
    setFolders(data.folders || [])
    setVideos(data.videos || [])
    setNotes(data.notes || [])
    setRecentVideos((data.videos || []).slice(0, 6))
    setRecentFolders((data.folders || []).slice(0, 4))
    setImportantNotes((data.notes || []).filter((n: Note) => n.isImportant).slice(0, 4))

    setPlaylists(data.playlists || [])
    setCompletedVideos(new Set(data.completedVideos || []))
    setCompletedPlaylists(new Set(data.completedPlaylists || []))
    setTodos(data.todos || [])
    setChannels(data.channels || [])

    if (data.settings?.weeklyGoal != null) {
      setWeeklyGoal(data.settings.weeklyGoal)
    }

    setStats({
      totalPlaylists: data.stats?.totalPlaylists ?? 0,
      completedPlaylists: data.stats?.completedPlaylists ?? 0,
      totalVideos: data.stats?.totalVideos ?? 0,
      watchedVideos: data.stats?.watchedVideos ?? 0,
      weeklyVideosWatched: data.stats?.weeklyVideosWatched ?? 0,
      totalNotes: data.stats?.totalNotes ?? 0,
      importantNotes: data.stats?.importantNotes ?? 0,
      totalWatchTime: data.stats?.totalWatchTime ?? 0,
      streak: data.stats?.streak ?? 0,
      longestStreak: data.stats?.longestStreak ?? 0,
      totalChannels: data.stats?.totalChannels ?? 0,
      liveChannels: data.stats?.liveChannels ?? 0,
    })
  }, [setFolders, setImportantNotes, setNotes, setRecentFolders, setRecentVideos, setStats, setTodos, setVideos])

  const fetchDashboardData = useCallback((bootLoad = false) => {
    if (bootLoad) {
      setDashboardBootLoading(true)
    }

    return fetch('/api/dashboard/bootstrap', { cache: 'no-store' })
      .then(r => (r?.ok ? r.json() : null))
      .then((data: DashboardBootstrapResponse | null) => {
        if (!data) return
        applyBootstrapData(data)
        setDashboardBootstrapCache(data)
    }).catch(() => {
      // If requests fail, release loading state instead of freezing the skeleton.
    }).finally(() => {
      if (bootLoad) {
        setIsLoading(false)
        setDashboardBootLoading(false)
      }
    })
  }, [applyBootstrapData, setDashboardBootLoading])

  useEffect(() => {
    const cached = getDashboardBootstrapCache()
    if (cached?.payload) {
      applyBootstrapData(cached.payload as DashboardBootstrapResponse)
      setIsLoading(false)
      setDashboardBootLoading(false)
      // Refresh in background without showing skeleton.
      void fetchDashboardData(false)
      return () => {
        setDashboardBootLoading(false)
      }
    }

    void fetchDashboardData(true)
    return () => {
      setDashboardBootLoading(false)
    }
  }, [applyBootstrapData, fetchDashboardData, setDashboardBootLoading])

  useEffect(() => {
    const handleRefresh = () => fetchDashboardData()
    window.addEventListener('refresh-dashboard', handleRefresh)
    window.addEventListener('refresh-channels', handleRefresh)
    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh)
      window.removeEventListener('refresh-channels', handleRefresh)
    }
  }, [fetchDashboardData])

  useEffect(() => {
    if (isLoading || hasPrefetchedRoutes.current) return

    const staticRoutes = [
      '/videos',
      '/playlists',
      '/channels',
      '/notes',
      '/folders',
      '/search',
      '/calendar',
      '/settings',
    ]

    const dynamicRoutes = [
      ...folders.slice(0, 2).map((f) => `/folders/${f.id}`),
      ...playlists.slice(0, 2).map((p) => `/playlist/${p.id}`),
      ...channels.slice(0, 2).map((c) => `/channel/${c.id}`),
      ...videos.slice(0, 2).map((v) => `/video/${v.youtubeId}`),
    ]

    const routesToPrefetch = [...staticRoutes, ...dynamicRoutes]
    const uniqueRoutes = [...new Set(routesToPrefetch)]
    hasPrefetchedRoutes.current = true

    const runPrefetch = () => {
      uniqueRoutes.forEach((route, index) => {
        // Stagger prefetches to avoid network bursts and keep UI responsive.
        setTimeout(() => {
          router.prefetch(route)
        }, index * 80)
      })
    }

    if ('requestIdleCallback' in window) {
      ;(window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(runPrefetch)
    } else {
      setTimeout(runPrefetch, 120)
    }
  }, [isLoading, router, folders, playlists, channels, videos])

  useEffect(() => {
    if (channels.length === 0) return
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/channels/live-status')
        if (response.ok) {
          const data = await response.json()
          setChannels(prev => prev.map(channel => {
            const liveStatus = data.channels.find((c: any) => c.channelId === channel.id)
            if (liveStatus) {
              return {
                ...channel,
                isLive: liveStatus.isLive,
                liveVideoId: liveStatus.liveVideoId,
                liveTitle: liveStatus.liveTitle,
              }
            }
            return channel
          }))
          const currentStats = useDashboardStore.getState().stats
          if (currentStats) {
            setStats({
              ...currentStats,
              liveChannels: data.liveCount,
            })
          }
        }
      } catch (error) {
        console.error('Failed to refresh live status:', error)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [channels.length])

  const handleRefreshLiveStatus = async () => {
    setIsRefreshingLive(true)
    try {
      const response = await fetch('/api/channels/live-status')
      if (response.ok) {
        const data = await response.json()
        setChannels(prev => prev.map(channel => {
          const liveStatus = data.channels.find((c: any) => c.channelId === channel.id)
          if (liveStatus) {
            return {
              ...channel,
              isLive: liveStatus.isLive,
              liveVideoId: liveStatus.liveVideoId,
              liveTitle: liveStatus.liveTitle,
            }
          }
          return channel
        }))
        const currentStats = useDashboardStore.getState().stats
        if (currentStats) {
          setStats({
            ...currentStats,
            liveChannels: data.liveCount,
          })
        }
      }
    } catch (error) {
      console.error('Failed to refresh live status:', error)
    } finally {
      setIsRefreshingLive(false)
    }
  }

  const handleVideoClick = (video: Video) => {
    router.push(`/video/${video.youtubeId}`)
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      const newNotes = notes.filter(n => n.id !== noteId)
      setNotes(newNotes)
      setImportantNotes(newNotes.filter((n: Note) => n.isImportant).slice(0, 4))
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const handleToggleNoteImportant = async (note: Note) => {
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isImportant: !note.isImportant })
      })
      if (res.ok) {
        const updated = await res.json()
        const newNotes = notes.map(n => n.id === note.id ? updated : n)
        setNotes(newNotes)
        setImportantNotes(newNotes.filter((n: Note) => n.isImportant).slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to toggle note important:', error)
    }
  }

  const handleNoteClick = (note: Note) => {
    if (note.youtubeId) {
      router.push(`/watch?v=${note.youtubeId}&t=${note.timestampSeconds || 0}`)
    }
  }

  if (isLoading) {
    return (
      <DashboardSkeleton loading={true}>
        <div />
      </DashboardSkeleton>
    )
  }

  const weeklyGoalProgress = stats ? Math.min(100, Math.round((stats.weeklyVideosWatched / weeklyGoal) * 100)) : 0

  return (
    <DashboardSkeleton loading={false}>
      <div className="space-y-6 reveal-stagger">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 reveal-stagger-item">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Continue your learning journey. You&apos;re on a {stats?.streak || 0} day streak!
          </p>
          {stats && stats.longestStreak > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Your longest streak: {stats.longestStreak} days
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-medium">{stats?.streak || 0} day streak</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start reveal-stagger-item">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="flex items-center h-[280px]">
            <CardContent className="p-5 space-y-3 w-full">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-1.5 bg-blue-500">
                  <Play className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold leading-none">{stats?.watchedVideos || 0}<span className="text-sm font-normal text-muted-foreground ml-1">/ {stats?.totalVideos || 0}</span></p>
                  <p className="text-sm text-muted-foreground">Videos Watched</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full p-1.5 bg-green-500">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold leading-none">{stats?.completedPlaylists || 0}<span className="text-sm font-normal text-muted-foreground ml-1">/ {stats?.totalPlaylists || 0}</span></p>
                  <p className="text-sm text-muted-foreground">Playlists Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full p-1.5 bg-purple-500">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold leading-none">{stats?.totalNotes || 0}<span className="text-sm font-normal text-muted-foreground ml-1">{stats?.importantNotes ? `${stats.importantNotes} important` : ''}</span></p>
                  <p className="text-sm text-muted-foreground">Notes Taken</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex items-center h-[280px]">
            <CardContent className="p-5 flex flex-col gap-4 w-full h-full">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-1.5 bg-orange-500">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold leading-none">{formatWatchTime(stats?.totalWatchTime || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Watch Time</p>
                </div>
              </div>
              <div className="mt-[2.7rem]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Weekly Goal</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{stats?.weeklyVideosWatched || 0}/{weeklyGoal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={weeklyGoalProgress} className="h-2 flex-1" />
                  <Badge variant={weeklyGoalProgress >= 100 ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {weeklyGoalProgress}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <TodoList />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6 reveal-stagger-item">
        <div className="lg:col-span-2">
          <ContinueWatching 
            videos={videos} 
            folders={folders}
            completedVideos={completedVideos}
            onVideoClick={handleVideoClick}
            onVideoCompletionChanged={fetchDashboardData}
            onVideoRemoved={(removedId) => setVideos(videos.filter(v => v.id !== removedId))}
          />
        </div>

        <div className="lg:col-span-1">
          <Card className="h-[500px] flex flex-col overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-1 px-4 shrink-0 bg-muted/5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 leading-tight">
                <FileText className="h-4 w-4 text-primary" />
                Recent Notes
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 px-3 text-sm" onClick={() => router.push('/notes')}>View All</Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1.5">

                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`group p-2 rounded-lg border cursor-pointer ${note.isImportant ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' : 'bg-muted/50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p 
                          className="text-sm font-medium line-clamp-2 flex-1 text-foreground"
                          onClick={() => handleNoteClick(note)}
                        >
                          {note.content}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleNoteImportant(note)
                              }}
                            >
                              <Star className={`mr-2 h-4 w-4 ${note.isImportant ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                              {note.isImportant ? 'Remove from important' : 'Mark as important'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push('/notes')
                              }}
                            >
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNote(note.id)
                              }}
                              className="bg-destructive text-white focus:bg-destructive/80 focus:text-white"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {note.isImportant && (
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {note.youtubeId ? (
                            <>
                              {Math.floor((note.timestampSeconds || 0) / 60)}:{((note.timestampSeconds || 0) % 60).toString().padStart(2, '0')}
                            </>
                          ) : (
                            new Date(note.createdAt).toLocaleDateString()
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                      <FileText className="h-8 w-8 mb-2" />
                      <p className="text-sm">No notes yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="reveal-stagger-item">
        <PlaylistsSection 
          playlists={playlists}
          folders={folders}
          completedPlaylists={completedPlaylists}
          onPlaylistRemoved={() => {
            fetch('/api/folders').then(res => {
              if (res.ok) res.json().then(setFolders).catch(() => {})
            }).catch(() => {})
        }} />
      </div>

      <div className="reveal-stagger-item">
        <RecentFolders folders={folders} />
      </div>

      {channels.length > 0 && (
        <Card className="reveal-stagger-item">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Your Channels
              {(stats?.liveChannels ?? 0) > 0 && (
                <Badge className="bg-red-500 text-white ml-2 animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  {stats?.liveChannels} Live
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefreshLiveStatus} disabled={isRefreshingLive}>
                <RefreshCw className={cn('h-4 w-4 mr-1', isRefreshingLive && 'animate-spin')} />
                {isRefreshingLive ? 'Refreshing...' : 'Check Live'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/channels')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {channels.slice(0, 6).map((channel) => (
                <div
                  key={channel.id}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => router.push(`/channel/${channel.id}`)}
                >
                  <div className={cn(
                    'relative w-20 h-20 rounded-full overflow-hidden bg-muted',
                    channel.isLive && 'ring-4 ring-red-500'
                  )}>
                    {channel.thumbnail ? (
                      <Image
                        src={channel.thumbnail}
                        alt={channel.title}
                        fill
                        sizes="80px"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {channel.isLive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Badge className="bg-red-600 text-white text-[10px] animate-pulse">
                          <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          LIVE
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-center line-clamp-2 w-full group-hover:text-primary transition-colors">
                    {channel.title}
                  </p>
                  {channel.isLive && channel.liveTitle && (
                    <p className="text-xs text-red-500 text-center line-clamp-1 w-full">
                      {channel.liveTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="reveal-stagger-item">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.push('/folders')}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Browse Folders
            </Button>
            <Button variant="outline" onClick={() => setAddModalOpen(true)}>
              <ListVideo className="mr-2 h-4 w-4" />
              Add Content
            </Button>
            <Button variant="outline" onClick={() => router.push('/search')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Browse Videos
            </Button>
          </div>
        </CardContent>
      </Card>
      <ReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dueTodos={dueTodos}
        onDismiss={dismissReminder}
        onDismissAll={dismissAll}
      />
      </div>
    </DashboardSkeleton>
  )
}
