'use client'

import { useState } from 'react'
import { Search, User, Loader2, Plus, Check, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'
import { useVideoStore, useUIStore } from '@/store/useStore'
import type { YouTubeSearchResult } from '@/types'

export default function SearchPage() {
  const { setCurrentVideo } = useVideoStore()
  const { setCurrentView } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YouTubeSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [addedVideos, setAddedVideos] = useState<Set<string>>(new Set())
  const [addingVideo, setAddingVideo] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(
        `/api/youtube?q=${encodeURIComponent(query)}`
      )
      if (!response.ok) {
        console.error('Search failed:', response.status)
        setResults([])
        setIsLoading(false)
        return
      }
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setResults(data)
      } else if (data.error) {
        console.error('Search error:', data.error)
        setResults([])
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVideo = async (video: YouTubeSearchResult) => {
    const videoId = video.id
    setAddingVideo(videoId)
    
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: videoId,
          type: video.type,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          channelName: video.channelTitle,
        }),
      })

      if (response.ok) {
        setAddedVideos(prev => new Set([...prev, videoId]))
      }
    } catch (error) {
      console.error('Failed to add video:', error)
    } finally {
      setAddingVideo(null)
    }
  }

  const handlePlayVideo = async (video: YouTubeSearchResult) => {
    const videoId = video.id
    
    if (!addedVideos.has(videoId)) {
      await handleAddVideo(video)
    }
    
    try {
      const response = await fetch('/api/videos')
      const videos = await response.json()
      const savedVideo = videos.find((v: any) => v.youtubeId === videoId)
      
      if (savedVideo) {
        setCurrentVideo(savedVideo)
        setCurrentView('video')
      }
    } catch (error) {
      console.error('Failed to play video:', error)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Search YouTube</h1>
          <p className="text-muted-foreground">
            Find videos to add to your learning library
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for videos..."
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </form>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No videos found. Try a different search.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((video) => {
            const isAdded = addedVideos.has(video.id)
            const isAdding = addingVideo === video.id
            
            return (
              <Card
                key={`${video.type}-${video.id}`}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png'
                    }}
                  />
                  <div 
                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayVideo(video)
                    }}
                  >
                    <Button variant="secondary" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </Button>
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-base line-clamp-2">
                    {video.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="truncate">{video.channelTitle}</span>
                  </div>
                  <Button
                    variant={isAdded ? "secondary" : "default"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isAdded) {
                        handleAddVideo(video)
                      }
                    }}
                    disabled={isAdded || isAdding}
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAdded ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}
