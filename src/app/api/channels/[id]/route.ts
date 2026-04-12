import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helper'
import { createClient } from '@supabase/supabase-js'
import { deleteChannel, createLibraryItem } from '@/lib/channel-db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: channel, error } = await supabase
      .from('Channel')
      .select('id,userId,youtubeId,title,description,thumbnail,subscriberCount,videoCount,isLive,liveVideoId,liveTitle,createdAt,updatedAt')
      .eq('id', id)
      .eq('userId', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch channel', details: error.message }, { status: 500 })
    }

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    return NextResponse.json(channel)
  } catch (error: any) {
    console.error('Error fetching channel:', error)
    return NextResponse.json({ error: 'Failed to fetch channel', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: channel } = await supabase
      .from('Channel')
      .select('id')
      .eq('id', id)
      .eq('userId', user.id)
      .maybeSingle()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const { error } = await deleteChannel(id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete channel', details: error.message }, { status: 500 })
    }

    await supabase
      .from('LibraryItem')
      .delete()
      .eq('externalId', id)
      .eq('userId', user.id)
      .eq('type', 'CHANNEL')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting channel:', error)
    return NextResponse.json({ error: 'Failed to delete channel', details: error.message }, { status: 500 })
  }
}
