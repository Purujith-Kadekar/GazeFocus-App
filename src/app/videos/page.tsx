import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import VideosPageClient from './VideosPageClient'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default async function VideosPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const [{ data: libraryItems }, { data: folders }] = await Promise.all([
    supabase
      .from('LibraryItem')
      .select('*, video:Video!Video_youtubeId_userId_fkey(*)')
      .eq('userId', user.id)
      .eq('type', 'VIDEO')
      .order('createdAt', { ascending: false }),
    supabase.from('Folder').select('*').eq('userId', user.id).order('title', { ascending: true }),
  ])

  const videos = libraryItems?.map(item => item.video).filter(Boolean) || []

  return <VideosPageClient initialVideos={videos || []} initialFolders={folders || []} />
}
