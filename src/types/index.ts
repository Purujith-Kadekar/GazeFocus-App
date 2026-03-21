import type { Database } from './supabase'

export type Folder = Database['public']['Tables']['Folder']['Row']
export type Playlist = Database['public']['Tables']['Playlist']['Row']
export type Video = Database['public']['Tables']['Video']['Row']
export type Note = Database['public']['Tables']['Note']['Row']
export type Todo = Database['public']['Tables']['Todo']['Row']
export type LibraryItem = Database['public']['Tables']['LibraryItem']['Row']
export type UserSettings = Database['public']['Tables']['UserSettings']['Row']
export type SiteSettings = Database['public']['Tables']['SiteSettings']['Row']
export type Notification = Database['public']['Tables']['Notification']['Row']
export type VideoProgress = Database['public']['Tables']['VideoProgress']['Row']
export type PlaylistMark = Database['public']['Tables']['PlaylistMark']['Row']
export type User = Database['public']['Tables']['User']['Row']

export type LibraryItemType = 'PLAYLIST' | 'VIDEO'
export type TodoType = 'TASK' | 'PLAN' | 'EVENT'

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

export type FolderWithPlaylists = Folder & {
  playlists: Playlist[]
  _count?: {
    playlists: number
  }
}

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
