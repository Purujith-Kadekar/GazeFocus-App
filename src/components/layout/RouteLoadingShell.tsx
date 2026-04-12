"use client"

import { cn } from '@/lib/utils'

type RouteLoadingVariant = 'dashboard' | 'list' | 'detail' | 'search' | 'form'

function PulseBlock({ className }: { className: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-muted/45 dark:bg-muted/25', className)} />
}

function LoadingSidebar() {
  return (
    <aside className="hidden w-64 border-r border-border/60 bg-card/30 p-4 lg:flex lg:flex-col lg:gap-4">
      <PulseBlock className="h-10 w-40 rounded-full" />
      <div className="space-y-2">
        <PulseBlock className="h-10 w-full" />
        <PulseBlock className="h-10 w-full" />
        <PulseBlock className="h-10 w-full" />
        <PulseBlock className="h-10 w-4/5" />
      </div>
      <div className="mt-auto space-y-3">
        <PulseBlock className="h-12 w-full rounded-2xl" />
        <PulseBlock className="h-12 w-full rounded-2xl" />
      </div>
    </aside>
  )
}

function LoadingHeader() {
  return (
    <div className="flex h-16 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur md:px-6">
      <PulseBlock className="h-10 w-64 rounded-full" />
      <div className="flex items-center gap-3">
        <PulseBlock className="hidden h-10 w-28 rounded-full md:block" />
        <PulseBlock className="h-10 w-10 rounded-full" />
      </div>
    </div>
  )
}

function DashboardBody() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <PulseBlock className="h-10 w-64" />
          <PulseBlock className="h-4 w-80" />
        </div>
        <PulseBlock className="h-10 w-36 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <PulseBlock className="h-[240px] w-full rounded-2xl" />
          <PulseBlock className="h-[240px] w-full rounded-2xl" />
        </div>
        <PulseBlock className="h-[280px] w-full rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PulseBlock className="h-[420px] w-full rounded-2xl lg:col-span-2" />
        <PulseBlock className="h-[420px] w-full rounded-2xl" />
      </div>

      <PulseBlock className="h-[220px] w-full rounded-2xl" />
      <PulseBlock className="h-[96px] w-full rounded-2xl" />
    </div>
  )
}

function ListBody() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <PulseBlock className="h-10 w-72" />
        <PulseBlock className="h-4 w-96" />
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <PulseBlock className="h-11 flex-1 rounded-full" />
        <PulseBlock className="h-11 w-36 rounded-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/60 p-4">
            <PulseBlock className="h-40 w-full rounded-xl" />
            <div className="mt-4 space-y-2">
              <PulseBlock className="h-5 w-4/5" />
              <PulseBlock className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailBody() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <PulseBlock className="h-10 w-72" />
          <PulseBlock className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-3">
          <PulseBlock className="h-10 w-28 rounded-full" />
          <PulseBlock className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <PulseBlock className="h-[300px] w-full rounded-3xl" />
          <PulseBlock className="h-[220px] w-full rounded-3xl" />
          <PulseBlock className="h-[180px] w-full rounded-3xl" />
        </div>
        <div className="space-y-6">
          <PulseBlock className="h-[420px] w-full rounded-3xl" />
          <PulseBlock className="h-[240px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

function SearchBody() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <PulseBlock className="h-10 w-72" />
        <PulseBlock className="h-4 w-96" />
      </div>

      <div className="flex gap-2">
        <PulseBlock className="h-11 flex-1 rounded-full" />
        <PulseBlock className="h-11 w-28 rounded-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/60 p-4">
            <PulseBlock className="h-44 w-full rounded-xl" />
            <div className="mt-4 space-y-2">
              <PulseBlock className="h-5 w-5/6" />
              <PulseBlock className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormBody() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <PulseBlock className="h-10 w-64" />
        <PulseBlock className="h-4 w-80" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-border/60 p-6">
          <PulseBlock className="h-5 w-40" />
          <PulseBlock className="h-12 w-full rounded-xl" />
          <PulseBlock className="h-12 w-full rounded-xl" />
          <PulseBlock className="h-24 w-full rounded-2xl" />
        </div>
        <div className="space-y-4 rounded-3xl border border-border/60 p-6">
          <PulseBlock className="h-5 w-44" />
          <PulseBlock className="h-20 w-full rounded-2xl" />
          <PulseBlock className="h-20 w-full rounded-2xl" />
          <PulseBlock className="h-12 w-32 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function RouteLoadingShell({ variant = 'list' }: { variant?: RouteLoadingVariant }) {
  return (
    <div className="flex min-h-screen bg-background">
      <LoadingSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <LoadingHeader />
        <main className="flex-1 p-4 md:p-6">
          {variant === 'dashboard' ? <DashboardBody /> : null}
          {variant === 'list' ? <ListBody /> : null}
          {variant === 'detail' ? <DetailBody /> : null}
          {variant === 'search' ? <SearchBody /> : null}
          {variant === 'form' ? <FormBody /> : null}
        </main>
      </div>
    </div>
  )
}