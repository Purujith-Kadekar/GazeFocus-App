import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function diagnose() {
  const { data: user } = await supabase.from('User').select('id, email').eq('email', 'puru0kadek@gmail.com').maybeSingle()
  if (!user) return

  const { data: items } = await supabase.from('LibraryItem').select('*').eq('userId', user.id)
  console.log('--- Library Items for User ---')
  console.log(JSON.stringify(items, null, 2))

  const { data: videos } = await supabase.from('Video').select('*').eq('userId', user.id)
  console.log('--- Videos for User ---')
  console.log(JSON.stringify(videos, null, 2))
}

diagnose()
