'use client'

import Image from '@/components/ui/StableImage'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function Logo({ size = 32, className, style }: LogoProps) {
  return (
    <Image 
      src="/logo.svg" 
      alt="GazeFocus Logo" 
      width={size} 
      height={size}
      style={{
        ...style,
        width: size,
        height: size
      }}
      className={cn("shrink-0 transition-all duration-300 object-contain", className)}
    />
  )
}
