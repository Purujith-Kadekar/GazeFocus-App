'use client'

import React from 'react'
import NextImage from 'next/image'
import { thumbnailCandidates } from '@/lib/youtube/thumbnails'

type StableImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> & {
  src: string
  alt: string
  fill?: boolean
  priority?: boolean
  sizes?: string
  width?: number
  height?: number
  unoptimized?: boolean
}

/**
 * Next.js <Image> wrapper that keeps flaky thumbnails from ever showing as a
 * broken-image icon.
 *
 * 1. Repairs the source first: relative or Invidious/Piped-hosted
 *    "/vi/<id>/…" thumbnails (which the optimizer rejects with a 400) are
 *    rewritten to the canonical i.ytimg.com URL — this also fixes rows that
 *    are already saved that way in the database.
 * 2. On a load error it walks a fallback chain (e.g. maxresdefault, which
 *    404s for non-HD videos → hqdefault → mqdefault) instead of retrying
 *    the same dead URL.
 * 3. When everything fails it renders a neutral placeholder rather than the
 *    browser's broken-image icon with the alt text spilling out.
 *
 * SVG / data: / blob: sources, and local paths with a query string (which
 * Next 16's optimizer refuses), bypass the optimizer.
 */
export default function StableImage({
  src,
  alt,
  fill,
  priority,
  sizes,
  width,
  height,
  unoptimized,
  className,
  style,
  loading,
  decoding,
  crossOrigin,
  onError,
  ...rest
}: StableImageProps) {
  const candidates = React.useMemo(() => {
    const list = thumbnailCandidates(src)
    // Not something we can repair/derive from (e.g. a plain local asset):
    // still give it exactly one attempt as given.
    return list.length > 0 ? list : src ? [src] : []
  }, [src])

  // Track which candidate we're on, keyed to the src it belongs to so a new
  // src starts from the top without a flash of the old state.
  const [attempt, setAttempt] = React.useState<{ forSrc: string; index: number }>({
    forSrc: src,
    index: 0,
  })
  const index = attempt.forSrc === src ? attempt.index : 0
  const currentSrc = candidates[index]

  const mergedStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : { ...style }

  if (!currentSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={className}
        style={{
          ...mergedStyle,
          ...(!fill && width ? { width } : null),
          ...(!fill && height ? { height } : null),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'rgba(127, 127, 127, 0.12)',
          color: 'rgba(127, 127, 127, 0.55)',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    )
  }

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    onError?.(event)
    const next = index + 1
    // A same-URL cache-busted retry gets a short pause so a struggling host
    // isn't hammered; switching to a different URL is immediate.
    const isRetry = (candidates[next] ?? '').includes('retry=1')
    const advance = () => setAttempt({ forSrc: src, index: next })
    if (isRetry) setTimeout(advance, 500)
    else advance()
  }

  // The optimizer cannot transform vectors or inline data, and Next 16 refuses
  // local paths that carry a query string — load those directly.
  const bypassOptimizer =
    currentSrc.endsWith('.svg') ||
    currentSrc.startsWith('data:') ||
    currentSrc.startsWith('blob:') ||
    (currentSrc.startsWith('/') && currentSrc.includes('?'))

  return (
    <NextImage
      key={currentSrc}
      src={currentSrc}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      loading={loading}
      decoding={decoding}
      className={className}
      style={mergedStyle}
      onError={handleError}
      crossOrigin={crossOrigin || 'anonymous'}
      unoptimized={unoptimized ?? bypassOptimizer}
      {...rest}
    />
  )
}
