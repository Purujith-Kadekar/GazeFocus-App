'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Rss,
  Plus,
  Trash2,
  ExternalLink,
  Chrome,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CalendarFeed } from '@/types'

interface FeedState {
  feeds: CalendarFeed[]
  googleConfigured: boolean
  googleConnected: boolean
  googleEmail: string | null
}

export function CalendarFeedsPanel() {
  const [state, setState] = useState<FeedState>({
    feeds: [],
    googleConfigured: false,
    googleConnected: false,
    googleEmail: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/feeds')
      if (res.ok) {
        const data = await res.json()
        setState({
          feeds: data.feeds ?? [],
          googleConfigured: data.google?.configured ?? false,
          googleConnected: data.google?.connected ?? false,
          googleEmail: data.google?.email ?? null,
        })
      }
    } catch (err) {
      console.error('Failed to fetch feeds:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchFeeds()
  }, [fetchFeeds])

  const handleAddFeed = async () => {
    if (!newUrl.trim()) return
    setIsAdding(true)
    setAddError(null)
    try {
      const res = await fetch('/api/calendar/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl: newUrl.trim(), feedName: newName.trim() || undefined }),
      })
      if (res.ok) {
        setNewUrl('')
        setNewName('')
        await fetchFeeds()
        window.dispatchEvent(new CustomEvent('refresh-calendar'))
      } else {
        const data = await res.json()
        setAddError(data.error || 'Failed to add feed')
      }
    } catch {
      setAddError('Network error')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleFeed = async (feed: CalendarFeed) => {
    const res = await fetch('/api/calendar/feeds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: feed.id, isEnabled: !feed.isEnabled }),
    })
    if (res.ok) {
      await fetchFeeds()
      window.dispatchEvent(new CustomEvent('refresh-calendar'))
    }
  }

  const handleDeleteFeed = async (feedId: string) => {
    await fetch(`/api/calendar/feeds?id=${feedId}`, { method: 'DELETE' })
    await fetchFeeds()
    window.dispatchEvent(new CustomEvent('refresh-calendar'))
  }

  const handleConnectGoogle = () => {
    window.location.href = '/api/calendar/google/connect'
  }

  const handleDisconnectGoogle = async () => {
    await fetch('/api/calendar/google', { method: 'DELETE' })
    setState((s) => ({ ...s, googleConnected: false, googleEmail: null }))
    void fetchFeeds()
  }

  return (
    <div className="space-y-4">
      {/* External Feeds */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Rss className="h-4 w-4" />
            External Calendars
          </h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Feed
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Calendar Feed</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>ICS URL</Label>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Display Name (optional)</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="School Calendar"
                    className="mt-1"
                  />
                </div>
                {addError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {addError}
                  </p>
                )}
                <Button
                  className="w-full"
                  disabled={!newUrl.trim() || isAdding}
                  onClick={handleAddFeed}
                >
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Feed
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : state.feeds.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No external feeds added. Add ICS URLs from Google Calendar, Outlook, or any other calendar.
          </p>
        ) : (
          <div className="space-y-1.5">
            {state.feeds.map((feed) => (
              <div
                key={feed.id}
                className="flex items-center gap-2 p-2 rounded-lg border bg-card"
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{feed.feedName}</p>
                  <p className="text-xs text-muted-foreground truncate">{feed.feedUrl}</p>
                </div>
                <Switch
                  checked={feed.isEnabled}
                  onCheckedChange={() => handleToggleFeed(feed)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleDeleteFeed(feed.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Calendar Account */}
      <div className="pt-3 border-t">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Chrome className="h-4 w-4" />
          Google Calendar Sync
        </h3>

        {!state.googleConfigured ? (
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Set <code className="text-xs">GOOGLE_CALENDAR_CLIENT_ID</code> and{' '}
              <code className="text-xs">GOOGLE_CALENDAR_CLIENT_SECRET</code> in your environment to enable
              Google Calendar sync.
            </p>
          </div>
        ) : state.googleConnected ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Connected
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 truncate">
                {state.googleEmail}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnectGoogle}>
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">
              Connect your Google account to sync agent tasks to your primary Google Calendar.
            </p>
            <Button size="sm" onClick={handleConnectGoogle} className="gap-1.5">
              <Chrome className="h-3.5 w-3.5" />
              Connect Google Calendar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
