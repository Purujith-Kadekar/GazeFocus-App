import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helper'
import VideosPageClient from './VideosPageClient'

export default async function VideosPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const [videos, folders] = await Promise.all([
    db.video.findMany({
      where: { userId: user.id, playlistId: null },
      include: {
        playlist: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.folder.findMany({
      where: { userId: user.id },
      orderBy: { title: 'asc' },
    }),
  ])

  return <VideosPageClient initialVideos={videos} initialFolders={folders} />
}
