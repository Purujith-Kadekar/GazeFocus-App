'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from '@/components/ui/StableImage'
import { Search, User, Loader2, Plus, Check, Play, ListVideo, Users as UsersIcon, Video, ArrowUpDown, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MainLayout } from '@/components/layout/MainLayout'
import { useVideoStore, useUIStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import type { YouTubeSearchResult } from '@/types'

export default function SearchPage() {
  const { setCurrentVideo } = useVideoStore()
  const { setCurrentView } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YouTubeSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set<string>())
  const [addingItem, setAddingItem] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance')

  const runSearch = useCallback(async (term: string, searchType?: string) => {
    if (!term.trim()) return
    setIsLoading(true)
    setHasSearched(true)
    setSearchError(null)

    try {
      // Build URL with searchType parameter for targeted results
      let url = `/api/youtube?q=${encodeURIComponent(term)}`
      if (searchType && searchType !== 'all') {
        url += `&searchType=${searchType}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        let message = 'Search is temporarily unavailable. Please try again.'
        try {
          const errorPayload = await response.json()
          if (typeof errorPayload?.error === 'string' && errorPayload.error.trim()) {
            message = errorPayload.error
          }
        } catch {
          // Ignore parse failures and keep fallback message.
        }

        setSearchError(message)
        setResults([])
        return
      }
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setResults(data)
      } else if (data.error) {
        setSearchError(String(data.error))
        setResults([])
      } else {
        setResults([])
      }
    } catch (error) {
      setSearchError('Network issue while searching. Please try again.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const applyUrlQuery = () => {
      const urlQuery = (new URLSearchParams(window.location.search).get('q') || '').trim()
      if (!urlQuery) return
      setQuery(urlQuery)
      void runSearch(urlQuery)
    }

    const handleMobileHeaderSearch = (event: Event) => {
      const customEvent = event as CustomEvent<{ query?: string }>
      const term = customEvent.detail?.query?.trim()
      if (!term) return
      setQuery(term)
      void runSearch(term)
    }

    applyUrlQuery()
    window.addEventListener('mobile-header-search', handleMobileHeaderSearch)

    return () => {
      window.removeEventListener('mobile-header-search', handleMobileHeaderSearch)
    }
  }, [runSearch])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const searchType = activeTab === 'all' ? undefined : activeTab
    void runSearch(query, searchType)
  }

  // When tab changes with existing results, re-search with the new type
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (query.trim() && hasSearched) {
      const searchType = tab === 'all' ? undefined : tab
      void runSearch(query, searchType)
    }
  }

  const handleAddItem = async (item: YouTubeSearchResult) => {
    const itemId = item.id
    const uniqueKey = `${item.type}-${item.id}`
    setAddingItem(uniqueKey)
    
    try {
      // Route to the correct API based on type
      let apiUrl = '/api/videos'
      let body: Record<string, unknown> = {
        youtubeId: itemId,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        channelId: item.channelId,
        channelName: item.channelTitle,
      }

      if (item.type === 'channel') {
        apiUrl = '/api/channels'
        body = {
          youtubeId: itemId,
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail,
          subscriberCount: item.subscriberCount ? parseInt(item.subscriberCount) : 0,
        }
      } else if (item.type === 'playlist') {
        apiUrl = '/api/playlists'
        body = {
          youtubeId: itemId,
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail,
          channelId: item.channelId,
          channelName: item.channelTitle,
          totalVideos: item.videoCount,
        }
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setAddedItems(prev => new Set([...prev, uniqueKey]))
        // Refresh dashboard and relevant sections
        window.dispatchEvent(new CustomEvent('refresh-dashboard'))
        if (item.type === 'channel') {
          window.dispatchEvent(new CustomEvent('refresh-channels'))
        } else if (item.type === 'playlist') {
          window.dispatchEvent(new CustomEvent('refresh-playlists'))
        } else {
          window.dispatchEvent(new CustomEvent('refresh-videos'))
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add' }))
        console.error('Failed to add:', errorData.error)
      }
    } catch (error) {
      console.error('Failed to add:', error)
    } finally {
      setAddingItem(null)
    }
  }

  const handlePlayVideo = async (video: YouTubeSearchResult) => {
    if (video.type !== 'video') return // Only videos can be played directly
    const videoId = video.id
    const uniqueKey = `video-${videoId}`
    
    if (!addedItems.has(uniqueKey)) {
      await handleAddItem(video)
    }
    
    try {
      const response = await fetch('/api/videos?standaloneOnly=true')
      const videos = await response.json()
      const savedVideo = videos.find((v: { youtubeId: string }) => v.youtubeId === videoId)
      
      if (savedVideo) {
        setCurrentVideo(savedVideo)
        setCurrentView('video')
      }
    } catch (error) {
      console.error('Failed to play video:', error)
    }
  }

  // Filter results based on active tab
  const filteredResults = results.filter((result) => {
    if (activeTab === 'all') return true
    return result.type === activeTab
  })

  // Sort results based on sort preference
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'date') {
      // Sort by publishedAt (most recent first)
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return dateB - dateA
    }
    // Default: relevance (keep original order from API)
    return 0
  })

  const videoCount = results.filter(r => r.type === 'video').length
  const playlistCount = results.filter(r => r.type === 'playlist').length
  const channelCount = results.filter(r => r.type === 'channel').length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'playlist': return <ListVideo className="h-4 w-4" />
      case 'channel': return <UsersIcon className="h-4 w-4" />
      default: return <Video className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'playlist': return 'Playlist'
      case 'channel': return 'Channel'
      default: return 'Video'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Search YouTube</h1>
          <p className="text-muted-foreground">
            Find videos, playlists, and channels to add to your learning library
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search videos, playlists, channels..."
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
            <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchError || 'No results found. Try a different search.'}
            </p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All ({results.length})</TabsTrigger>
                <TabsTrigger value="video">Videos ({videoCount})</TabsTrigger>
                <TabsTrigger value="playlist">Playlists ({playlistCount})</TabsTrigger>
                <TabsTrigger value="channel">Channels ({channelCount})</TabsTrigger>
              </TabsList>
              
              {/* Sort controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant={sortBy === 'relevance' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('relevance')}
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Relevance
                </Button>
                <Button
                  variant={sortBy === 'date' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('date')}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Latest
                </Button>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedResults.map((item) => {
                  const uniqueKey = `${item.type}-${item.id}`
                  const isAdded = addedItems.has(uniqueKey)
                  const isAdding = addingItem === uniqueKey
                  
                  return (
                    <Card
                      key={uniqueKey}
                      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        {item.type === 'channel' ? (
                          // Channel thumbnail (circular)
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                            {item.thumbnail ? (
                              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden">
                                <Image
                                  src={item.thumbnail}
                                  alt={item.title}
                                  fill
                                  sizes="(max-width: 640px) 96px, 128px"
                                  className="object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.png'
                                  }}
                                />
                              </div>
                            ) : (
                              <UsersIcon className="h-16 w-16 text-blue-400" />
                            )}
                          </div>
                        ) : (
                          // Video/Playlist thumbnail
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 33vw"
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.png'
                            }}
                          />
                        )}
                        
                        {/* Type overlay for playlists */}
                        {item.type === 'playlist' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="flex items-center gap-1.5 text-white">
                              <ListVideo className="h-5 w-5" />
                              <span className="text-sm font-medium">Playlist</span>
                            </div>
                          </div>
                        )}

                        {/* Type overlay for channels */}
                        {item.type === 'channel' && item.thumbnail && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                              <UsersIcon className="h-3 w-3 mr-1" />
                              Channel
                            </Badge>
                          </div>
                        )}
                        
                        {/* Play overlay for videos */}
                        {item.type === 'video' && (
                          <div 
                            className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayVideo(item)
                            }}
                          >
                            <Button variant="secondary" size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Play
                            </Button>
                          </div>
                        )}
                      </div>

                      <CardHeader className="p-4">
                        <div className="flex items-start gap-2">
                          <CardTitle className="text-base line-clamp-2 flex-1">
                            {item.title}
                          </CardTitle>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "shrink-0 text-xs capitalize",
                              item.type === 'video' && "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400",
                              item.type === 'playlist' && "border-green-300 text-green-600 dark:border-green-700 dark:text-green-400",
                              item.type === 'channel' && "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400",
                            )}
                          >
                            {getTypeIcon(item.type)}
                            <span className="ml-1">{getTypeLabel(item.type)}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="truncate">{item.channelTitle}</span>
                          {item.duration && (
                            <span className="text-xs text-muted-foreground/70">
                              {Math.floor(parseInt(item.duration) / 60)}:{String(parseInt(item.duration) % 60).padStart(2, '0')}
                            </span>
                          )}
                          {item.videoCount && (
                            <span className="text-xs text-muted-foreground/70">
                              {item.videoCount} videos
                            </span>
                          )}
                        </div>
                        <Button
                          variant={isAdded ? "secondary" : "default"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isAdded) {
                              handleAddItem(item)
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
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  )
}
