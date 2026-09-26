import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

/** Minimal YouTube Data API playlistItems item shape used here. */
interface YTPlaylistItem {
  contentDetails: { videoId: string; videoPublishedAt?: string }
  snippet: {
    title: string
    description: string
    publishedAt?: string
    thumbnails?: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } }
  }
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

let quotaExhausted = false
let quotaCheckTime: string | null = null

const QUOTA_CHECK_INTERVAL = 60 * 60 * 1000
const RSS_REFRESH_API_GAP_HOURS = 24
const DEFAULT_USER_DAILY_TOKEN_LIMIT = 200

export function isQuotaExhausted(): boolean {
  if (!quotaCheckTime) return false
  const elapsed = Date.now() - new Date(quotaCheckTime).getTime()
  if (elapsed > QUOTA_CHECK_INTERVAL) {
    quotaExhausted = false
    quotaCheckTime = null
  }
  return quotaExhausted
}

export function markQuotaExhausted() {
  quotaExhausted = true
  quotaCheckTime = new Date().toISOString()
}

export function resetQuotaStatus() {
  quotaExhausted = false
  quotaCheckTime = null
}

export interface CachedChannelState {
  channelId: string
  lastSyncedAt: string | null
  nextPageToken: string | null
  totalCached: number
  lastApiFetchAt: string | null
}

export interface VideoMetadata {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  duration: number
  publishedAt: string
  channelId?: string
  liveBroadcastContent?: string
}

export interface ChannelMetadata {
  youtubeId: string
  title: string
  description: string
  thumbnail: string
  uploadsPlaylistId?: string
  lastSyncedAt?: string
  nextPageToken?: string
}

export interface CachedLatestVideoInfo {
  youtubeId: string | null
  title: string | null
  publishedAt: string | null
}

/**
 * Quota-efficient YouTube Metadata Engine
 * Uses Supabase as a global cache and the "UU" hack for playlist fetching.
 */
export class QuotaEngine {
  private static isMissingColumnError(error: unknown, columnName: string): boolean {
    const message = (error as { message?: string } | null)?.message || ''
    return message.toLowerCase().includes(columnName.toLowerCase())
  }

  private static utcDayKey(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value)
    const year = date.getUTCFullYear()
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${date.getUTCDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private static utcDayStartIso(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value)
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
    return start.toISOString()
  }

  private static async notifyTokenLimit(userId: string, limit: number, kind: 'reached' | 'blocked'): Promise<void> {
    try {
      const now = new Date()
      const dayStartIso = this.utcDayStartIso(now)

      const existing = await supabase
        .from('Notification')
        .select('id')
        .eq('userId', userId)
        .eq('title', 'Daily token limit reached')
        .gte('createdAt', dayStartIso)
        .limit(1)

      if (existing.error) {
        console.error('Token-limit notification check failed:', existing.error)
        return
      }

      if ((existing.data || []).length > 0) {
        return
      }

      const message =
        kind === 'blocked'
          ? `You have exceeded your daily token limit of ${limit}. Token-based API access is now blocked and will reset tomorrow (UTC).`
          : `You have reached your daily token limit of ${limit}. Further token-based API access will be blocked until tomorrow (UTC).`

      const insertResult = await supabase.from('Notification').insert({
        id: randomUUID(),
        userId,
        title: 'Daily token limit reached',
        message,
        global: false,
        read: false,
        createdAt: now.toISOString(),
      })

      if (insertResult.error) {
        console.error('Token-limit notification insert failed:', insertResult.error)
      }
    } catch (error) {
      console.error('Token-limit notification flow failed:', error)
    }
  }

  private static async consumeUserTokensIfNeeded(userId: string | undefined, units: number): Promise<boolean> {
    if (!userId || units <= 0) return true

    try {
      const [userResult, settingsResult] = await Promise.all([
        supabase
          .from('User')
          .select('id,isPremium,apiTokensUsed,apiTokensResetAt')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('SiteSettings')
          .select('id,userDailyTokenLimit')
          .eq('id', 'global')
          .maybeSingle(),
      ])

      if (userResult.error) {
        // Backward compatibility before token columns are migrated.
        if (this.isMissingColumnError(userResult.error, 'apiTokensUsed') || this.isMissingColumnError(userResult.error, 'apiTokensResetAt')) {
          return true
        }
        throw userResult.error
      }

      if (!userResult.data) return true
      if (userResult.data.isPremium) return true

      const configuredLimit = Number(settingsResult.data?.userDailyTokenLimit ?? DEFAULT_USER_DAILY_TOKEN_LIMIT)
      const limit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : DEFAULT_USER_DAILY_TOKEN_LIMIT

      const now = new Date()
      const today = this.utcDayKey(now)
      const lastReset = userResult.data.apiTokensResetAt ? this.utcDayKey(userResult.data.apiTokensResetAt) : null
      const currentUsed = lastReset === today ? Number(userResult.data.apiTokensUsed || 0) : 0

      if (currentUsed + units > limit) {
        this.notifyTokenLimit(userId, limit, 'blocked').catch(console.error)
        return false
      }

      const nextUsed = currentUsed + units
      const updateResult = await supabase
        .from('User')
        .update({
          apiTokensUsed: nextUsed,
          apiTokensResetAt: now.toISOString(),
        })
        .eq('id', userId)

      if (updateResult.error) {
        if (this.isMissingColumnError(updateResult.error, 'apiTokensUsed') || this.isMissingColumnError(updateResult.error, 'apiTokensResetAt')) {
          return true
        }
        throw updateResult.error
      }

      if (nextUsed >= limit) {
        this.notifyTokenLimit(userId, limit, 'reached').catch(console.error)
      }

      return true
    } catch (error) {
      console.error('Token consumption guard failed:', error)
      // Fail-open to avoid hard outage if schema is in transition.
      return true
    }
  }

  private static async upsertChannelJsonSnapshot(channelId: string, videos: VideoMetadata[]): Promise<void> {
    if (!channelId || videos.length === 0) return

    try {
      const existingResult = await supabase
        .from('ChannelJsonCache')
        .select('payload')
        .eq('channelId', channelId)
        .maybeSingle()

      const existingPayload = Array.isArray(existingResult.data?.payload) ? existingResult.data?.payload : []
      const existingVideos: VideoMetadata[] = (
        existingPayload as Array<{
          youtubeId?: string
          title?: string
          description?: string
          thumbnail?: string
          duration?: number | string
          publishedAt?: string
          channelId?: string
          liveBroadcastContent?: string
        }>
      ).map((entry) => ({
        youtubeId: entry.youtubeId || '',
        title: entry.title || '',
        description: entry.description || '',
        thumbnail: entry.thumbnail || '',
        duration: Number(entry.duration || 0),
        publishedAt: entry.publishedAt || '',
        channelId: entry.channelId || channelId,
        liveBroadcastContent: entry.liveBroadcastContent,
      }))

      const merged = this.mergeUniqueByYoutubeId(videos, existingVideos)
      const latestPublishedAt = merged[0]?.publishedAt || null

      await supabase.from('ChannelJsonCache').upsert({
        channelId,
        payload: merged,
        latestVideoPublishedAt: latestPublishedAt,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to update channel JSON snapshot cache:', error)
    }
  }

  static async getLatestCachedVideoInfo(channelId: string): Promise<CachedLatestVideoInfo> {
    try {
      const { data } = await supabase
        .from('ChannelJsonCache')
        .select('payload, latestVideoPublishedAt')
        .eq('channelId', channelId)
        .maybeSingle()

      if (!data) {
        return { youtubeId: null, title: null, publishedAt: null }
      }

      const payload = Array.isArray(data.payload) ? data.payload : []
      const first = payload[0] as { youtubeId?: string; title?: string; publishedAt?: string } | undefined

      return {
        youtubeId: first?.youtubeId || null,
        title: first?.title || null,
        publishedAt: (data.latestVideoPublishedAt as string | null) || first?.publishedAt || null,
      }
    } catch (error) {
      console.error('Failed to read channel JSON snapshot cache:', error)
      return { youtubeId: null, title: null, publishedAt: null }
    }
  }

  private static normalizePublishedAt(value: string | null | undefined): number {
    if (!value) return 0
    const ts = new Date(value).getTime()
    return Number.isFinite(ts) ? ts : 0
  }

  private static newestPublishedAt(videos: VideoMetadata[]): number {
    if (videos.length === 0) return 0
    return Math.max(...videos.map((video) => this.normalizePublishedAt(video.publishedAt)))
  }

  private static mergeUniqueByYoutubeId(primary: VideoMetadata[], secondary: VideoMetadata[]): VideoMetadata[] {
    const seen = new Set<string>()
    const merged: VideoMetadata[] = []

    for (const video of [...primary, ...secondary]) {
      if (!video.youtubeId || seen.has(video.youtubeId)) continue
      seen.add(video.youtubeId)
      merged.push(video)
    }

    return merged.sort((a, b) => this.normalizePublishedAt(b.publishedAt) - this.normalizePublishedAt(a.publishedAt))
  }

  /**
   * Fetches video metadata, prioritizing the global cache.
   */
static async getVideo(videoId: string, userId?: string): Promise<VideoMetadata | null> {
    const { data: cached } = await supabase
      .from('VideoCache')
      .select('youtubeId,title,description,thumbnail,duration,publishedAt,channelId,liveBroadcastContent,isLive')
      .eq('youtubeId', videoId)
      .maybeSingle()

    if (cached) {
      return {
        youtubeId: cached.youtubeId,
        title: cached.title,
        description: cached.description,
        thumbnail: cached.thumbnail,
        duration: cached.duration,
        publishedAt: cached.publishedAt,
        channelId: cached.channelId,
        liveBroadcastContent: cached.liveBroadcastContent
      }
    }

    // 2. Fetch from YouTube (1 unit)
    if (!YOUTUBE_API_KEY) return null
    if (!(await this.consumeUserTokensIfNeeded(userId, 1))) {
      return null
    }

    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
      )
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const item = data.items[0]
        const metadata: VideoMetadata = {
          youtubeId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
          duration: this.parseDuration(item.contentDetails.duration),
          publishedAt: item.snippet.publishedAt,
          channelId: item.snippet.channelId,
          liveBroadcastContent: item.snippet.liveBroadcastContent
        }

        // 3. Update Cache (Background)
        this.updateVideoCache(metadata).catch(console.error)

        return metadata
      }
    } catch (error) {
      console.error('Error fetching YouTube video:', error)
    }

    return null
  }

  /**
   * Fetches channel metadata, prioritizing the global cache.
   */
  static async getChannel(channelId: string, userId?: string): Promise<ChannelMetadata | null> {
    const { data: cached } = await supabase
      .from('ChannelCache')
      .select('youtubeId,title,description,thumbnail,subscriberCount,videoCount,uploadsPlaylistId,lastSyncedAt,nextPageToken')
      .eq('youtubeId', channelId)
      .maybeSingle()

    if (cached) return cached

    if (!YOUTUBE_API_KEY) return null
    if (!(await this.consumeUserTokensIfNeeded(userId, 1))) {
      return null
    }

    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
      )
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const item = data.items[0]
        const metadata: ChannelMetadata = {
          youtubeId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
          uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads || item.id.replace(/^UC/, 'UU'),
          lastSyncedAt: new Date().toISOString()
        }

        this.updateChannelCache(metadata).catch(console.error)
        return metadata
      }
    } catch (error) {
      console.error('Error fetching YouTube channel:', error)
    }

    return null
  }

  /**
   * Quota-efficient search for recent videos using the "UU" hack (1 unit).
   * Automatically falls back to RSS if quota is exceeded (403).
   */
  static async getRecentVideos(channelId: string, maxResults = 50, pageToken?: string, userId?: string): Promise<{ items: VideoMetadata[], nextPageToken?: string }> {
    const channel = await this.getChannel(channelId, userId)
    if (!channel?.uploadsPlaylistId || !YOUTUBE_API_KEY) {
      console.warn('Missing uploadsPlaylistId or YOUTUBE_API_KEY. QuotaEngine falling back to RSS feed...')
      const rssVideos = await this.getRSSVideos(channelId)
      return { items: rssVideos }
    }

    try {
      if (!(await this.consumeUserTokensIfNeeded(userId, 1))) {
        const rssVideos = await this.getRSSVideos(channelId)
        return { items: rssVideos }
      }

      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
      url.searchParams.set('part', 'snippet,contentDetails')
      url.searchParams.set('playlistId', channel.uploadsPlaylistId)
      url.searchParams.set('maxResults', maxResults.toString())
      url.searchParams.set('key', YOUTUBE_API_KEY)
      if (pageToken) url.searchParams.set('pageToken', pageToken)

      const response = await fetch(url.toString())
      
      // Handle Quota Error (403) or Rate Limit (429)
      if (response.status === 403 || response.status === 429) {
        console.warn('YouTube API Quota Exceeded (403). Falling back to RSS feed...')
        markQuotaExhausted()
        const rssVideos = await this.getRSSVideos(channelId)
        return { items: rssVideos }
      }

      const data = await response.json()
      if (data.items) {
        const baseVideos = data.items.map((item: YTPlaylistItem) => ({
          youtubeId: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.contentDetails.videoId}/maxresdefault.jpg`,
          duration: 0,
          publishedAt: item.snippet.publishedAt,
          channelId: channelId
        }))

        // Surgical Enrichment for the 50 fetched videos (1 unit)
        const videoIds = baseVideos.map(v => v.youtubeId)
        const enrichment = await this.enrichVideoMetadata(videoIds, userId)
        
        const videos = baseVideos.map(v => ({
          ...v,
          duration: enrichment[v.youtubeId]?.duration ?? 0,
          description: enrichment[v.youtubeId]?.description ?? v.description,
          title: enrichment[v.youtubeId]?.title ?? v.title,
          thumbnail: enrichment[v.youtubeId]?.thumbnail ?? v.thumbnail,
          liveBroadcastContent: enrichment[v.youtubeId]?.liveBroadcastContent
        }))

        // Update Cache in background
        this.bulkUpdateVideoCache(videos).catch(console.error)

        return { 
          items: videos, 
          nextPageToken: data.nextPageToken 
        }
      }
    } catch (error) {
      console.error('Error in getRecentVideos:', error)
      // Fallback for network errors
      const rssVideos = await this.getRSSVideos(channelId)
      return { items: rssVideos }
    }

    return { items: [] }
  }

  /**
   * Zero-quota fallback: Parsed metadata from RSS.
   * Scrapes Title, Description snippet, and Thumbnail from XML.
   * Uses Surgical Enrichment to get full details (1 unit).
   */
  static async getRSSVideos(channelId: string, userId?: string): Promise<VideoMetadata[]> {
    try {
      const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
      const text = await response.text()
      
      const entries = text.split('<entry>').slice(1)
      const rssVideos: VideoMetadata[] = entries.map(entry => {
        const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
        const titleMatch = entry.match(/<title>(.*?)<\/title>/)
        const dateMatch = entry.match(/<published>(.*?)<\/published>/)
        const descMatch = entry.match(/<media:description>(.*?)<\/media:description>/)
        
        const videoId = idMatch ? idMatch[1] : ''
        return {
          youtubeId: videoId,
          title: titleMatch ? titleMatch[1] : 'Unknown Title',
          description: descMatch ? descMatch[1] : '',
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '',
          duration: 0,
          publishedAt: dateMatch ? dateMatch[1] : new Date().toISOString(),
          channelId
        }
      }).filter(v => v.youtubeId !== '')

      if (rssVideos.length > 0) {
        // Enriched metadata (1 unit)
        const videoIds = rssVideos.map(v => v.youtubeId)
        const enrichment = await this.enrichVideoMetadata(videoIds, userId)
        
        const enrichedVideos = rssVideos.map(v => ({
          ...v,
          duration: enrichment[v.youtubeId]?.duration ?? 0,
          description: enrichment[v.youtubeId]?.description ?? v.description,
          title: enrichment[v.youtubeId]?.title ?? v.title,
          thumbnail: enrichment[v.youtubeId]?.thumbnail ?? v.thumbnail,
          liveBroadcastContent: enrichment[v.youtubeId]?.liveBroadcastContent
        }))

        this.bulkUpdateVideoCache(enrichedVideos).catch(console.error)
        this.upsertChannelJsonSnapshot(channelId, enrichedVideos).catch(console.error)
        return enrichedVideos
      }

      return rssVideos
    } catch (error) {
      console.error('RSS fetch failed:', error)
      return []
    }
  }

  /**
   * Get playlist videos from RSS feed (zero API quota)
   * Uses Surgical Enrichment to get full details (1 unit).
   */
  static async getRSSPlaylistVideos(
    playlistId: string,
    userId?: string
  ): Promise<{ youtubeId: string; title: string; description: string; thumbnail: string; duration: number; position: number }[]> {
    try {
      const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const text = await response.text()

      const entries = text.split('<entry>').slice(1)
      const rssVideos = entries.map((entry, index) => {
        const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
        const titleMatch = entry.match(/<title>(.*?)<\/title>/)
        const descMatch = entry.match(/<media:description>(.*?)<\/media:description>/)

        const videoId = idMatch ? idMatch[1] : ''
        return {
          youtubeId: videoId,
          title: titleMatch ? titleMatch[1] : 'Unknown Title',
          description: descMatch ? descMatch[1] : '',
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '',
          duration: 0,
          position: index,
        }
      }).filter(v => v.youtubeId !== '')

      if (rssVideos.length > 0) {
        const videoIds = rssVideos.map(v => v.youtubeId)
        const enrichment = await this.enrichVideoMetadata(videoIds, userId)
        
        return rssVideos.map(v => ({
          ...v,
          duration: enrichment[v.youtubeId]?.duration ?? 0,
          description: enrichment[v.youtubeId]?.description ?? v.description,
          title: enrichment[v.youtubeId]?.title ?? v.title,
          thumbnail: enrichment[v.youtubeId]?.thumbnail ?? v.thumbnail,
        }))
      }

      return rssVideos
    } catch (error) {
      console.error('[QuotaEngine] RSS playlist fetch failed:', error)
      return []
    }
  }

  /**
   * Unified Channel Synchronization
   */
  static async syncChannel(channelId: string, userId: string, pageToken?: string) {
    const channel = await this.getChannel(channelId, userId)
    if (!channel) return null

    // 1. Get recent videos (API with RSS Fallback)
    const { items: videos, nextPageToken } = await this.getRecentVideos(channelId, 50, pageToken, userId)
    
    // 2. Check live status (RSS first if live check is expensive)
    const isLive = false // Needs implementation or separate check
    
    return {
      channel,
      videos,
      isLive,
      nextPageToken
    }
  }

  /**
   * Get cached state for a channel (how many videos, last sync time)
   */
  static async getChannelCacheState(channelId: string): Promise<CachedChannelState | null> {
    const { count } = await supabase
      .from('VideoCache')
      .select('youtubeId', { count: 'exact' })
      .eq('channelId', channelId)
    const { data: cachedChannel } = await supabase
      .from('ChannelCache')
      .select('lastSyncedAt,nextPageToken')
      .eq('youtubeId', channelId)
      .maybeSingle()

    return {
      channelId,
      lastSyncedAt: cachedChannel?.lastSyncedAt || null,
      nextPageToken: cachedChannel?.nextPageToken || null,
      totalCached: count || 0,
      lastApiFetchAt: cachedChannel?.lastSyncedAt || null,
    }
  }

  /**
   * Get cached videos for a channel (from VideoCache table)
   */
  static async getCachedVideos(channelId: string, limit = 50, offset = 0): Promise<VideoMetadata[]> {
    const { data: videos } = await supabase
      .from('VideoCache')
      .select('youtubeId,title,description,thumbnail,duration,publishedAt,channelId,liveBroadcastContent')
      .eq('channelId', channelId)
      .order('publishedAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!videos) return []

    return videos.map(v => ({
      youtubeId: v.youtubeId,
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      duration: v.duration,
      publishedAt: v.publishedAt,
      channelId: v.channelId,
      liveBroadcastContent: v.liveBroadcastContent
    }))
  }

  /**
   * Fallback cache source: videos already saved in app library for a channel.
   * This prevents unnecessary API re-fetches when VideoCache is empty.
   */
  private static async getStoredChannelVideos(channelId: string, limit = 50, offset = 0): Promise<VideoMetadata[]> {
    try {
      const channelResult = await supabase
        .from('Channel')
        .select('id,youtubeId')
        .eq('youtubeId', channelId)
        .maybeSingle()

      if (channelResult.error || !channelResult.data) return []

      const { data: videos, error } = await supabase
        .from('Video')
        .select('youtubeId,title,description,thumbnail,duration,createdAt')
        .eq('channelId', channelResult.data.id)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error || !videos) return []

      return videos.map(v => ({
        youtubeId: v.youtubeId,
        title: v.title,
        description: v.description || '',
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`,
        duration: Number(v.duration || 0),
        publishedAt: v.createdAt,
        channelId,
        liveBroadcastContent: 'none',
      }))
    } catch {
      return []
    }
  }

  /**
   * Smart fetch: decides between API, cache, or RSS based on quota and available data
   */
  static async smartFetchVideos(
    channelId: string,
    mode: 'initial' | 'loadMore' | 'refresh' = 'initial',
    maxResults = 50,
    userId?: string
  ): Promise<{
    videos: VideoMetadata[],
    nextPageToken: string | null,
    source: 'api' | 'cache' | 'rss',
    hasMore: boolean
  }> {
    // Initial mode: cache-first, API seed only when cache is empty.
    if (mode === 'initial') {
      const cachedVideos = await this.getCachedVideos(channelId, maxResults)
      if (cachedVideos.length > 0) {
        const state = await this.getChannelCacheState(channelId)
        this.upsertChannelJsonSnapshot(channelId, cachedVideos).catch(console.error)
        return {
          videos: cachedVideos,
          nextPageToken: state?.nextPageToken || null,
          source: 'cache',
          hasMore: !!state?.nextPageToken || (cachedVideos.length >= maxResults)
        }
      }

      const storedVideos = await this.getStoredChannelVideos(channelId, maxResults)
      if (storedVideos.length > 0) {
        const state = await this.getChannelCacheState(channelId)
        this.upsertChannelJsonSnapshot(channelId, storedVideos).catch(console.error)
        return {
          videos: storedVideos,
          nextPageToken: state?.nextPageToken || null,
          source: 'cache',
          hasMore: !!state?.nextPageToken || (storedVideos.length >= maxResults)
        }
      }

      if (isQuotaExhausted()) {
        const rssVideos = await this.getRSSVideos(channelId)
        return {
          videos: rssVideos,
          nextPageToken: null,
          source: 'rss',
          hasMore: false,
        }
      }

      try {
        const result = await this.getRecentVideos(channelId, maxResults, undefined, userId)
        if (result.items.length > 0) {
          if (result.nextPageToken) {
            await this.updateChannelNextPageToken(channelId, result.nextPageToken)
          }
          this.upsertChannelJsonSnapshot(channelId, result.items).catch(console.error)
          return {
            videos: result.items,
            nextPageToken: result.nextPageToken || null,
            source: 'api',
            hasMore: !!result.nextPageToken,
          }
        }
      } catch (e) {
        console.error('Error during initial API seed fetch:', e)
      }

      const rssVideos = await this.getRSSVideos(channelId)
      this.upsertChannelJsonSnapshot(channelId, rssVideos).catch(console.error)
      return {
        videos: rssVideos,
        nextPageToken: null,
        source: 'rss',
        hasMore: false,
      }
    }

    // Refresh mode: RSS-first, API only if RSS/cached date gap is significant.
    if (mode === 'refresh') {
      const [rssVideos, cachedVideos, storedVideos, state] = await Promise.all([
        this.getRSSVideos(channelId),
        this.getCachedVideos(channelId, maxResults),
        this.getStoredChannelVideos(channelId, maxResults),
        this.getChannelCacheState(channelId),
      ])

      const mergedCachedVideos = this.mergeUniqueByYoutubeId(cachedVideos, storedVideos).slice(0, maxResults)

      const rssNewestTs = this.newestPublishedAt(rssVideos)
      const cacheNewestTs = this.newestPublishedAt(mergedCachedVideos)
      const gapHours =
        rssNewestTs > 0 && cacheNewestTs > 0
          ? (rssNewestTs - cacheNewestTs) / (1000 * 60 * 60)
          : Infinity

      const shouldUseApi =
        !isQuotaExhausted() &&
        (gapHours >= RSS_REFRESH_API_GAP_HOURS || (mergedCachedVideos.length === 0 && rssVideos.length === 0))

      if (shouldUseApi) {
        try {
          const result = await this.getRecentVideos(channelId, maxResults, undefined, userId)
          if (result.items.length > 0) {
            if (result.nextPageToken) {
              await this.updateChannelNextPageToken(channelId, result.nextPageToken)
            }
            this.upsertChannelJsonSnapshot(channelId, result.items).catch(console.error)
            return {
              videos: result.items,
              nextPageToken: result.nextPageToken || null,
              source: 'api',
              hasMore: !!result.nextPageToken,
            }
          }
        } catch (e) {
          console.error('Error during refresh API fetch:', e)
        }
      }

      const merged = this.mergeUniqueByYoutubeId(rssVideos, mergedCachedVideos).slice(0, maxResults)
      this.upsertChannelJsonSnapshot(channelId, merged).catch(console.error)
      return {
        videos: merged,
        nextPageToken: state?.nextPageToken || null,
        source: 'rss',
        hasMore: !!state?.nextPageToken,
      }
    }

    // Default fallback.
    const rssVideos = await this.getRSSVideos(channelId)
    this.upsertChannelJsonSnapshot(channelId, rssVideos).catch(console.error)
    return {
      videos: rssVideos,
      nextPageToken: null,
      source: 'rss',
      hasMore: false
    }
  }

  /**
   * Load more videos using pagination
   */
  static async loadMoreVideos(
    channelId: string,
    pageToken: string,
    maxResults = 50,
    userId?: string
  ): Promise<{
    videos: VideoMetadata[],
    nextPageToken: string | null,
    source: 'api' | 'cache' | 'rss',
    hasMore: boolean
  }> {
    // Load more is API-only pagination by design.
    if (isQuotaExhausted()) {
      return {
        videos: [],
        nextPageToken: null,
        source: 'api',
        hasMore: false,
      }
    }

    try {
      const channel = await this.getChannel(channelId, userId)
      if (!channel?.uploadsPlaylistId || !YOUTUBE_API_KEY) {
        return { videos: [], nextPageToken: null, source: 'api', hasMore: false }
      }

      if (!(await this.consumeUserTokensIfNeeded(userId, 1))) {
        return { videos: [], nextPageToken: null, source: 'api', hasMore: false }
      }

      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
      url.searchParams.set('part', 'snippet,contentDetails')
      url.searchParams.set('playlistId', channel.uploadsPlaylistId)
      url.searchParams.set('maxResults', maxResults.toString())
      url.searchParams.set('key', YOUTUBE_API_KEY)
      url.searchParams.set('pageToken', pageToken)

      const response = await fetch(url.toString())

      if (response.status === 403 || response.status === 429) {
        markQuotaExhausted()
        return { videos: [], nextPageToken: null, source: 'api', hasMore: false }
      }

      const data = await response.json()
      if (data.items) {
        const videos = data.items.map((item: YTPlaylistItem) => ({
          youtubeId: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.contentDetails.videoId}/maxresdefault.jpg`,
          duration: 0,
          publishedAt: item.snippet.publishedAt,
          channelId
        }))

        this.bulkUpdateVideoCache(videos).catch(console.error)

        if (data.nextPageToken) {
          await this.updateChannelNextPageToken(channelId, data.nextPageToken)
        }
        this.upsertChannelJsonSnapshot(channelId, videos).catch(console.error)

        return {
          videos,
          nextPageToken: data.nextPageToken || null,
          source: 'api',
          hasMore: !!data.nextPageToken
        }
      }
    } catch (e) {
      console.error('Error in loadMoreVideos:', e)
    }

    return { videos: [], nextPageToken: null, source: 'api', hasMore: false }
  }

  private static async updateChannelNextPageToken(channelId: string, nextPageToken: string) {
    await supabase.from('ChannelCache').upsert({
      youtubeId: channelId,
      nextPageToken,
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  private static async updateVideoCache(video: VideoMetadata) {
    await supabase.from('VideoCache').upsert({
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      duration: video.duration || 0,
      publishedAt: video.publishedAt,
      channelId: video.channelId,
      liveBroadcastContent: video.liveBroadcastContent,
      isLive: video.liveBroadcastContent === 'live',
      updatedAt: new Date().toISOString()
    })
  }

  /**
   * Surgical Enrichment: Fetches details (duration, description, liveStatus)
   * for up to 50 videos in a single API call (1 unit).
   */
  static async enrichVideoMetadata(videoIds: string[], userId?: string): Promise<Record<string, Partial<VideoMetadata>>> {
    if (videoIds.length === 0 || !YOUTUBE_API_KEY) return {}

    try {
      if (!(await this.consumeUserTokensIfNeeded(userId, 1))) {
        return {}
      }

      const response = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoIds.slice(0, 50).join(',')}&key=${YOUTUBE_API_KEY}`
      )
      const data = await response.json()

      if (data.items) {
        const enrichment: Record<string, Partial<VideoMetadata>> = {}
        for (const item of data.items) {
          enrichment[item.id] = {
            description: item.snippet.description,
            duration: this.parseDuration(item.contentDetails.duration),
            liveBroadcastContent: item.snippet.liveBroadcastContent,
            title: item.snippet.title, // Update title in case RSS was truncated
            thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
          }
        }
        return enrichment
      }
    } catch (error) {
      console.error('Error enriching video metadata:', error)
    }
    return {}
  }

  private static async bulkUpdateVideoCache(videos: VideoMetadata[]) {
    if (videos.length === 0) return
    await supabase.from('VideoCache').upsert(
      videos.map(v => ({
        youtubeId: v.youtubeId,
        title: v.title,
        description: v.description,
        thumbnail: v.thumbnail,
        duration: v.duration || 0,
        publishedAt: v.publishedAt,
        channelId: v.channelId,
        liveBroadcastContent: v.liveBroadcastContent,
        isLive: v.liveBroadcastContent === 'live',
        updatedAt: new Date().toISOString()
      }))
    )
  }

  private static async updateChannelCache(channel: ChannelMetadata) {
    await supabase.from('ChannelCache').upsert({
      youtubeId: channel.youtubeId,
      title: channel.title,
      description: channel.description,
      thumbnail: channel.thumbnail,
      uploadsPlaylistId: channel.uploadsPlaylistId,
      nextPageToken: channel.nextPageToken,
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  private static parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return 0
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    return hours * 3600 + minutes * 60 + seconds
  }
}
