import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format duration from seconds to mm:ss or hh:mm:ss
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Format date to relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

// Format watch time (total seconds) to readable format
export function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Extract YouTube video/playlist ID from URL
export function extractYouTubeId(url: string): { type: 'video' | 'playlist', id: string } | null {
  // Playlist patterns
  const playlistPatterns = [
    /[?&]list=([^&]+)/,
    /playlist\?list=([^&]+)/,
  ]
  
  for (const pattern of playlistPatterns) {
    const match = url.match(pattern)
    if (match) {
      return { type: 'playlist', id: match[1] }
    }
  }
  
  // Video patterns
  const videoPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?/]+)/,
  ]
  
  for (const pattern of videoPatterns) {
    const match = url.match(pattern)
    if (match) {
      return { type: 'video', id: match[1] }
    }
  }
  
  return null
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

// Get YouTube embed URL
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

// Calculate progress percentage
export function calculateProgress(watched: number, total: number): number {
  if (total === 0) return 0
  return Math.min(Math.round((watched / total) * 100), 100)
}

// Generate random color for folders
export function generateRandomColor(): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Available folder icons
export const folderIcons = [
  'folder', 'book', 'code', 'briefcase', 'graduation-cap',
  'music', 'film', 'gamepad', 'heart', 'star',
  'lightbulb', 'rocket', 'brain', 'laptop', 'pen-tool',
]

// Available folder colors
export const folderColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E',
]
