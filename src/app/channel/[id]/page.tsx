import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import ChannelDetailClient from './ChannelDetailClient'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default async function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { id } = await params

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: channel, error: channelError } = await supabase
    .from('Channel')
    .select('*')
    .eq('id', id)
    .eq('userId', user.id)
    .maybeSingle()
  
  if (!channel) {
    redirect('/channels')
  }

  const { data: videos } = await supabase
    .from('Video')
    .select('*')
    .eq('channelId', id)
    .eq('userId', user.id)
    .order('position', { ascending: true })
    .limit(50)

  return (
    <ChannelDetailClient 
      channel={channel}
      initialVideos={videos || []}
    />
  )
}
