import { createClient } from '@supabase/supabase-js'

import type { Database } from './types'

// Get environment variables directly (validation happens in createClientSupabaseClient)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton instance to prevent multiple clients
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export function createClientSupabaseClient(): ReturnType<typeof createClient<Database>> {
  // Validate environment variables at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'See .env.example for the complete list of environment variables.'
    )
  }

  // Always return the same instance to prevent multiple GoTrueClient warnings
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })
  
  return supabaseInstance
}

// Export a singleton instance for convenience
export const supabase = createClientSupabaseClient()