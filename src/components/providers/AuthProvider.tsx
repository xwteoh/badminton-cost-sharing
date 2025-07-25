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
    try {
      // Try to get existing user profile
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (existingUser) {
        setUserProfile(existingUser)
        setRole(existingUser.role)
        return
      }

      // If no profile exists, create one
      if (!existingUser && !error) {
        await createUserProfile(userId)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Don't create profile if there's a database error
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