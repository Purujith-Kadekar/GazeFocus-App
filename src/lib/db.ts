import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please set it in your .env file before starting the application.'
  )
}

if (!supabaseKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
    'Please set it in your .env file before starting the application.'
  )
}

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined
}

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

// NOTE: We use `as any` here because the generated Supabase Database type
// (from @/types/supabase) may not perfectly match every table/column at runtime,
// especially after schema migrations. A full type-safe refactor would require
// regenerating types after every schema change, which is a separate task.
export const db = _db as any

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = _db
