import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import FolderDetailClient from './FolderDetailClient'

interface FolderItemWithDetails {
  id: string
  type: 'PLAYLIST' | 'VIDEO'
  externalId: string
  title: string
  folderId: string | null
  thumbnail?: string | null
  metadata: Record<string, unknown> | null
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

  const [folderRes, allFoldersRes, completedData] = await Promise.all([
    db.from('Folder').select('*').eq('id', folderId).single(),
    db.from('Folder').select('*').eq('userId', user.id).order('createdAt', { ascending: false }),
    fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/progress/complete`, {
      cache: 'no-store'
    }).then(r => r.ok ? r.json() : { completedPlaylists: [] }).catch(() => ({ completedPlaylists: [] })),
  ])

  const folder = folderRes.data
  const allFolders = allFoldersRes.data || []

  if (!folder) {
    redirect('/folders')
  }

  // Get library items for this folder
  const { data: items } = await db.from('LibraryItem').select('*').eq('folderId', folderId)

  // Fetch thumbnails
  const playlistIds = (items || []).filter((i: any) => i.type === 'PLAYLIST').map((i: any) => i.externalId)
  const videoExternalIds = (items || []).filter((i: any) => i.type === 'VIDEO').map((i: any) => i.externalId)

  let playlistThumbnails: any[] = []
  let videoThumbnails: any[] = []

  if (playlistIds.length > 0) {
    const { data } = await db.from('Playlist').select('id, thumbnail').in('id', playlistIds)
    playlistThumbnails = data || []
  }
  if (videoExternalIds.length > 0) {
    const { data } = await db.from('Video').select('id, youtubeId, thumbnail').eq('userId', user.id)
    videoThumbnails = (data || []).filter((v: any) => videoExternalIds.includes(v.youtubeId) || videoExternalIds.includes(v.id))
  }

  const playlistMap = new Map<string, string | null>()
  for (const p of playlistThumbnails) {
    playlistMap.set(p.id, p.thumbnail)
  }
  const videoMap = new Map<string, string | null>()
  for (const v of videoThumbnails) {
    videoMap.set(v.id, v.thumbnail)
    videoMap.set(v.youtubeId, v.thumbnail)
  }

  const itemsWithThumbnails: FolderItemWithDetails[] = (items || []).map((item: any) => ({
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
    thumbnail: item.type === 'PLAYLIST'
      ? (playlistMap.get(item.externalId) ?? null)
      : (videoMap.get(item.externalId) ?? null),
  }))

  const completedSet = new Set<string>((completedData.completedPlaylists as string[]) || [])

  return (
    <FolderDetailClient
      initialFolder={folder}
      initialFolders={allFolders}
      initialItems={itemsWithThumbnails}
      completedPlaylists={completedSet}
    />
  )
}
