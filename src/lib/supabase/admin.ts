import { createClient } from '@supabase/supabase-js'

// Server-only admin client — bypasses RLS.
// Only use in server components / route handlers, never in client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
