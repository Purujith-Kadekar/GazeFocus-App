/**
 * YouTube thumbnail helpers.
 *
 * Pure functions only (no server/client imports) so they can be used by the
 * playlist importers on the server AND by <StableImage> in the browser.
 *
 * Why this exists: the importers fall back to Invidious / Piped when the
 * YouTube API isn't used, and those return thumbnail URLs that are either
 * RELATIVE ("/vi/<id>/maxres.jpg") or point at the instance's own host.
 * Next's image optimizer rejects both with a 400 (relative paths resolve to
 * our own site, other hosts aren't in images.remotePatterns), so the
 * thumbnails never load. A video's thumbnail is fully determined by its id,
 * so we derive it from the id instead of trusting whatever an instance sent.
 */

const VIDEO_ID = '[A-Za-z0-9_-]{11}'
const ID_IN_PATH = new RegExp(`/vi(?:_webp)?/(${VIDEO_ID})(?:/|$)`)
const BARE_ID = new RegExp(`^${VIDEO_ID}$`)

/** Hosts the Next image optimizer accepts. Keep in sync with next.config.ts → images.remotePatterns. */
const OPTIMIZABLE_HOSTS: RegExp[] = [
  /^i\.ytimg\.com$/,
  /^img\.youtube\.com$/,
  /^yt3\.ggpht\.com$/,
  /(^|\.)googleusercontent\.com$/,
  /(^|\.)ggpht\.com$/,
]

/** Hosts that actually serve /vi/<id>/… video thumbnails. */
const THUMBNAIL_HOSTS: RegExp[] = [/^i\.ytimg\.com$/, /^img\.youtube\.com$/]

export type ThumbnailQuality = 'mq' | 'hq' | 'maxres'

export function isValidVideoId(id: string | null | undefined): id is string {
  return !!id && BARE_ID.test(id)
}

/**
 * Canonical thumbnail for a video id. Defaults to hqdefault because it exists
 * for every video — maxresdefault 404s for any video not uploaded in HD,
 * which is what left holes in imported playlists before.
 */
export function youtubeThumbnail(videoId: string, quality: ThumbnailQuality = 'hq'): string {
  const file =
    quality === 'maxres' ? 'maxresdefault' : quality === 'mq' ? 'mqdefault' : 'hqdefault'
  return `https://i.ytimg.com/vi/${videoId}/${file}.jpg`
}

function hostOf(url: string): string | null {
  if (!/^https?:\/\//i.test(url)) return null
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

function matchesAny(host: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(host))
}

/** Pulls the video id out of a "/vi/<id>/…" style path on any host. */
export function extractThumbnailVideoId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(ID_IN_PATH)
  return m ? m[1] : null
}

/**
 * Repairs a stored thumbnail URL so the image optimizer can load it.
 *  - allowed YouTube/Google image hosts → returned untouched
 *  - relative or third-party "/vi/<id>/…" URLs (Invidious/Piped) → canonical YouTube URL
 *  - anything else (local assets like /logo.svg, unknown avatars) → returned untouched
 */
export function repairThumbnailUrl(url: string | null | undefined): string {
  let s = (url ?? '').trim()
  if (!s) return ''
  if (s.startsWith('//')) s = `https:${s}`

  const host = hostOf(s)
  if (host && matchesAny(host, OPTIMIZABLE_HOSTS)) return s

  const id = extractThumbnailVideoId(s)
  return id ? youtubeThumbnail(id) : s
}

/**
 * For the importers, where the video id is known: always yields a loadable
 * absolute URL. Trusts the incoming URL only if it's already on an allowed
 * host; otherwise derives the thumbnail from the id.
 */
export function normalizeVideoThumbnail(
  url: string | null | undefined,
  videoId?: string | null
): string {
  const repaired = repairThumbnailUrl(url)
  const host = hostOf(repaired)
  if (host && matchesAny(host, OPTIMIZABLE_HOSTS)) return repaired
  if (isValidVideoId(videoId)) return youtubeThumbnail(videoId)
  return repaired.startsWith('http') ? repaired : ''
}

/**
 * Ordered list of URLs <StableImage> should try before giving up:
 * the repaired source, then (for YouTube thumbnails) hqdefault and mqdefault,
 * which exist for every video even when maxresdefault 404s. For any other
 * remote image: one cache-busted retry. Local assets get a single attempt.
 */
export function thumbnailCandidates(src: string | null | undefined): string[] {
  const repaired = repairThumbnailUrl(src)
  if (!repaired) return []

  const list = [repaired]
  const host = hostOf(repaired)
  const id = host && matchesAny(host, THUMBNAIL_HOSTS) ? extractThumbnailVideoId(repaired) : null

  if (id) {
    for (const q of ['hq', 'mq'] as const) {
      const u = youtubeThumbnail(id, q)
      if (!list.includes(u)) list.push(u)
    }
  } else if (host) {
    list.push(`${repaired}${repaired.includes('?') ? '&' : '?'}retry=1`)
  }
  return list
}
