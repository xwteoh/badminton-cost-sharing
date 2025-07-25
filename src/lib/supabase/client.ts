import { createClient } from '@supabase/supabase-js'

import type { Database } from './types'

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
  
  // Detect if running on Vercel
  const isVercel = process.env.VERCEL_ENV || process.env.VERCEL_URL
  
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'badminton-app@1.0.0',
        // Vercel-specific headers for better connectivity
        ...(isVercel && {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'x-vercel-deployment': process.env.VERCEL_ENV || 'unknown',
        }),
      },
    },
    realtime: {
      timeout: isVercel ? 3000 : 10000, // Much shorter timeout for Vercel
    },
  })
  
  return supabaseInstance
}

// Export a singleton instance for convenience
export const supabase = createClientSupabaseClient()