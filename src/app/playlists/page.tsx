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

  const [{ data: playlists }, { data: folders }] = await Promise.all([
    db.from('Playlist').select('*').eq('userId', user.id).order('createdAt', { ascending: false }),
    db.from('Folder').select('*').eq('userId', user.id).order('title', { ascending: true }),
  ])

  return <PlaylistsPageClient initialPlaylists={playlists || []} initialFolders={folders || []} />
}
