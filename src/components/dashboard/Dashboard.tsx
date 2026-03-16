'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { StatsCard } from './StatsCard'
import { ContinueWatching } from './ContinueWatching'
import { RecentFolders } from './RecentFolders'
import { PlaylistsSection } from './PlaylistsSection'
import { TodoList } from './TodoList'
import { ReminderDialog } from './ReminderDialog'
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
import { formatWatchTime } from '@/lib/utils'
import type { Video, Note, Folder, Playlist } from '@prisma/client'

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
}

export function Dashboard() {
  const router = useRouter()
  const { folders, setFolders } = useFolderStore()
  const { videos, setVideos } = useVideoStore()
  const { notes, setNotes } = useNoteStore()
  const { stats, setStats, setRecentVideos, setRecentFolders, setImportantNotes } = useDashboardStore()
  const { setCurrentView, setAddModalOpen } = useUIStore()
  const { setTodos } = useTodoStore()
  const [isLoading, setIsLoading] = useState(true)
  const { dueTodos, dialogOpen, setDialogOpen, dismissReminder, dismissAll } = useReminderChecker()

  const [playlists, setPlaylists] = useState<PlaylistWithFolder[]>([])
  const [completedPlaylists, setCompletedPlaylists] = useState<Set<string>>(new Set())
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set())
  const [weeklyGoal, setWeeklyGoal] = useState(10)

  const fetchDashboardData = useCallback(() => {
    return Promise.all([
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'daily_checkin' }),
      }).then(r => r?.ok ? r.json() : null).catch(() => null),
      fetch('/api/folders').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/videos').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/notes').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/progress').then(r => r?.ok ? r.json() : {}).catch(() => {}),
      fetch('/api/progress/complete').then(r => r?.ok ? r.json() : { completedVideos: [] }).catch(() => ({ completedVideos: [] })),
      fetch('/api/playlists').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/playlists/complete').then(r => r?.ok ? r.json() : { completedPlaylists: [] }).catch(() => ({ completedPlaylists: [] })),
      fetch('/api/todos').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/settings', { cache: 'no-store' }).then(r => r?.ok ? r.json() : null).catch(() => null),
    ]).then(([activityData, foldersData, videosData, notesData, statsData, completedVideosData, playlistsData, completedData, todosData, settingsData]) => {
      setFolders(foldersData)
      setVideos(videosData)
      setNotes(notesData)
      setPlaylists(playlistsData)
      setCompletedVideos(new Set(completedVideosData.completedVideos || []))
      setCompletedPlaylists(new Set(completedData.completedPlaylists || []))
      setTodos(todosData)
      if (settingsData?.weeklyGoal != null) setWeeklyGoal(settingsData.weeklyGoal)
      setRecentVideos(videosData.slice(0, 6))
      setRecentFolders(foldersData.slice(0, 4))
      setImportantNotes(notesData.filter((n: Note) => n.isImportant).slice(0, 4))
      const progress = statsData as DashboardStats
      setStats({
        totalPlaylists: progress?.totalPlaylists ?? 0,
        completedPlaylists: progress?.completedPlaylists ?? 0,
        totalVideos: progress?.totalVideos ?? 0,
        watchedVideos: progress?.watchedVideos ?? 0,
        weeklyVideosWatched: progress?.weeklyVideosWatched ?? 0,
        totalNotes: progress?.totalNotes ?? 0,
        importantNotes: progress?.importantNotes ?? 0,
        totalWatchTime: progress?.totalWatchTime ?? 0,
        streak: activityData?.streak ?? progress?.streak ?? 0,
        longestStreak: activityData?.longestStreak ?? progress?.longestStreak ?? 0,
      })
    }).catch(() => {})
  }, [setFolders, setVideos, setNotes, setTodos, setRecentVideos, setRecentFolders, setImportantNotes, setStats])

  useEffect(() => {
    fetchDashboardData().finally(() => setIsLoading(false))
  }, [fetchDashboardData])

  // Listen for content additions from AddContentModal / SearchModal
  useEffect(() => {
    const handleRefresh = () => fetchDashboardData()
    window.addEventListener('refresh-dashboard', handleRefresh)
    return () => window.removeEventListener('refresh-dashboard', handleRefresh)
  }, [fetchDashboardData])

  const handleVideoClick = (video: Video) => {
    useVideoStore.getState().setCurrentVideo(video)
    setCurrentView('video')
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const weeklyGoalProgress = stats ? Math.min(100, Math.round((stats.weeklyVideosWatched / weeklyGoal) * 100)) : 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

      {/* Stats + Todo Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Stats on the left */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Combined Stats Card */}
          <Card className="flex items-center">
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

          {/* Watch Time + Weekly Goal Card */}
          <Card className="flex items-center">
            <CardContent className="p-5 flex flex-col gap-5 w-full">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-1.5 bg-orange-500">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold leading-none">{formatWatchTime(stats?.totalWatchTime || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Watch Time</p>
                </div>
              </div>
              <div>
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

        {/* Todo List on the right */}
        <div className="min-h-0">
          <TodoList />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Videos - Takes 2 columns */}
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

        {/* Notes & Todos */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Notes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>View All</Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[320px] pr-4 text-left">
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`group p-3 rounded-lg border cursor-pointer ${note.isImportant ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' : 'bg-muted/50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p 
                          className="text-sm line-clamp-2 flex-1"
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
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Playlists Section */}
      <PlaylistsSection 
        playlists={playlists}
        folders={folders}
        completedPlaylists={completedPlaylists}
        onPlaylistRemoved={() => {
          fetch('/api/folders').then(res => {
            if (res.ok) res.json().then(setFolders).catch(() => {})
          }).catch(() => {})
      }} />

      {/* Folders */}
      <RecentFolders folders={folders} />

      {/* Quick Actions */}
      <Card>
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
  )
}
