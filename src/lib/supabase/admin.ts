import { createClient } from '@supabase/supabase-js'

// Shared with src/lib/db.ts: bound queries so a stalled database fails fast
// instead of hanging until the OS TCP timeout.
const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS || 8000)

const timeoutFetch: typeof fetch = (input, init) => {
  return fetch(input, { ...init, signal: AbortSignal.timeout(DB_TIMEOUT_MS) })
}

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        global: {
            fetch: timeoutFetch,
        },
    }
)
