"use client"

import { useEffect, useState, type ReactNode } from 'react'
import { Skeleton } from 'boneyard-js/react'

function Bone({ className }: { className: string }) {
  return <div className={`rounded-xl skeleton-shimmer ${className}`} />
}

function DashboardSkeletonFixture() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Bone className="h-10 w-64" />
          <Bone className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Bone className="h-9 w-36 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 p-5">
            <Bone className="h-[240px] w-full" />
          </div>
          <div className="rounded-2xl border border-border/60 p-5">
            <Bone className="h-[240px] w-full" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 p-5">
          <Bone className="h-[280px] w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 p-5 lg:col-span-2">
          <Bone className="h-[420px] w-full" />
        </div>

        <div className="rounded-2xl border border-border/60 p-5">
          <Bone className="h-[420px] w-full" />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 p-5">
        <Bone className="h-[220px] w-full" />
      </div>

      <div className="rounded-2xl border border-border/60 p-5">
        <Bone className="h-[96px] w-full" />
      </div>
    </div>
  )
}

interface DashboardSkeletonProps {
  loading: boolean
  children: ReactNode
}

function RevealContent({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className="transition-all duration-400 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      {children}
    </div>
  )
}

export default function DashboardSkeleton({ loading, children }: DashboardSkeletonProps) {
  return (
    <Skeleton
      name="dashboard-shell"
      loading={loading}
      color="rgba(164, 140, 104, 0.68)"
      darkColor="rgba(184, 156, 114, 0.56)"
      animate="shimmer"
      boneClass="rounded-2xl boneyard-accent-bone"
      fixture={<DashboardSkeletonFixture />}
      fallback={<DashboardSkeletonFixture />}
    >
      <RevealContent>{children}</RevealContent>
    </Skeleton>
  )
}