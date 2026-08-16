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
import { CheckCircle, Clock, Flame, CalendarDays, Play, Star, FolderOpen, ListVideo, TrendingUp, Users, Tv, ChevronRight } from 'lucide-react'

interface DashboardTabletProps {
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
}

export function DashboardTablet({
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
}: DashboardTabletProps) {
  const router = useRouter()
  const latestVideos = videos.slice(0, 6)
  const latestNotes = notes.slice(0, 6)

  return (
    <DashboardSkeleton loading={false}>
      <div className="space-y-5">
        {/* Header Section */}
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="bg-gradient-to-br from-primary/15 via-transparent to-transparent p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Dashboard</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              More space, more content, same simple workflow.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 p-5 pt-0">
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <Play className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-bold leading-none">{stats?.watchedVideos || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Videos</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-bold leading-none">{stats?.completedPlaylists || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Playlists</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <FolderOpen className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-bold leading-none">{notes.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Notes</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
                <p className="mt-3 text-xl font-bold leading-none">{formatWatchTime(stats?.totalWatchTime || 0)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Watch time</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tasks Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-bold leading-none">{scheduledTasks}</p>
                <p className="mt-1 text-xs text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/80">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-bold leading-none">{pendingTasks}</p>
                <p className="mt-1 text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Latest Videos */}
        {latestVideos.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Recent Videos</h2>
            <div className="grid grid-cols-2 gap-3">
              {latestVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => onVideoClick(video)}
                  className="group cursor-pointer overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent"
                >
                  <div className="relative h-40 w-full overflow-hidden rounded-xl bg-muted">
                    {video.thumbnail ? (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        sizes="100%"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Notes</h2>
          <div className="grid grid-cols-2 gap-3">
            {latestNotes.length > 0 ? latestNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onNoteClick(note)}
                className="cursor-pointer rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
              >
                <Card className="border-border/70 bg-background/80">
                  <CardContent className="p-3">
                    <p className="line-clamp-3 text-sm">{note.content}</p>
                  </CardContent>
                </Card>
              </div>
            )) : (
              <Card className="col-span-2 border-border/70 bg-background/80">
                <CardContent className="p-3 flex flex-col items-center justify-center">
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
        </div>
      </DashboardSkeleton>
    )
}