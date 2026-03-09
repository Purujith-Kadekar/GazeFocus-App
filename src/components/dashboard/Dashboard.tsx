'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { StatsCard } from './StatsCard'
import { ContinueWatching } from './ContinueWatching'
import { RecentFolders } from './RecentFolders'
import { PlaylistsSection } from './PlaylistsSection'
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
import { useFolderStore, useVideoStore, useNoteStore, useDashboardStore, useUIStore } from '@/store/useStore'
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
  const [isLoading, setIsLoading] = useState(true)

  const [playlists, setPlaylists] = useState<PlaylistWithFolder[]>([])
  const [completedPlaylists, setCompletedPlaylists] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'daily_checkin' }),
      }).catch(() => {}),
      fetch('/api/folders').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/videos').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/notes').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/progress').then(r => r?.ok ? r.json() : {}).catch(() => {}),
      fetch('/api/playlists').then(r => r?.ok ? r.json() : []).catch(() => []),
      fetch('/api/playlists/complete').then(r => r?.ok ? r.json() : { completedPlaylists: [] }).catch(() => ({ completedPlaylists: [] })),
    ]).then(([, foldersData, videosData, notesData, statsData, playlistsData, completedData]) => {
      setFolders(foldersData)
      setVideos(videosData)
      setNotes(notesData)
      setPlaylists(playlistsData)
      setCompletedPlaylists(new Set(completedData.completedPlaylists || []))
      setRecentVideos(videosData.slice(0, 6))
      setRecentFolders(foldersData.slice(0, 4))
      setImportantNotes(notesData.filter((n: Note) => n.isImportant).slice(0, 4))
      const stats = statsData as DashboardStats
      setStats({
        totalPlaylists: stats?.totalPlaylists ?? 0,
        completedPlaylists: stats?.completedPlaylists ?? 0,
        totalVideos: stats?.totalVideos ?? 0,
        watchedVideos: stats?.watchedVideos ?? 0,
        weeklyVideosWatched: stats?.weeklyVideosWatched ?? 0,
        totalNotes: stats?.totalNotes ?? 0,
        importantNotes: stats?.importantNotes ?? 0,
        totalWatchTime: stats?.totalWatchTime ?? 0,
        streak: stats?.streak ?? 0,
        longestStreak: stats?.longestStreak ?? 0,
      })
    }).catch(() => {})
    .finally(() => {
      setIsLoading(false)
    })

    return () => {}
  }, [setFolders, setVideos, setNotes, setRecentVideos, setRecentFolders, setImportantNotes, setStats])

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

  const weeklyGoalProgress = stats ? Math.round((stats.weeklyVideosWatched / 10) * 100) : 0

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Videos Watched"
          value={stats?.watchedVideos || 0}
          subtitle={`of ${stats?.totalVideos || 0} total`}
          icon={Play}
          color="bg-blue-500"
        />
        <StatsCard
          title="Completed"
          value={stats?.completedPlaylists || 0}
          subtitle={`of ${stats?.totalPlaylists || 0} playlists`}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatsCard
          title="Notes Taken"
          value={stats?.totalNotes || 0}
          subtitle={`${stats?.importantNotes || 0} important`}
          icon={FileText}
          color="bg-purple-500"
        />
        <StatsCard
          title="Watch Time"
          value={formatWatchTime(stats?.totalWatchTime || 0)}
          subtitle="Total learning time"
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      {/* Weekly Goal */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Weekly Goal</h3>
              <p className="text-sm text-muted-foreground">
                Watch {stats?.weeklyVideosWatched || 0} of 10 videos this week
              </p>
            </div>
            <Badge variant={weeklyGoalProgress >= 100 ? "default" : "secondary"}>
              {weeklyGoalProgress}%
            </Badge>
          </div>
          <Progress value={weeklyGoalProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Videos - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ContinueWatching 
            videos={videos} 
            folders={folders}
            onVideoClick={handleVideoClick}
            onVideoRemoved={(removedId) => setVideos(videos.filter(v => v.id !== removedId))}
          />
        </div>

        {/* Notes */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Notes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>View All</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.slice(0, 4).map((note) => (
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
                          className="text-destructive"
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
    </div>
  )
}
