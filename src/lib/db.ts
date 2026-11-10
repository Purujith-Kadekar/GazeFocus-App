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

// Every query used to ride the default undici fetch, which has no timeout:
// a stalled database (network partition, cold start, rate limit) hung each
// request until the OS-level TCP timeout fired (~15s+). Route handlers now
// fail fast instead — DB_TIMEOUT_MS bounds every query.
const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS || 8000)

const timeoutFetch: typeof fetch = (input, init) => {
  return fetch(input, { ...init, signal: AbortSignal.timeout(DB_TIMEOUT_MS) })
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
      global: {
        fetch: timeoutFetch,
      },
    }
  )

// NOTE: We use `as any` here because the generated Supabase Database type
// (from @/types/supabase) may not perfectly match every table/column at runtime,
// especially after schema migrations. A full type-safe refactor would require
// regenerating types after every schema change, which is a separate task.
export const db = _db as any

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = _db
