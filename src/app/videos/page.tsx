import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helper'
import { db } from '@/lib/db'
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
    db
      .from('Video')
      .select('*')
      .eq('userId', user.id)
      .is('playlistId', null)
      .is('channelId', null)
      .order('position', { ascending: true })
      .order('createdAt', { ascending: true }),
    db.from('Folder').select('*').eq('userId', user.id).order('title', { ascending: true }),
  ])

  return <VideosPageClient initialVideos={videos || []} initialFolders={folders || []} />
}
