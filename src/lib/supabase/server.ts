import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createServerSupabaseClient() {
  // For Phase 1, we'll use a simplified server client
  // In later phases, we can add proper SSR cookie handling
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server-side doesn't persist sessions
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}