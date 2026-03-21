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

  const [{ data: videos }, { data: folders }] = await Promise.all([
    db.from('Video').select('*, playlist(*)').eq('userId', user.id).is('playlistId', null).order('createdAt', { ascending: false }),
    db.from('Folder').select('*').eq('userId', user.id).order('title', { ascending: true }),
  ])

  return <VideosPageClient initialVideos={videos || []} initialFolders={folders || []} />
}
