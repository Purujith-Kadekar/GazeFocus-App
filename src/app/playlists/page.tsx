import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import PlaylistsPageClient from './PlaylistsPageClient'

export default async function PlaylistsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const [playlists, folders] = await Promise.all([
    db.playlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    db.folder.findMany({
      where: { userId: user.id },
      orderBy: { title: 'asc' },
    }),
  ])

  return <PlaylistsPageClient initialPlaylists={playlists} initialFolders={folders} />
}
