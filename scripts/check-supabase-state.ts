import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function diagnose() {
  const { data: user } = await supabase.from('User').select('id, email').eq('email', 'puru0kadek@gmail.com').maybeSingle()
  if (!user) {
    console.log('User not found')
    return
  }

  const { data: videos } = await supabase.from('Video').select('*').eq('userId', user.id)
  console.log('Check videos for user:', user.email)
  console.log(JSON.stringify(videos, null, 2))
}

diagnose()
