'use client'

import React from 'react'

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

export default function StableImage({
  src,
  alt,
  fill,
  priority,
  sizes,
  width,
  height,
  className,
  style,
  loading,
  fetchPriority,
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

  const resolvedLoading = loading ?? (priority ? 'eager' : 'lazy')
  const resolvedFetchPriority = fetchPriority ?? (priority ? 'high' : 'auto')
  const resolvedDecoding = decoding ?? 'async'

  const mergedStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : { ...style }

  return (
    <img
      key={currentSrc}
      src={currentSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      loading={resolvedLoading}
      fetchPriority={resolvedFetchPriority}
      decoding={resolvedDecoding}
      className={className}
      style={mergedStyle}
      onError={handleError}
      crossOrigin={crossOrigin || "anonymous"}
      {...rest}
    />
  )
}
