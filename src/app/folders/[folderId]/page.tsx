import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import FolderDetailClient from './FolderDetailClient'
import { LibraryItemType } from '@prisma/client'

interface FolderItemWithDetails {
  id: string
  type: 'PLAYLIST' | 'VIDEO'
  externalId: string
  title: string
  folderId: string | null
  thumbnail?: string | null
  metadata?: unknown
  userId: string
  position: number
  createdAt: Date
  updatedAt: Date
}

export default async function FolderDetailPage({ params }: { params: Promise<{ folderId: string }> }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { folderId } = await params

  const [folder, allFolders, completedData] = await Promise.all([
    db.folder.findUnique({
      where: { id: folderId },
      include: {
        items: true,
      },
    }),
    db.folder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/progress/complete`, {
      cache: 'no-store'
    }).then(r => r.ok ? r.json() : { completedPlaylists: [] }).catch(() => ({ completedPlaylists: [] })),
  ])

  if (!folder) {
    redirect('/folders')
  }

  // Fetch thumbnails
  const playlistIds = folder.items.filter(i => i.type === LibraryItemType.PLAYLIST).map(i => i.externalId)
  const videoExternalIds = folder.items.filter(i => i.type === LibraryItemType.VIDEO).map(i => i.externalId)
  
  const [playlistThumbnails, videoThumbnails] = await Promise.all([
    playlistIds.length > 0 ? db.playlist.findMany({
      where: { id: { in: playlistIds } },
      select: { id: true, thumbnail: true },
    }) : [],
    videoExternalIds.length > 0 ? db.video.findMany({
      where: {
        userId: user.id,
        OR: [
          { youtubeId: { in: videoExternalIds } },
          { id: { in: videoExternalIds } },
        ],
      },
      select: { id: true, youtubeId: true, thumbnail: true },
    }) : [],
  ])
  
  const playlistMap = new Map<string, string | null>()
  for (const p of playlistThumbnails) {
    playlistMap.set(p.id, p.thumbnail)
  }
  const videoMap = new Map<string, string | null>()
  for (const v of videoThumbnails) {
    videoMap.set(v.id, v.thumbnail)
    videoMap.set(v.youtubeId, v.thumbnail)
  }
  
  const itemsWithThumbnails: FolderItemWithDetails[] = folder.items.map(item => ({
    id: item.id,
    userId: item.userId,
    title: item.title,
    type: item.type as 'PLAYLIST' | 'VIDEO',
    externalId: item.externalId,
    folderId: item.folderId,
    metadata: item.metadata,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    thumbnail: item.type === LibraryItemType.PLAYLIST
      ? (playlistMap.get(item.externalId) ?? null)
      : (videoMap.get(item.externalId) ?? null),
  }))

  const completedSet = new Set(completedData.completedPlaylists || [])

  return (
    <FolderDetailClient 
      initialFolder={folder} 
      initialFolders={allFolders} 
      initialItems={itemsWithThumbnails}
      completedPlaylists={completedSet}
    />
  )
}
