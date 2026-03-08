import { User as PrismaUser, Folder, Playlist, Video, Note, UserSettings } from '@prisma/client'

// Auth types
export interface AuthUser {
  id: string
  email: string
  name: string | null
  image: string | null
  currentStreak?: number
  longestStreak?: number
  lastLoginDate?: Date | null
  lastActiveDate?: Date | null
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: AuthUser
  }
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    currentStreak?: number
    longestStreak?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string | null
    picture?: string | null
    currentStreak?: number
    longestStreak?: number
  }
}

// Database types with relations
export type UserWithSettings = PrismaUser & {
  settings: UserSettings | null
}

export type FolderWithPlaylists = Folder & {
  playlists: Playlist[]
  _count?: {
    playlists: number
  }
}

export type PlaylistWithVideos = Playlist & {
  videos: Video[]
  folder: Folder | null
  _count?: {
    videos: number
  }
}

export type VideoWithNotes = Video & {
  notes: Note[]
  playlist: Playlist | null
}

export type NoteWithVideo = Note & {
  video: Video
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// YouTube API types
export interface YouTubeSearchResult {
  id: string
  type: 'video' | 'playlist' | 'channel'
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  channelId: string
  publishedAt: string
  duration?: string
  videoCount?: number
}

export interface YouTubeVideoDetails {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  channelId: string
  channelName: string
}

// Eye tracking types
export interface EyeTrackingState {
  isEnabled: boolean
  isCalibrated: boolean
  isTracking: boolean
  isLookingAtScreen: boolean
  lastPosition: { x: number; y: number } | null
  calibrationProgress: number
}

// Player state types
export interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackSpeed: number
  isFullscreen: boolean
  isMuted: boolean
}

// Inactivity detection
export interface InactivityState {
  isActive: boolean
  lastActivity: number
  timeUntilAlert: number
  isAlerting: boolean
}

// Dashboard stats
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
}

// Form types
export interface CreateFolderForm {
  name: string
  description?: string
  color: string
  icon: string
}

export interface AddPlaylistForm {
  url: string
  folderId?: string
}

export interface CreateNoteForm {
  content: string
  timestamp: number
  isImportant: boolean
}

// Settings form
export interface SettingsForm {
  eyeTrackingEnabled: boolean
  inactivityTimeout: number
  soundAlerts: boolean
  theme: 'light' | 'dark' | 'system'
  autoPlayNext: boolean
  defaultPlaybackSpeed: number
}
