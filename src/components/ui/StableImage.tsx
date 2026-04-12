'use client'

import type React from 'react'

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
  ...rest
}: StableImageProps) {
  const resolvedLoading = loading ?? (priority ? 'eager' : 'lazy')
  const resolvedFetchPriority = fetchPriority ?? (priority ? 'high' : 'auto')
  const resolvedDecoding = decoding ?? 'async'

  const mergedStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : { ...style }

  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      loading={resolvedLoading}
      fetchPriority={resolvedFetchPriority}
      decoding={resolvedDecoding}
      className={className}
      style={mergedStyle}
      {...rest}
    />
  )
}
