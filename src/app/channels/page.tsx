import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import ChannelsPageClient from './ChannelsPageClient'
import type { ChannelWithFolder } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default async function ChannelsPage() {
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

  const [{ data: channels }, { data: folders }, { data: libraryItems }] = await Promise.all([
    supabase.from('Channel').select('*').eq('userId', user.id).order('createdAt', { ascending: false }),
    supabase.from('Folder').select('*').eq('userId', user.id).order('title', { ascending: true }),
    supabase.from('LibraryItem').select('externalId, folderId').eq('userId', user.id).eq('type', 'CHANNEL'),
  ])

  const folderMap = new Map((libraryItems || []).map((item: any) => [item.externalId, item.folderId]))
  const channelsWithFolder: ChannelWithFolder[] = (channels || []).map(c => ({
    ...c,
    folderId: folderMap.get(c.id) || null,
  }))

  return <ChannelsPageClient initialChannels={channelsWithFolder} initialFolders={folders || []} />
}
