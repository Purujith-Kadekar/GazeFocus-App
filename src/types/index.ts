// Local type definitions matching the Supabase database schema

export interface User {
  id: string
  name: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
  passwordHash: string | null
  currentStreak: number
  longestStreak: number
  lastLoginDate: Date | null
  lastActiveDate: Date | null
  weeklyVideosWatched: number
  lastWeeklyReset: Date | null
  deletionScheduledAt: Date | null
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
}

export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: Date
}

export interface VerificationToken {
  identifier: string
  token: string
  expires: Date
}

export interface Folder {
  id: string
  userId: string
  parentId: string | null
  title: string
  description: string | null
  position: number
  createdAt: Date
  updatedAt: Date
}

export type LibraryItemType = 'PLAYLIST' | 'VIDEO'

export interface LibraryItem {
  id: string
  userId: string
  folderId: string | null
  type: LibraryItemType
  externalId: string
  title: string
  metadata: Record<string, unknown> | null
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: string
  userId: string
  youtubeId: string | null
  timestampSeconds: number | null
  content: string
  isImportant: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VideoProgress {
  id: string
  userId: string
  youtubeId: string
  secondsWatched: number
  durationSeconds: number | null
  completed: boolean
  completedAt: Date | null
  updatedAt: Date
  createdAt: Date
}

export interface PlaylistMark {
  id: string
  userId: string
  youtubeId: string
  finished: boolean
  finishedAt: Date
}

export interface Playlist {
  id: string
  youtubeId: string
  title: string
  description: string | null
  thumbnail: string | null
  channelId: string | null
  channelName: string | null
  totalDuration: number
  userId: string
  scheduledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Video {
  id: string
  youtubeId: string
  title: string
  description: string | null
  thumbnail: string | null
  duration: number
  position: number
  userId: string
  playlistId: string | null
  scheduledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  id: string
  eyeTrackingEnabled: boolean
  sensitivityMode: string
  inactivityTimeout: number
  soundAlerts: boolean
  theme: string
  autoPlayNext: boolean
  defaultPlaybackSpeed: number
  eyeTrackingThreshold: number
  onboardingCompleted: boolean
  weeklyGoal: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface SiteSettings {
  id: string
  signupEnabled: boolean
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string | null
  title: string
  message: string
  read: boolean
  global: boolean
  createdAt: Date
}

export type TodoType = 'TASK' | 'PLAN' | 'EVENT'

export interface Todo {
  id: string
  userId: string
  text: string
  completed: boolean
  type: TodoType
  reminderAt: Date | null
  createdAt: Date
  updatedAt: Date
}

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
export type FolderWithPlaylists = Folder & {
  playlists: Playlist[]
  _count?: {
    playlists: number
  }
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
