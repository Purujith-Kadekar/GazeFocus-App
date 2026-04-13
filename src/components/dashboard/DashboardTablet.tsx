'use client'

import { useRouter } from 'next/navigation'
import Image from '@/components/ui/StableImage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import DashboardSkeleton from './DashboardSkeleton'
import { formatWatchTime, cn } from '@/lib/utils'
import type { DashboardStats } from './dashboard-types'
import type { Folder, Note, Playlist, Video, Channel } from '@/types'
import { CheckCircle, Clock, FolderOpen, ListVideo, Play, Search, Star, Target, TrendingUp, Users } from 'lucide-react'

type PlaylistWithFolder = Playlist & { folderId: string | null }

interface DashboardTabletProps {
  stats: DashboardStats | null
  weeklyGoal: number
  videos: Video[]
  notes: Note[]
  folders: Folder[]
  playlists: PlaylistWithFolder[]
  channels: Channel[]
  isRefreshingLive: boolean
  onVideoClick: (video: Video) => void
  onNoteClick: (note: Note) => void
  onAddContent: () => void
  onRefreshLiveStatus: () => Promise<void> | void
}

export function DashboardTablet({
  stats,
  weeklyGoal,
  videos,
  notes,
  folders,
  playlists,
  channels,
  isRefreshingLive,
  onVideoClick,
  onNoteClick,
  onAddContent,
  onRefreshLiveStatus,
}: DashboardTabletProps) {
  const router = useRouter()
  const weeklyGoalProgress = stats ? Math.min(100, Math.round((stats.weeklyVideosWatched / weeklyGoal) * 100)) : 0
  const featuredVideos = videos.slice(0, 6)
  const featuredNotes = notes.slice(0, 5)

  return (
    <DashboardSkeleton loading={false}>
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
          <div className="grid gap-0 md:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-4 bg-gradient-to-br from-primary/15 via-transparent to-transparent p-6 md:p-7">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Tablet Dashboard</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight">A focused workspace for medium screens</h1>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                  Balanced panels, touch-friendly controls, and enough density to stay productive without desktop clutter.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  <Star className="mr-1 h-3 w-3 text-amber-500" />
                  {stats?.streak || 0} day streak
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  <Users className="mr-1 h-3 w-3" />
                  {stats?.liveChannels || 0} live channels
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Card className="bg-background/80">
                  <CardContent className="p-4">
                    <Play className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-2xl font-bold leading-none">{stats?.watchedVideos || 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Videos watched</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/80">
                  <CardContent className="p-4">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-2xl font-bold leading-none">{stats?.completedPlaylists || 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Playlists done</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/80">
                  <CardContent className="p-4">
                    <Clock className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-xl font-bold leading-none">{formatWatchTime(stats?.totalWatchTime || 0)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Watch time</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/80">
                  <CardContent className="p-4">
                    <Star className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-2xl font-bold leading-none">{stats?.totalNotes || 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Notes</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="border-t border-border/60 bg-muted/30 p-6 md:border-l md:border-t-0 md:p-7">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Weekly progress</h2>
                    <Badge variant={weeklyGoalProgress >= 100 ? 'default' : 'secondary'}>{weeklyGoalProgress}%</Badge>
                  </div>
                  <Progress value={weeklyGoalProgress} className="mt-3 h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">{stats?.weeklyVideosWatched || 0}/{weeklyGoal} videos this week</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button className="justify-start" onClick={onAddContent}>
                    <ListVideo className="mr-2 h-4 w-4" />
                    Add content
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => router.push('/search')}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => router.push('/folders')}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Folders
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={onRefreshLiveStatus} disabled={isRefreshingLive}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {isRefreshingLive ? 'Refreshing' : 'Live status'}
                  </Button>
                </div>

                <div className="rounded-2xl border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Library snapshot</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{folders.length} folders</span>
                    <span>•</span>
                    <span>{playlists.length} playlists</span>
                    <span>•</span>
                    <span>{channels.length} channels</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
          <section className="rounded-[2rem] border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Continue watching</h2>
                <p className="text-xs text-muted-foreground">Medium-screen resume board.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/videos')}>
                View all
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {featuredVideos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => onVideoClick(video)}
                  className="group flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="relative h-18 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {video.thumbnail ? (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tap to continue</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Recent notes</h2>
                <p className="text-xs text-muted-foreground">Compact reading panel.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>
                Open notes
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {featuredNotes.map((note) => (
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
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Focus panels</h2>
              <p className="text-xs text-muted-foreground">Extra surface area for folders and playlists.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/playlists')}>
              View playlists
            </Button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Folders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {folders.slice(0, 4).map((folder) => (
                  <div key={folder.id} className="rounded-2xl border px-3 py-2 text-sm">
                    {folder.title}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => router.push('/search')}>Search</Button>
                  <Button variant="outline" onClick={onAddContent}>Add</Button>
                  <Button variant="outline" onClick={() => router.push('/folders')}>Folders</Button>
                  <Button variant="outline" onClick={() => router.push('/settings')}>Settings</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DashboardSkeleton>
  )
}
