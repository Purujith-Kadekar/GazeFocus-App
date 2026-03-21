import { Folder, Playlist } from '@prisma/client'

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

export enum TodoType {
  TASK = 'TASK',
  PLAN = 'PLAN',
  EVENT = 'EVENT'
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
