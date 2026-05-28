import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — avoids throwing at module-evaluation time (e.g. during Vercel build)
// when env vars aren't yet set. Will throw at call-time if still missing.
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    )
  }
  _client = createClient(url, key)
  return _client
}

// Named export kept for backwards compat with existing callers that do `import { supabase }`
// It is a Proxy so the real client is only created on first property access.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Admin client (server-only; uses service role key if available)
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
