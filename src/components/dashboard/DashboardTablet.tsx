'use client'

import { useRouter } from 'next/navigation'
import Image from '@/components/ui/StableImage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardSkeleton from './DashboardSkeleton'
import { ContinueWatching } from './ContinueWatching'
import { RecentFolders } from './RecentFolders'
import { PlaylistsSection } from './PlaylistsSection'
import { TodoList } from './TodoList'
import { QuickAddBar } from '@/components/agent/QuickAddBar'
import { AgentBriefingCard } from '@/components/agent/AgentBriefingCard'
import { formatWatchTime, cn } from '@/lib/utils'
import type { DashboardStats, PlaylistWithFolder } from './dashboard-types'
import type { Folder, Note, Video, Channel } from '@/types'
import {
  CheckCircle,
  Clock,
  Flame,
  Play,
  Star,
  MoreVertical,
  Trash2,
  Users,
  Radio,
  RefreshCw,
  ListVideo,
  FolderOpen,
  Search,
  FileText,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardTabletProps {
  stats: DashboardStats | null
  weeklyGoal: number
  videos: Video[]
  notes: Note[]
  folders: Folder[]
  playlists: PlaylistWithFolder[]
  channels: Channel[]
  completedVideos: Set<string>
  completedPlaylists: Set<string>
  isRefreshingLive: boolean
  onVideoClick: (video: Video) => void
  onNoteClick: (note: Note) => void
  onToggleNoteImportant: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  onAddContent: () => void
  onVideoCompletionChanged: () => void | Promise<void>
  onVideoRemoved: (videoId: string) => void
  onPlaylistRemoved: () => void
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
  completedVideos,
  completedPlaylists,
  isRefreshingLive,
  onVideoClick,
  onNoteClick,
  onToggleNoteImportant,
  onDeleteNote,
  onAddContent,
  onVideoCompletionChanged,
  onVideoRemoved,
  onPlaylistRemoved,
  onRefreshLiveStatus,
}: DashboardTabletProps) {
  const router = useRouter()
  const latestNotes = notes.slice(0, 6)

  return (
    <DashboardSkeleton loading={false}>
      <div className="space-y-5">
        {/* Hero + stats (unchanged design) */}
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
                <Star className="h-4 w-4 text-primary" />
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

        {/* Agent daily briefing — same card as desktop */}
        <AgentBriefingCard />

        {/* Quick add + schedule & tasks side by side on a tablet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <section className="rounded-3xl border bg-card p-4 shadow-sm">
            <div className="mb-3">
              <h2 className="text-base font-semibold">Quick add</h2>
              <p className="text-xs text-muted-foreground">
                Type a task like &quot;Physics exam on november 19th&quot; — the date is parsed and it lands on your calendar.
              </p>
            </div>
            <QuickAddBar />
          </section>
          <TodoList />
        </div>

        {/* Continue watching */}
        <ContinueWatching
          videos={videos}
          folders={folders}
          completedVideos={completedVideos}
          onVideoClick={onVideoClick}
          onVideoCompletionChanged={onVideoCompletionChanged}
          onVideoRemoved={onVideoRemoved}
        />

        {/* Notes — with important toggle + delete (tap ⋮) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Notes</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>
              All notes
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {latestNotes.length > 0 ? latestNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  'rounded-xl border bg-card p-4',
                  note.isImportant && 'border-yellow-200 bg-yellow-50/70 dark:border-yellow-800 dark:bg-yellow-950/30'
                )}
              >
                <div className="flex items-start gap-2">
                  <p
                    className="line-clamp-3 min-w-0 flex-1 cursor-pointer text-sm"
                    onClick={() => onNoteClick(note)}
                  >
                    {note.content}
                  </p>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 h-7 w-7 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onToggleNoteImportant(note)}>
                        <Star className={cn('mr-2 h-4 w-4', note.isImportant && 'fill-yellow-500 text-yellow-500')} />
                        {note.isImportant ? 'Remove from important' : 'Mark as important'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteNote(note.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {note.youtubeId ? 'Video note' : new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            )) : (
              <Card className="col-span-2 border-border/70 bg-background/80">
                <CardContent className="p-3 flex flex-col items-center justify-center">
                  <FileText className="mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Playlists */}
        <PlaylistsSection
          playlists={playlists}
          folders={folders}
          completedPlaylists={completedPlaylists}
          onPlaylistRemoved={onPlaylistRemoved}
        />

        {/* Folders */}
        <RecentFolders folders={folders} />

        {/* Channels with live status */}
        {channels.length > 0 && (
          <Card className="shadow-sm">
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
                <Button variant="ghost" size="sm" onClick={onRefreshLiveStatus} disabled={isRefreshingLive}>
                  <RefreshCw className={cn('h-4 w-4 mr-1', isRefreshingLive && 'animate-spin')} />
                  {isRefreshingLive ? 'Checking...' : 'Live'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push('/channels')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {channels.slice(0, 8).map((channel) => (
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
                          <Badge className="bg-red-600 text-white text-[10px] animate-pulse">LIVE</Badge>
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

        {/* Quick actions */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Shortcuts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <ListVideo className="mr-2 h-4 w-4" />
              Playlists
            </Button>
          </div>
        </section>
      </div>
    </DashboardSkeleton>
  )
}
