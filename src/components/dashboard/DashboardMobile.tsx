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

interface DashboardMobileProps {
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

export function DashboardMobile({
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
}: DashboardMobileProps) {
  const router = useRouter()
  const latestNotes = notes.slice(0, 4)

  return (
    <DashboardSkeleton loading={false}>
      <div className="space-y-4">
        {/* Hero + stats (unchanged design) */}
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

        {/* Agent daily briefing — same card as desktop */}
        <AgentBriefingCard />

        {/* Quick add: the NLP task bar ("Physics exam on november 19th") */}
        <section className="rounded-3xl border bg-card p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-base font-semibold">Quick add</h2>
            <p className="text-xs text-muted-foreground">
              Type a task like &quot;Physics exam on november 19th&quot; — the date is parsed and it lands on your calendar.
            </p>
          </div>
          <QuickAddBar />
        </section>

        {/* Schedule & tasks — full CRUD, unified with videos/playlists */}
        <TodoList />

        {/* Continue watching — progress, completion toggle, remove */}
        <ContinueWatching
          videos={videos}
          folders={folders}
          completedVideos={completedVideos}
          onVideoClick={onVideoClick}
          onVideoCompletionChanged={onVideoCompletionChanged}
          onVideoRemoved={onVideoRemoved}
        />

        {/* Recent notes — now with important toggle + delete (tap ⋮) */}
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
              <div
                key={note.id}
                className={cn(
                  'rounded-2xl border p-3',
                  note.isImportant && 'border-yellow-200 bg-yellow-50/70 dark:border-yellow-800 dark:bg-yellow-950/30'
                )}
              >
                <div className="flex items-start gap-2">
                  <p
                    className="line-clamp-2 min-w-0 flex-1 cursor-pointer text-sm font-medium"
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
                <div className="mt-1 flex items-center gap-2">
                  {note.isImportant && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                  <p className="text-xs text-muted-foreground">
                    {note.youtubeId ? 'Video note' : new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {latestNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                <FileText className="mb-2 h-6 w-6" />
                No notes yet.
              </div>
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
              <CardTitle className="text-base font-semibold flex items-center gap-2 leading-tight">
                <Users className="h-4 w-4 text-primary" />
                Your Channels
                {(stats?.liveChannels ?? 0) > 0 && (
                  <Badge className="bg-red-500 text-white ml-1 animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />
                    {stats?.liveChannels} Live
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onRefreshLiveStatus} disabled={isRefreshingLive}>
                <RefreshCw className={cn('h-4 w-4 mr-1', isRefreshingLive && 'animate-spin')} />
                {isRefreshingLive ? 'Checking...' : 'Live'}
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-4">
                {channels.slice(0, 6).map((channel) => (
                  <div
                    key={channel.id}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                    onClick={() => router.push(`/channel/${channel.id}`)}
                  >
                    <div className={cn(
                      'relative w-16 h-16 rounded-full overflow-hidden bg-muted',
                      channel.isLive && 'ring-4 ring-red-500'
                    )}>
                      {channel.thumbnail ? (
                        <Image
                          src={channel.thumbnail}
                          alt={channel.title}
                          fill
                          sizes="64px"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {channel.isLive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Badge className="bg-red-600 text-white text-[10px] animate-pulse">LIVE</Badge>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-center line-clamp-2 w-full group-hover:text-primary transition-colors">
                      {channel.title}
                    </p>
                    {channel.isLive && channel.liveTitle && (
                      <p className="text-[11px] text-red-500 text-center line-clamp-1 w-full">
                        {channel.liveTitle}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => router.push('/channels')}>
                All channels
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <section className="space-y-3 rounded-3xl border bg-card p-4 shadow-sm">
          <div>
            <h2 className="text-base font-semibold">Shortcuts</h2>
            <p className="text-xs text-muted-foreground">Mobile-first quick access.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{folders.length} folders</span>
            <span>•</span>
            <span>{playlists.length} playlists</span>
            <span>•</span>
            <span>{channels.length} channels</span>
          </div>
        </section>
      </div>
    </DashboardSkeleton>
  )
}
