'use client'

import React from 'react'
import NextImage from 'next/image'

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
 * Next.js <Image> wrapper with retry-on-error fallback.
 *
 * Renders the optimized next/image component (automatic lazy loading,
 * sizing, and CDN transforms) while keeping the retry behavior that
 * flaky remote thumbnail hosts need: on error the source is re-fetched
 * up to twice with a cache-buster.
 *
 * SVG / data: / blob: sources bypass the image optimizer (it does not
 * transform vectors), which keeps local assets like /logo.svg working.
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
  ...rest
}: StableImageProps) {
  const [errorCount, setErrorCount] = React.useState(0)
  const [currentSrc, setCurrentSrc] = React.useState(src)

  React.useEffect(() => {
    setCurrentSrc(src)
    setErrorCount(0)
  }, [src])

  const handleError = () => {
    if (errorCount < 2) {
      // Simple retry by appending a cache-buster or just re-setting
      setTimeout(() => {
        setErrorCount(prev => prev + 1)
        setCurrentSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${errorCount}`)
      }, 500)
    }
  }

  // The optimizer cannot transform vectors or inline data — pass them
  // through unoptimized so local SVGs (e.g. /logo.svg) keep rendering.
  const bypassOptimizer =
    currentSrc.endsWith('.svg') ||
    currentSrc.startsWith('data:') ||
    currentSrc.startsWith('blob:')

  const mergedStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : { ...style }

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
