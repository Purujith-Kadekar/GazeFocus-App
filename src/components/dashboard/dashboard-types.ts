import type { Channel, Folder, Note, Playlist, Video } from '@/types'

export type PlaylistWithFolder = Playlist & { folderId: string | null }

export interface DashboardStats {
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

export interface DashboardBootstrapResponse {
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
