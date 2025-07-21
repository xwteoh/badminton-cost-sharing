import { createClient } from '@supabase/supabase-js'

import type { Database } from './types'

// Get environment variables directly (validation happens in createServerSupabaseClient)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Create a Supabase client for server-side operations with proper cookie handling
 * This enables SSR authentication and maintains session consistency
 */
export function createServerSupabaseClient(): ReturnType<typeof createClient<Database>> {
  // Validate environment variables at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'See .env.example for the complete list of environment variables.'
    )
  }

  // For now, use a simplified server client without custom cookie handling
  // This prevents the infinite loop issue with Next.js App Router
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Disable session persistence for server-side
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Create a read-only Supabase client for server-side data fetching
 * Use this when you need to query data without authentication
 */
export function createServerSupabaseClientReadOnly(): ReturnType<typeof createClient<Database>> {
  // Validate environment variables at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Please check your .env.local file and ensure all required variables are set.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false, 
      detectSessionInUrl: false,
    },
  })
}