'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Globe,
  Link2,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { readRouteCache, writeRouteCache } from '@/lib/route-data-cache'
import type { Resource } from '@/types'

// Same entry the /resources page writes — the dashboard section and the
// full page stay consistent, and whichever loads first warms the other.
const RESOURCES_CACHE_KEY = 'gazefocus:resources-page-cache'

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Dashboard section listing recently saved links, mirroring RecentFolders.
 * Cache-first: renders the last-known list instantly (never a false
 * "0 links" while the fetch is in flight), then refreshes in the
 * background — the same pattern the /resources page uses.
 */
export function RecentResources({ limit = 6 }: { limit?: number }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [isReady, setIsReady] = useState(false)
  const resourcesRef = useRef<Resource[]>([])

  useEffect(() => {
    resourcesRef.current = resources
  }, [resources])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/resources')
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      if (!Array.isArray(data)) return
      setResources(data as Resource[])
      writeRouteCache(RESOURCES_CACHE_KEY, {
        resources: data as Resource[],
      })
    } catch {
      // keep whatever is rendered
    } finally {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    const cached = readRouteCache<{ resources: Resource[] }>(RESOURCES_CACHE_KEY)
    if (cached?.payload && Array.isArray(cached.payload.resources)) {
      setResources(cached.payload.resources)
      setIsReady(true)
      void load()
    } else {
      void load()
    }
  }, [load])

  // Another surface (resources page, search modal) saved a link — refresh.
  useEffect(() => {
    const handler = () => void load()
    window.addEventListener('gazefocus:resources-changed', handler)
    return () => window.removeEventListener('gazefocus:resources-changed', handler)
  }, [load])

  if (!isReady) {
    // First ever load: keep the section invisible rather than showing a
    // wrong "No links yet" while the fetch is in flight.
    return null
  }

  if (resources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No links yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Save docs, articles, and repos alongside your videos
            </p>
            <Button asChild>
              <a href="/resources">Open Resources</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const shown = resources.slice(0, limit)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Your Links</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {resources.length} saved
          </span>
          <Button variant="ghost" size="sm" asChild>
            <a href="/resources">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((resource) => (
            <a
              key={resource.id}
              href={resource.externalId}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/60 hover:bg-muted/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                <Link2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                  {resource.title || hostOf(resource.externalId)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {hostOf(resource.externalId)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </a>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full sm:w-auto" asChild>
          <a href="/resources">
            <Plus className="mr-2 h-4 w-4" />
            Add a link
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
