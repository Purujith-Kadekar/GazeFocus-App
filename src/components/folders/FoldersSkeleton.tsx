'use client'

import type { ReactNode } from 'react'
import { Skeleton } from 'boneyard-js/react'

function Bone({ className }: { className: string }) {
  return <div className={`rounded-xl skeleton-shimmer ${className}`} />
}

function FoldersListFixture() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Bone className="h-10 w-48" />
        <Bone className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 p-4">
          <Bone className="h-[120px] w-full" />
        </div>
        <div className="rounded-2xl border border-border/60 p-4">
          <Bone className="h-[120px] w-full" />
        </div>
        <div className="rounded-2xl border border-border/60 p-4">
          <Bone className="h-[120px] w-full" />
        </div>
        <div className="rounded-2xl border border-border/60 p-4">
          <Bone className="h-[120px] w-full" />
        </div>
        <div className="rounded-2xl border border-border/60 p-4">
          <Bone className="h-[120px] w-full" />
        </div>
        <div className="rounded-2xl border border-border/60 p-4">
          <Bone className="h-[120px] w-full" />
        </div>
      </div>
    </div>
  )
}

function FolderDetailFixture() {
  return (
    <div className="space-y-6">
      <Bone className="h-10 w-44" />

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Bone className="h-10 w-72" />
          <Bone className="h-4 w-28" />
        </div>
        <Bone className="h-9 w-9 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/60 p-3">
          <Bone className="h-40 w-full" />
          <Bone className="mt-3 h-5 w-5/6" />
          <Bone className="mt-2 h-4 w-24" />
        </div>
        <div className="rounded-2xl border border-border/60 p-3">
          <Bone className="h-40 w-full" />
          <Bone className="mt-3 h-5 w-4/5" />
          <Bone className="mt-2 h-4 w-20" />
        </div>
        <div className="rounded-2xl border border-border/60 p-3">
          <Bone className="h-40 w-full" />
          <Bone className="mt-3 h-5 w-3/4" />
          <Bone className="mt-2 h-4 w-24" />
        </div>
        <div className="rounded-2xl border border-border/60 p-3">
          <Bone className="h-40 w-full" />
          <Bone className="mt-3 h-5 w-5/6" />
          <Bone className="mt-2 h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

interface FoldersSkeletonProps {
  loading: boolean
  children: ReactNode
}

export function FoldersListSkeleton({ loading, children }: FoldersSkeletonProps) {
  return (
    <Skeleton
      name="folders-list-shell"
      loading={loading}
      color="rgba(164, 140, 104, 0.68)"
      darkColor="rgba(184, 156, 114, 0.56)"
      animate="shimmer"
      boneClass="rounded-2xl boneyard-accent-bone"
      fixture={<FoldersListFixture />}
      fallback={<FoldersListFixture />}
    >
      {children}
    </Skeleton>
  )
}

export function FolderDetailSkeleton({ loading, children }: FoldersSkeletonProps) {
  return (
    <Skeleton
      name="folder-detail-shell"
      loading={loading}
      color="rgba(164, 140, 104, 0.68)"
      darkColor="rgba(184, 156, 114, 0.56)"
      animate="shimmer"
      boneClass="rounded-2xl boneyard-accent-bone"
      fixture={<FolderDetailFixture />}
      fallback={<FolderDetailFixture />}
    >
      {children}
    </Skeleton>
  )
}