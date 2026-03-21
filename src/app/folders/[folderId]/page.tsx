import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import FolderDetailClient from './FolderDetailClient'

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
    db.from('Folder').select('*').eq('id', folderId).single(),
    db.from('Folder').select('*').eq('userId', user.id).order('createdAt', { ascending: false }),
    fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/progress/complete`, {
      cache: 'no-store'
    }).then(r => r.ok ? r.json() : { completedPlaylists: [] }).catch(() => ({ completedPlaylists: [] })),
  ])

  if (!folder.data) {
    redirect('/folders')
  }

  const { data: folderItems } = await db.from('LibraryItem').select('*').eq('folderId', folderId)

  const playlistIds = (folderItems || []).filter((i: any) => i.type === 'PLAYLIST').map((i: any) => i.externalId)
  const videoExternalIds = (folderItems || []).filter((i: any) => i.type === 'VIDEO').map((i: any) => i.externalId)
  
  const [playlistThumbnails, videoThumbnails] = await Promise.all([
    playlistIds.length > 0 ? db.from('Playlist').select('id, thumbnail').in('id', playlistIds) : { data: [] },
    videoExternalIds.length > 0 ? db.from('Video').select('id, youtubeId, thumbnail').eq('userId', user.id).or(`youtubeId.in.(${videoExternalIds.join(',')}),id.in.(${videoExternalIds.join(',')})`) : { data: [] },
  ])
  
  const playlistMap = new Map<string, string | null>()
  for (const p of (playlistThumbnails.data || [])) {
    playlistMap.set(p.id, p.thumbnail)
  }
  const videoMap = new Map<string, string | null>()
  for (const v of (videoThumbnails.data || [])) {
    videoMap.set(v.id, v.thumbnail)
    videoMap.set(v.youtubeId, v.thumbnail)
  }
  
  const itemsWithThumbnails = (folderItems || []).map((item: any) => ({
    id: item.id,
    userId: item.userId,
    title: item.title,
    type: item.type,
    externalId: item.externalId,
    folderId: item.folderId,
    metadata: item.metadata as any,
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
      initialFolder={folder.data} 
      initialFolders={allFolders.data || []} 
      initialItems={itemsWithThumbnails}
      completedPlaylists={completedSet}
    />
  )
}
