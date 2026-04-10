import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function testLiveFetch() {
  const { data: channel } = await supabase.from('Channel').select('*').limit(1).maybeSingle()
  if (!channel) {
    console.log('No channels found')
    return
  }

  console.log(`Testing channel: ${channel.title} (youtubeId: ${channel.youtubeId})`)

  const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
  
  // Try to resolve ID first
  const handle = channel.youtubeId.startsWith('@') ? channel.youtubeId.substring(1) : channel.youtubeId
  console.log(`Resolving handle: ${handle}`)
  
  const handleResponse = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${handle}&key=${YOUTUBE_API_KEY}`
  )
  const handleData = await handleResponse.json()
  console.log('Handle Resolution:', JSON.stringify(handleData, null, 2))

  if (handleData.items && handleData.items.length > 0) {
    const resolvedId = handleData.items[0].id
    console.log(`Resolved ID: ${resolvedId}`)

    // Try a search for completed live events
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${resolvedId}&type=video&eventType=completed&maxResults=5&key=${YOUTUBE_API_KEY}`
    )
    const searchData = await searchResponse.json()
    console.log('Completed Streams search results:', searchData.items?.length || 0)
    if (searchData.error) console.error('Search ERROR:', searchData.error)
  } else {
    console.log('Could not resolve channel ID via handle.')
  }
}

testLiveFetch()
