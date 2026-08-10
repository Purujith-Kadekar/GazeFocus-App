'use client'

import { useRouter } from 'next/navigation'
import Image from '@/components/ui/StableImage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardSkeleton from './DashboardSkeleton'
import { formatWatchTime, cn } from '@/lib/utils'
import type { DashboardStats, PlaylistWithFolder } from './dashboard-types'
import type { Folder, Note, Playlist, Video, Channel } from '@/types'
import { CheckCircle, Clock, Flame, CalendarDays, Play, Star } from 'lucide-react'

interface DashboardMobileProps {
  stats: DashboardStats | null
  weeklyGoal: number
  videos: Video[]
  notes: Note[]
  folders: Folder[]
  playlists: PlaylistWithFolder[]
  channels: Channel[]
  scheduledTasks: number
  pendingTasks: number
  isRefreshingLive: boolean
  onVideoClick: (video: Video) => void
  onNoteClick: (note: Note) => void
  onAddContent: () => void
  onRefreshLiveStatus: () => Promise<void> | void
  localSearchQuery?: string
  onLocalSearchChange?: (query: string) => void
}

export function DashboardMobile({
  stats,
  weeklyGoal,
  videos,
  notes,
  folders,
  playlists,
  channels,
  scheduledTasks,
  pendingTasks,
  isRefreshingLive,
  onVideoClick,
  onNoteClick,
  onAddContent,
  onRefreshLiveStatus,
  localSearchQuery: _localSearchQuery,
  onLocalSearchChange: _onLocalSearchChange,
}: DashboardMobileProps) {
  const router = useRouter()
  const latestVideos = videos.slice(0, 4)
  const latestNotes = notes.slice(0, 4)

  return (
    <DashboardSkeleton loading={false}>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="bg-gradient-to-br from-primary/15 via-transparent to-transparent p-5">
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Dashboard</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Built for one-handed use, quick resume, and fast actions.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Streak</p>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {stats?.streak || 0} days
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Weekly goal</p>
                <p className="mt-1 text-sm font-semibold">{stats?.weeklyVideosWatched || 0}/{weeklyGoal}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-5 pt-0">
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-2 flex flex-col items-center justify-center">
                <Play className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-bold leading-none">{stats?.watchedVideos || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Videos watched</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-2 flex flex-col items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-bold leading-none">{stats?.completedPlaylists || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Playlists done</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-2 flex flex-col items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
                <p className="mt-3 text-xl font-bold leading-none">{formatWatchTime(stats?.totalWatchTime || 0)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Watch time</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-2 flex flex-col items-center justify-center">
                <Star className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-bold leading-none">{stats?.totalNotes || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Notes</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Tasks scheduled</CardTitle>
            <Badge variant="secondary">
              <CalendarDays className="mr-1 h-3 w-3" />
              {scheduledTasks}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Scheduled</p>
                <p className="text-sm font-semibold">{scheduledTasks}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Pending</p>
                <p className="text-sm font-semibold">{pendingTasks}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Open Calendar to manage reminders and upcoming tasks.</p>
          </CardContent>
        </Card>

        <section className="space-y-3 rounded-3xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Videos</h2>
              <p className="text-xs text-muted-foreground">Tap to continue watching.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/videos')}>
              Open
            </Button>
          </div>

          <div className="space-y-3">
            {latestVideos.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => onVideoClick(video)}
                className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-muted/60"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Play className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tap to open player</p>
                </div>
              </button>
            ))}
            {latestVideos.length === 0 && (
              <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                No videos yet.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Recent notes</h2>
              <p className="text-xs text-muted-foreground">Latest thoughts and timestamps.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>
              All notes
            </Button>
          </div>

          <div className="space-y-2">
            {latestNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => onNoteClick(note)}
                className={cn(
                  'w-full rounded-2xl border p-3 text-left transition-colors hover:bg-muted/50',
                  note.isImportant && 'border-yellow-200 bg-yellow-50/70 dark:border-yellow-800 dark:bg-yellow-950/30'
                )}
              >
                <p className="line-clamp-2 text-sm font-medium">{note.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.youtubeId ? 'Video note' : new Date(note.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
            {latestNotes.length === 0 && (
              <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                No notes yet.
              </div>
            )}
          </div>
        </section>

        {/* <section className="rounded-3xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Shortcuts</h2>
              <p className="text-xs text-muted-foreground">Mobile-first quick access.</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefreshLiveStatus} disabled={isRefreshingLive}>
              <Users className="mr-2 h-4 w-4" />
              {isRefreshingLive ? 'Checking...' : 'Live'}
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button className="justify-start" variant="outline" onClick={onAddContent}>
              <ListVideo className="mr-2 h-4 w-4" />
              Add content
            </Button>
            <Button className="justify-start" variant="outline" onClick={() => router.push('/search')}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button className="justify-start" variant="outline" onClick={() => router.push('/folders')}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Folders
            </Button>
            <Button className="justify-start" variant="outline" onClick={() => router.push('/playlists')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Playlists
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{folders.length} folders</span>
            <span>•</span>
            <span>{playlists.length} playlists</span>
            <span>•</span>
            <span>{channels.length} channels</span>
          </div>
        </section> */}
      </div>
    </DashboardSkeleton>
  )
}
