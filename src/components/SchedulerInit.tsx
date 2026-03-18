import { initializePlaylistSync } from '@/lib/schedulers/playlistSync'

export function SchedulerInit() {
  // Initialize the scheduler server-side when the app starts
  initializePlaylistSync()
  return null
}
