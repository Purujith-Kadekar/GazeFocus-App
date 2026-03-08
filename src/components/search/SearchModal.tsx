'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, List, Video } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { YouTubeSearchResult } from '@/types'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YouTubeSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.error) {
        console.error('Search error:', data.error)
        setResults([])
      } else {
        setResults(data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const filteredResults = results.filter((result) => {
    if (activeTab === 'all') return true
    return result.type === activeTab
  })

  const getUniqueKey = (result: YouTubeSearchResult) => {
    return `${result.type}-${result.id}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Search for YouTube videos and playlists to add to your library.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search videos and playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({results.length})</TabsTrigger>
              <TabsTrigger value="video">
                Videos ({results.filter((r) => r.type === 'video').length})
              </TabsTrigger>
              <TabsTrigger value="playlist">
                Playlists ({results.filter((r) => r.type === 'playlist').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {filteredResults.map((result) => (
                    <SearchResultCard key={getUniqueKey(result)} result={result} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {!isSearching && query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
          </div>
        )}

        {!query && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">Start typing to search YouTube</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SearchResultCard({ result }: { result: YouTubeSearchResult }) {
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsAdding(true)
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: result.id,
          type: result.type,
          title: result.title,
          description: result.description,
          thumbnail: result.thumbnail,
          channelId: result.channelId,
          channelName: result.channelTitle,
        }),
      })
      
      if (response.ok) {
        setAdded(true)
      }
    } catch (error) {
      console.error('Failed to add:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="flex gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
      <div className="relative w-32 h-20 shrink-0 rounded overflow-hidden bg-muted">
        <img
          src={result.thumbnail}
          alt={result.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.png'
          }}
        />
        {result.type === 'video' && result.duration && (
          <Badge className="absolute bottom-1 right-1 text-[10px] px-1" variant="secondary">
            {result.duration}
          </Badge>
        )}
        {result.type === 'playlist' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex items-center gap-1 text-white">
              <List className="h-4 w-4" />
              <span className="text-xs">{result.videoCount} videos</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium line-clamp-2">{result.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{result.channelTitle}</p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{result.description}</p>
      </div>

      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleAdd}
        disabled={isAdding || added}
      >
        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : added ? 'Added' : 'Add'}
      </Button>
    </div>
  )
}
