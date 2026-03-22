import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('[DB] Initializing Supabase client:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseKey,
  url: supabaseUrl ? '***' + supabaseUrl.slice(-10) : null,
  env: process.env.NODE_ENV
})

if (!supabaseUrl || !supabaseKey) {
  console.error('[DB] Missing Supabase env vars!')
}

const _db =
  globalForSupabase.supabase ??
  createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    }
  )

export const db = _db as any

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = _db

export async function refreshSchema() {
  try {
    await (_db.rpc as any)('pg_catalog.reload_schema')
    console.log('[DB] Schema refreshed successfully')
  } catch (error) {
    console.error('[DB] Failed to refresh schema:', error)
  }
}
