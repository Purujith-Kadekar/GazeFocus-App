import { QuotaEngine } from '../src/lib/youtube/quota-engine'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

async function runVerification() {
  console.log('--- YouTube Cache Engine Verification ---')
  
  const testChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw' // Google Developers
  const testVideoId = 'dQw4w9WgXcQ' // Never Gonna Give You Up

  try {
    // 1. Test getChannel (Should fetch and cache)
    console.log('\n1. Testing getChannel...')
    const channel = await QuotaEngine.getChannel(testChannelId)
    console.log('Channel Result:', channel?.title, '| Uploads Playlist:', channel?.uploadsPlaylistId)

    // 2. Test getRecentVideos (UU Hack)
    console.log('\n2. Testing getRecentVideos (UU Hack)...')
    const recent = await QuotaEngine.getRecentVideos(testChannelId, 5)
    console.log(`Fetched ${recent.items.length} recent videos.`)
    recent.items.slice(0, 2).forEach(v => console.log(`- ${v.title} (${v.youtubeId})`))

    // 3. Test getVideo (Should fetch and cache)
    console.log('\n3. Testing getVideo...')
    const video = await QuotaEngine.getVideo(testVideoId)
    console.log('Video Result:', video?.title)

    // 4. Test RSS (0 units)
    console.log('\n4. Testing RSS Fetch...')
    const rssIds = await QuotaEngine.getRSSVideos(testChannelId)
    console.log(`Fetched ${rssIds.length} IDs via RSS.`)
    console.log('Recent RSS ID:', rssIds[0])

    console.log('\n--- Verification Complete ---')
  } catch (error) {
    console.error('Verification failed:', error)
  }
}

runVerification()
