import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Folder, Playlist, Video, Note, Todo } from '@prisma/client'

// Settings Store - Persisted for the theme script to work instantly
interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
    }
  )
)

// Auth Store
interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
  } | null
  setUser: (user: AuthState['user']) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

// Folder Store
interface FolderState {
  folders: Folder[]
  selectedFolder: Folder | null
  setFolders: (folders: Folder[]) => void
  addFolder: (folder: Folder) => void
  updateFolder: (folder: Folder) => void
  removeFolder: (id: string) => void
  selectFolder: (folder: Folder | null) => void
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  selectedFolder: null,
  setFolders: (folders) => set({ folders }),
  addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
  updateFolder: (folder) => set((state) => ({
    folders: state.folders.map((f) => (f.id === folder.id ? folder : f)),
  })),
  removeFolder: (id) => set((state) => ({
    folders: state.folders.filter((f) => f.id !== id),
  })),
  selectFolder: (folder) => set({ selectedFolder: folder }),
}))

// Playlist Store
interface PlaylistState {
  playlists: Playlist[]
  selectedPlaylist: Playlist | null
  setPlaylists: (playlists: Playlist[]) => void
  addPlaylist: (playlist: Playlist) => void
  updatePlaylist: (playlist: Playlist) => void
  removePlaylist: (id: string) => void
  selectPlaylist: (playlist: Playlist | null) => void
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  playlists: [],
  selectedPlaylist: null,
  setPlaylists: (playlists) => set({ playlists }),
  addPlaylist: (playlist) => set((state) => ({ playlists: [...state.playlists, playlist] })),
  updatePlaylist: (playlist) => set((state) => ({
    playlists: state.playlists.map((p) => (p.id === playlist.id ? playlist : p)),
  })),
  removePlaylist: (id) => set((state) => ({
    playlists: state.playlists.filter((p) => p.id !== id),
  })),
  selectPlaylist: (playlist) => set({ selectedPlaylist: playlist }),
}))

// Video Store
interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  setVideos: (videos: Video[]) => void
  addVideo: (video: Video) => void
  updateVideo: (video: Video) => void
  removeVideo: (id: string) => void
  setCurrentVideo: (video: Video | null) => void
}

export const useVideoStore = create<VideoState>((set) => ({
  videos: [],
  currentVideo: null,
  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((state) => ({ videos: [...state.videos, video] })),
  updateVideo: (video) => set((state) => ({
    videos: state.videos.map((v) => (v.id === video.id ? video : v)),
  })),
  removeVideo: (id) => set((state) => ({
    videos: state.videos.filter((v) => v.id !== id),
  })),
  setCurrentVideo: (video) => set({ currentVideo: video }),
}))

// Notes Store
interface NoteState {
  notes: Note[]
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (note: Note) => void
  removeNote: (id: string) => void
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (note) => set((state) => ({
    notes: state.notes.map((n) => (n.id === note.id ? note : n)),
  })),
  removeNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id),
  })),
}))

// Todo Store
interface TodoState {
  todos: Todo[]
  setTodos: (todos: Todo[]) => void
  addTodo: (todo: Todo) => void
  updateTodo: (todo: Todo) => void
  removeTodo: (id: string) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [todo, ...state.todos] })),
  updateTodo: (todo) => set((state) => ({
    todos: state.todos.map((t) => (t.id === todo.id ? todo : t)),
  })),
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter((t) => t.id !== id),
  })),
}))

// Player Store
interface PlayerStateStore {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackSpeed: number
  videoQuality: string
  availableQualities: string[]
  isFullscreen: boolean
  isMuted: boolean
  isPausedByEyeTracking: boolean
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setPlaybackSpeed: (speed: number) => void
  setVideoQuality: (quality: string) => void
  setAvailableQualities: (qualities: string[]) => void
  setFullscreen: (fullscreen: boolean) => void
  setMuted: (muted: boolean) => void
  setPausedByEyeTracking: (paused: boolean) => void
  togglePlay: () => void
  toggleMute: () => void
}

export const usePlayerStore = create<PlayerStateStore>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackSpeed: 1,
  videoQuality: 'auto',
  availableQualities: [],
  isFullscreen: false,
  isMuted: false,
  isPausedByEyeTracking: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setVideoQuality: (quality) => set({ videoQuality: quality }),
  setAvailableQualities: (qualities) => set({ availableQualities: qualities }),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setMuted: (muted) => set({ isMuted: muted }),
  setPausedByEyeTracking: (paused) => set({ isPausedByEyeTracking: paused }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}))

// Eye Tracking Store
interface EyeTrackingStateStore {
  isEnabled: boolean
  isCalibrated: boolean
  isTracking: boolean
  isLookingAtScreen: boolean
  lastPosition: { x: number; y: number } | null
  calibrationProgress: number
  distractionCount: number
  thresholdSeconds: number
  noFaceDetectedTime: number
  isFaceDetected: boolean
  isFaceFront: boolean
  cameraStream: MediaStream | null
  setEnabled: (enabled: boolean) => void
  setCalibrated: (calibrated: boolean) => void
  setTracking: (tracking: boolean) => void
  setLookingAtScreen: (looking: boolean) => void
  setLastPosition: (pos: { x: number; y: number } | null) => void
  setCalibrationProgress: (progress: number) => void
  incrementDistractionCount: () => void
  resetDistractionCount: () => void
  setThresholdSeconds: (seconds: number) => void
  setNoFaceDetectedTime: (time: number) => void
  setIsFaceDetected: (detected: boolean) => void
  setIsFaceFront: (front: boolean) => void
  setCameraStream: (stream: MediaStream | null) => void
}

export const useEyeTrackingStore = create<EyeTrackingStateStore>((set) => ({
  isEnabled: true,
  isCalibrated: false,
  isTracking: false,
  isLookingAtScreen: true,
  lastPosition: null,
  calibrationProgress: 0,
  distractionCount: 0,
  thresholdSeconds: 3,
  noFaceDetectedTime: 0,
  isFaceDetected: false,
  isFaceFront: true,
  cameraStream: null,
  setEnabled: (enabled) => set({ isEnabled: enabled }),
  setCalibrated: (calibrated) => set({ isCalibrated: calibrated }),
  setTracking: (tracking) => set({ isTracking: tracking }),
  setLookingAtScreen: (looking) => set({ isLookingAtScreen: looking }),
  setLastPosition: (pos) => set({ lastPosition: pos }),
  setCalibrationProgress: (progress) => set({ calibrationProgress: progress }),
  incrementDistractionCount: () => set((state) => ({ distractionCount: state.distractionCount + 1 })),
  resetDistractionCount: () => set({ distractionCount: 0 }),
  setThresholdSeconds: (seconds) => set({ thresholdSeconds: seconds }),
  setNoFaceDetectedTime: (time) => set({ noFaceDetectedTime: time }),
  setIsFaceDetected: (detected) => set({ isFaceDetected: detected }),
  setIsFaceFront: (front) => set({ isFaceFront: front }),
  setCameraStream: (stream) => set({ cameraStream: stream }),
}))

// Inactivity Store
interface InactivityStateStore {
  isActive: boolean
  lastActivityTime: number
  timeUntilAlert: number
  isAlerting: boolean
  timeoutSeconds: number
  setActive: (active: boolean) => void
  setLastActivityTime: (time: number) => void
  setTimeUntilAlert: (time: number) => void
  setAlerting: (alerting: boolean) => void
  setTimeoutSeconds: (seconds: number) => void
}

export const useInactivityStore = create<InactivityStateStore>((set) => ({
  isActive: true,
  lastActivityTime: Date.now(),
  timeUntilAlert: 30,
  isAlerting: false,
  timeoutSeconds: 30,
  setActive: (active) => set({ isActive: active }),
  setLastActivityTime: (time) => set({ lastActivityTime: time }),
  setTimeUntilAlert: (time) => set({ timeUntilAlert: time }),
  setAlerting: (alerting) => set({ isAlerting: alerting }),
  setTimeoutSeconds: (seconds) => set({ timeoutSeconds: seconds }),
}))

// UI Store
interface UIState {
  isSidebarOpen: boolean
  isSearchModalOpen: boolean
  isAddModalOpen: boolean
  isSettingsOpen: boolean
  isCalibrationModalOpen: boolean
  currentView: 'dashboard' | 'folder' | 'playlist' | 'video' | 'settings' | 'search'
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSearchModalOpen: (open: boolean) => void
  setAddModalOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setCalibrationModalOpen: (open: boolean) => void
  setCurrentView: (view: UIState['currentView']) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isSearchModalOpen: false,
      isAddModalOpen: false,
      isSettingsOpen: false,
      isCalibrationModalOpen: false,
      currentView: 'dashboard',
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),
      setAddModalOpen: (open) => set({ isAddModalOpen: open }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setCalibrationModalOpen: (open) => set({ isCalibrationModalOpen: open }),
      setCurrentView: (view) => set({ currentView: view }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
)

// Dashboard Store
interface DashboardStatsData {
  totalPlaylists: number
  completedPlaylists: number
  totalVideos: number
  watchedVideos: number
  weeklyVideosWatched: number
  totalNotes: number
  importantNotes: number
  totalWatchTime: number
  streak: number
  longestStreak: number
}

interface DashboardState {
  stats: DashboardStatsData | null
  recentVideos: Video[]
  recentFolders: Folder[]
  importantNotes: Note[]
  setStats: (stats: DashboardStatsData) => void
  setRecentVideos: (videos: Video[]) => void
  setRecentFolders: (folders: Folder[]) => void
  setImportantNotes: (notes: Note[]) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  recentVideos: [],
  recentFolders: [],
  importantNotes: [],
  setStats: (stats) => set({ stats }),
  setRecentVideos: (videos) => set({ recentVideos: videos }),
  setRecentFolders: (folders) => set({ recentFolders: folders }),
  setImportantNotes: (notes) => set({ importantNotes: notes }),
}))
