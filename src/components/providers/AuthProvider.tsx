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
  isSigningOut: boolean
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
  const [isSigningOut, setIsSigningOut] = useState(false)
  
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
          setIsSigningOut(false) // Reset signing out state
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
    
    // Detect deployment environment
    const isVercel = typeof window !== 'undefined' && (
      window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('vercel.live') ||
      process.env.VERCEL_ENV
    )
    const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')
    const isChrome = typeof window !== 'undefined' && window.navigator.userAgent.includes('Chrome')
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    )

    console.log('🔍 AuthProvider: Environment info:', {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      isChrome,
      isSafari: typeof window !== 'undefined' ? window.navigator.userAgent.includes('Safari') && !window.navigator.userAgent.includes('Chrome') : false,
      isVercel,
      isNetlify,
      isLocal,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
    })
    
    try {
      console.log('🔧 AuthProvider: Using HTTP-first approach for reliability')
      
      // Get environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      console.log('🔍 AuthProvider: Strategy - HTTP Direct → Supabase Client Fallback')

      // Strategy 1: Direct HTTP (Primary - Most Reliable)
      try {
        console.log('🚀 AuthProvider: Attempting HTTP direct query...')
        const startTime = performance.now()
        
        const userResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        const endTime = performance.now()
        const duration = Math.round(endTime - startTime)
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          console.log(`✅ AuthProvider: HTTP query SUCCESS in ${duration}ms`)
          
          if (userData && userData.length > 0) {
            console.log('✅ AuthProvider: User profile found via HTTP')
            const userProfile = userData[0]
            setUserProfile(userProfile)
            setRole(userProfile.role)
            return
          } else {
            console.log('🔄 AuthProvider: No existing user found via HTTP, creating new one...')
            await createUserProfileViaHTTP(userId)
            return
          }
        } else {
          console.log(`❌ AuthProvider: HTTP query failed with status ${userResponse.status} in ${duration}ms`)
        }
      } catch (httpError: any) {
        console.log('❌ AuthProvider: HTTP direct method failed:', httpError.message)
      }

      // Strategy 2: Supabase Client (Fallback)
      console.log('🔄 AuthProvider: HTTP method failed, trying Supabase client fallback...')
      try {
        const startTime = performance.now()
        
        const { data: userData, error } = await Promise.race([
          supabase.from('users').select('*').eq('id', userId).maybeSingle(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase client timeout')), 5000))
        ]) as { data: any, error: any }
        
        const endTime = performance.now()
        const duration = Math.round(endTime - startTime)
        
        if (userData && !error) {
          console.log(`✅ AuthProvider: Supabase client SUCCESS in ${duration}ms`)
          setUserProfile(userData)
          setRole(userData.role)
          return
        } else {
          console.log(`❌ AuthProvider: Supabase client failed in ${duration}ms:`, error?.message)
          
          if (!userData && !error) {
            console.log('🔄 AuthProvider: No existing user found via client, creating new one...')
            await createUserProfile(userId)
            return
          }
        }
      } catch (clientError: any) {
        console.log('❌ AuthProvider: Supabase client method failed:', clientError.message)
      }

    } catch (error: any) {
      console.error('❌ AuthProvider: Error in sequential testing:', error)
      
      // Final fallback: Try creating user profile
      try {
        console.log('🔄 AuthProvider: All tests failed, attempting user creation as final fallback...')
        await createUserProfile(userId)
      } catch (createError) {
        console.error('❌ AuthProvider: User creation also failed:', createError)
        console.log('🔄 AuthProvider: Setting loading to false to prevent infinite loading')
        setLoading(false)
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

  const createUserProfileViaHTTP = async (userId: string) => {
    try {
      console.log('🔧 AuthProvider: Creating user profile via HTTP for Chrome')
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      const newUser = {
        id: userId,
        phone_number: authUser?.phone || '',
        name: null,
        role: 'player' as const,
        is_active: true,
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      const response = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        const userData = await response.json()
        const createdUser = Array.isArray(userData) ? userData[0] : userData
        
        console.log('✅ AuthProvider: User profile created via HTTP')
        setUserProfile(createdUser)
        setRole(createdUser.role)
      } else {
        const errorData = await response.text()
        console.error('❌ AuthProvider: HTTP user creation failed:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ AuthProvider: HTTP user profile creation failed:', error)
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
      console.log('🔓 AuthProvider: Starting sign out process')
      
      // Set signing out state to prevent redirects during logout
      setIsSigningOut(true)
      
      // Try Supabase client first, then HTTP fallback
      try {
        console.log('🔓 AuthProvider: Attempting Supabase client sign out')
        const { error } = await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase signOut timeout')), 3000))
        ]) as { error: any }
        
        if (error) {
          console.log('❌ AuthProvider: Supabase client sign out error:', error.message)
          throw error
        }
        
        console.log('✅ AuthProvider: Supabase client sign out successful')
      } catch (clientError: any) {
        console.log('🔄 AuthProvider: Supabase client sign out failed, trying HTTP approach')
        
        // HTTP fallback - direct API call to sign out
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          
          const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            console.log('✅ AuthProvider: HTTP sign out successful')
          } else {
            console.log('❌ AuthProvider: HTTP sign out failed with status:', response.status)
          }
        } catch (httpError) {
          console.log('❌ AuthProvider: HTTP sign out also failed:', httpError)
          // Don't throw error - continue with manual state clearing
        }
      }

      // Manually clear state after logout attempts
      console.log('🔄 AuthProvider: Manually clearing authentication state')
      setUser(null)
      setUserProfile(null)
      setRole(null)
      setIsSigningOut(false)
      
      console.log('✅ AuthProvider: Sign out process completed')
    } catch (error) {
      console.error('❌ AuthProvider: Sign out error:', error)
      // Always clear state even if logout fails
      setUser(null)
      setUserProfile(null)
      setRole(null)
      setIsSigningOut(false)
    }
  }

  const value = {
    user,
    userProfile,
    role,
    loading,
    isSigningOut,
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