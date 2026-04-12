'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { NotesPanel } from '@/components/player/NotesPanel'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'
import { useUIStore, useVideoStore, useFolderStore } from '@/store/useStore'
import { clearDashboardBootstrapCache, getDashboardBootstrapCache, isDashboardBootstrapCacheFresh } from '@/lib/dashboard-bootstrap-cache'
import { Play, ListVideo, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LibraryItemWithDetails {
  id: string
  type: 'VIDEO' | 'PLAYLIST'
  externalId: string
  title: string
  folderId: string | null
  metadata?: Record<string, unknown> | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { currentView, setCurrentView, setDashboardBootLoading } = useUIStore()
  const { currentVideo, setCurrentVideo } = useVideoStore()
  const { selectedFolder } = useFolderStore()
  const [folderItems, setFolderItems] = useState<LibraryItemWithDetails[]>([])
  const [isFolderItemsLoading, setIsFolderItemsLoading] = useState(false)
  const warmCache = getDashboardBootstrapCache()
  const canUseWarmDashboard =
    !!warmCache &&
    isDashboardBootstrapCacheFresh(2 * 60 * 1000)

  useEffect(() => {
    if (status === 'unauthenticated') {
      setDashboardBootLoading(false)
      clearDashboardBootstrapCache()
      router.push('/auth/login')
    }
  }, [status, router, setDashboardBootLoading])

  useEffect(() => {
    if (status === 'loading') {
      setDashboardBootLoading(true)
      return
    }

    if (status === 'unauthenticated') {
      setDashboardBootLoading(false)
    }
  }, [status, setDashboardBootLoading])

  useEffect(() => {
    if (currentView === 'folder' && selectedFolder?.id) {
      const folderId = selectedFolder.id
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFolderItemsLoading(true)
      fetch(`/api/folders/${folderId}`)
        .then(r => r.ok ? r.json() : { items: [] })
        .then(data => setFolderItems(data.items || []))
        .catch(() => setFolderItems([]))
        .finally(() => setIsFolderItemsLoading(false))
    }
  }, [currentView, selectedFolder?.id])

  if (status === 'loading') {
    if (canUseWarmDashboard) {
      return (
        <MainLayout>
          <Dashboard />
        </MainLayout>
      )
    }

    return (
      <MainLayout>
        <DashboardSkeleton loading={true}>
          <div />
        </DashboardSkeleton>
      </MainLayout>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <MainLayout>
      {currentView === 'dashboard' && <Dashboard />}
      
      {currentView === 'settings' && <SettingsPage />}
      
      {currentView === 'search' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Search</h1>
          <p className="text-muted-foreground">
            Use the search bar above to find videos and playlists.
          </p>
        </div>
      )}
      
      {currentView === 'video' && currentVideo && (
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => {
              setCurrentView('dashboard')
              setCurrentVideo(null)
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div data-video-player>
                <VideoPlayer
                  videoId={currentVideo.youtubeId}
                  title={currentVideo.title}
                  thumbnail={currentVideo.thumbnail || undefined}
                  onProgress={(currentTime, duration) => {
                    fetch('/api/progress', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        youtubeId: currentVideo.youtubeId,
                        currentTime: Math.floor(currentTime),
                        duration: Math.floor(duration),
                      }),
                    })
                  }}
                  onComplete={() => {
                    console.log('Video completed!')
                  }}
                />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <NotesPanel 
                videoId={currentVideo.youtubeId}
                onSeekToTimestamp={(timestamp) => {
                  console.log('Seek to:', timestamp)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {currentView === 'folder' && selectedFolder && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setCurrentView('dashboard')
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{selectedFolder.title}</h1>
            <p className="text-muted-foreground">
              {selectedFolder.description || 'No description'}
            </p>
          </div>
          
          {isFolderItemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="min-h-[140px]">
                <CardHeader className="pb-2">
                  <div className="h-5 w-2/3 rounded-xl skeleton-shimmer" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-1/2 rounded-xl skeleton-shimmer" />
                </CardContent>
              </Card>
              <Card className="min-h-[140px]">
                <CardHeader className="pb-2">
                  <div className="h-5 w-3/4 rounded-xl skeleton-shimmer" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-2/3 rounded-xl skeleton-shimmer" />
                </CardContent>
              </Card>
              <Card className="min-h-[140px]">
                <CardHeader className="pb-2">
                  <div className="h-5 w-1/2 rounded-xl skeleton-shimmer" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-1/3 rounded-xl skeleton-shimmer" />
                </CardContent>
              </Card>
            </div>
          ) : folderItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folderItems.map((item) => (
                <Card key={item.id} className="cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {item.type === 'VIDEO' ? (
                        <Play className="h-5 w-5 text-blue-500" />
                      ) : (
                        <ListVideo className="h-5 w-5 text-purple-500" />
                      )}
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground capitalize">
                      {item.type.toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">This folder is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add videos or playlists to this folder from the dashboard
              </p>
            </div>
          )}
        </div>
      )}

      {currentView === 'folder' && !selectedFolder && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Folders</h1>
          <p className="text-muted-foreground">
            Select a folder from the sidebar to view its contents.
          </p>
        </div>
      )}

      {currentView === 'playlist' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Playlist View</h1>
          <p className="text-muted-foreground">
            Select a playlist to view its videos.
          </p>
        </div>
      )}
    </MainLayout>
  )
}
