import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function createChannel(data: {
  userId: string
  youtubeId: string
  title: string
  description?: string
  thumbnail?: string
  subscriberCount?: string
  videoCount?: string
}) {
  const channelId = crypto.randomUUID()
  const now = new Date().toISOString()

  const { data: channel, error } = await supabase
    .from('Channel')
    .insert({
      id: channelId,
      userId: data.userId,
      youtubeId: data.youtubeId,
      title: data.title,
      description: data.description || null,
      thumbnail: data.thumbnail || null,
      subscriberCount: data.subscriberCount || null,
      videoCount: data.videoCount || null,
      isLive: false,
      liveVideoId: null,
      liveTitle: null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single()

  return { channel, error }
}

export async function getChannelsByUser(userId: string) {
  const { data, error } = await supabase
    .from('Channel')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })

  return { channels: data, error }
}

export async function getChannelById(channelId: string) {
  const { data, error } = await supabase
    .from('Channel')
    .select('*')
    .eq('id', channelId)
    .single()

  return { channel: data, error }
}

export async function deleteChannel(channelId: string) {
  const { error } = await supabase
    .from('Channel')
    .delete()
    .eq('id', channelId)

  return { error }
}

export async function updateChannelLiveStatus(
  channelId: string,
  isLive: boolean,
  liveVideoId?: string | null,
  liveTitle?: string | null
) {
  const { data, error } = await supabase
    .from('Channel')
    .update({
      isLive,
      liveVideoId: liveVideoId || null,
      liveTitle: liveTitle || null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', channelId)
    .select()
    .single()

  return { channel: data, error }
}

export async function createLibraryItem(data: {
  userId: string
  externalId: string
  type: 'CHANNEL'
  title: string
  folderId?: string | null
}) {
  const itemId = crypto.randomUUID()
  const now = new Date().toISOString()

  const { data: item, error } = await supabase
    .from('LibraryItem')
    .insert({
      id: itemId,
      userId: data.userId,
      externalId: data.externalId,
      type: data.type,
      title: data.title,
      folderId: data.folderId || null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single()

  return { item, error }
}

export async function checkChannelExists(youtubeId: string, userId: string) {
  const { data, error } = await supabase
    .from('Channel')
    .select('id')
    .eq('youtubeId', youtubeId)
    .eq('userId', userId)
    .maybeSingle()

  return { exists: !!data, error }
}
