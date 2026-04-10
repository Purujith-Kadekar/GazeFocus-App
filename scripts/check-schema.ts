import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkSchema() {
  console.log('--- Checking Supabase Table Structure ---')
  
  // Videos table
  const { data: videoData, error: videoError } = await supabase.from('Video').select('*').limit(1)
  if (videoError) {
    console.error('Error fetching Video:', videoError)
  } else {
    console.log('Video columns:', Object.keys(videoData[0] || {}))
  }

  // Channels table
  const { data: channelData, error: channelError } = await supabase.from('Channel').select('*').limit(1)
  if (channelError) {
    console.error('Error fetching Channel:', channelError)
  } else {
    console.log('Channel columns:', Object.keys(channelData[0] || {}))
  }

  // Check if VideoCache or similar exists
  const { error: cacheError } = await supabase.from('VideoCache').select('*').limit(1)
  if (cacheError) {
    console.log('VideoCache table does not exist or error:', cacheError.message)
  } else {
    console.log('VideoCache table exists!')
  }
}

checkSchema()
