import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

const _db =
  globalForSupabase.supabase ??
  createClient<Database>(
    supabaseUrl,
    supabaseKey,
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
  } catch (error) {
    // Silent fail
  }
}
