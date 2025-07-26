'use client'

import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { User, UserRole } from '@/lib/supabase/types'

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  role: UserRole | null
  loading: boolean
  signInWithPhone: (phone: string) => Promise<{ error: any }>
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Auth session error:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Session initialization error:', error)
        if (mounted) setLoading(false)
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setRole(null)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setUserProfile(null)
          setRole(null)
        }
      }
    )

    getInitialSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    console.log('🔍 AuthProvider: Loading user profile for ID:', userId)
    console.log('🔍 AuthProvider: Browser info:', {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      isChrome: typeof window !== 'undefined' ? window.navigator.userAgent.includes('Chrome') : false,
      isSafari: typeof window !== 'undefined' ? window.navigator.userAgent.includes('Safari') && !window.navigator.userAgent.includes('Chrome') : false
    })
    
    try {
      // Use shorter timeout for Chrome due to more aggressive connection handling
      const isChrome = typeof window !== 'undefined' && window.navigator.userAgent.includes('Chrome')
      const timeoutDuration = isChrome ? 5000 : 7000
      
      console.log(`🔍 AuthProvider: Using ${timeoutDuration}ms timeout for browser compatibility`)
      
      // Create a timeout wrapper that's browser-specific
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Database query timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration)
      })

      // Test basic Supabase connection first with timeout
      console.log('🔍 AuthProvider: Testing Supabase connection...')
      const connectionTest = await Promise.race([
        supabase.from('users').select('count', { count: 'exact' }).limit(0),
        timeoutPromise
      ])
      
      console.log('🔍 AuthProvider: Connection test result:', connectionTest)

      // Try to get existing user profile with timeout
      console.log('🔍 AuthProvider: Querying for user profile...')
      const profileQuery = await Promise.race([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        timeoutPromise
      ]) as { data: any, error: any }

      console.log('🔍 AuthProvider: User profile query result:', { 
        existingUser: profileQuery.data, 
        error: profileQuery.error,
        hasUser: !!profileQuery.data,
        userRole: profileQuery.data?.role 
      })

      if (profileQuery.data) {
        console.log('✅ AuthProvider: User profile found, setting state')
        setUserProfile(profileQuery.data)
        setRole(profileQuery.data.role)
        return
      }

      // If no profile exists, create one
      if (!profileQuery.data && !profileQuery.error) {
        console.log('🔄 AuthProvider: No profile found, creating new one')
        await createUserProfile(userId)
      } else if (profileQuery.error) {
        console.error('❌ AuthProvider: Database error:', profileQuery.error)
      }
    } catch (error: any) {
      console.error('❌ AuthProvider: Error loading user profile:', error)
      
      // If it's a timeout error, try multiple fallback strategies
      if (error.message?.includes('timeout')) {
        console.log('🔄 AuthProvider: Timeout detected, attempting fallback strategies')
        
        // Strategy 1: Try a simpler query with different approach
        try {
          console.log('🔄 AuthProvider: Attempting simplified profile query...')
          
          // For Chrome compatibility, try a more direct approach
          const { data: simpleProfile, error: simpleError } = await supabase
            .from('users')
            .select('id, role, name, phone_number, is_active, created_at, updated_at')
            .eq('id', userId)
            .maybeSingle()
          
          if (simpleProfile && !simpleError) {
            console.log('✅ AuthProvider: Simple query succeeded')
            setUserProfile(simpleProfile)
            setRole(simpleProfile.role)
            return
          }
          
          if (simpleError) {
            console.log('❌ AuthProvider: Simple query error:', simpleError)
          }
        } catch (simpleError) {
          console.log('❌ AuthProvider: Simple query exception:', simpleError)
        }
        
        // Strategy 2: Create new profile as fallback
        try {
          console.log('🔄 AuthProvider: Creating fallback user profile...')
          await createUserProfile(userId)
        } catch (fallbackError) {
          console.error('❌ AuthProvider: All fallback strategies failed:', fallbackError)
          // Let the error propagate - no hardcoded fallbacks for production
        }
      }
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      const newUser = {
        id: userId,
        phone_number: authUser?.phone || '',
        name: null,
        role: 'player' as const,
        is_active: true,
      }

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single()

      if (data) {
        setUserProfile(data)
        setRole(data.role)
      } else if (error) {
        console.error('Error creating user profile:', error)
      }
    } catch (error) {
      console.error('User profile creation failed:', error)
    }
  }

  const signInWithPhone = async (phone: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
          shouldCreateUser: true,
        },
      })
      
      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  const verifyOtp = async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      })
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      setUser(null)
      setUserProfile(null)
      setRole(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    userProfile,
    role,
    loading,
    signInWithPhone,
    verifyOtp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}