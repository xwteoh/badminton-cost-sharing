'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
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
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔐 AuthProvider: Getting initial session...')
      
      try {
        // First check for real Supabase session
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('🔐 AuthProvider: Supabase session check', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error: error?.message 
        })
        
        if (session?.user) {
          console.log('🔐 AuthProvider: Found valid Supabase session, setting user')
          setUser(session.user)
          await fetchUserProfile(session.user.id)
          setLoading(false)
          return
        }
        
        // For development mode, check if we have a mock user stored (fallback)
        const isTestMode = process.env.NODE_ENV === 'development'
        if (isTestMode) {
          const mockUserData = localStorage.getItem('mock-user')
          if (mockUserData) {
            try {
              const mockUser = JSON.parse(mockUserData)
              console.log('🧪 Development mode: Restoring mock user from localStorage', mockUser)
              setUser(mockUser)
              await fetchUserProfile(mockUser.id)
              setLoading(false)
              return
            } catch (error) {
              console.error('Error parsing mock user data:', error)
              localStorage.removeItem('mock-user')
            }
          }
        }
        
        console.log('🔐 AuthProvider: No session found, user not authenticated')
        setLoading(false)
      } catch (error) {
        console.error('🔐 AuthProvider: Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change event:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userPhone: session?.user?.phone
        })
        
        if (event === 'SIGNED_OUT') {
          console.log('🔐 SIGNED_OUT event received, clearing all state')
          setUser(null)
          setUserProfile(null)
          setRole(null)
          localStorage.removeItem('mock-user')
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('🔐 User session found, setting user state')
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          console.log('🔐 No session found, clearing user state')
          setUser(null)
          setUserProfile(null)
          setRole(null)
          localStorage.removeItem('mock-user')
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // For Phase 1, we'll mock the user profile since the database tables don't exist yet
      // In Phase 2, we'll implement the actual database queries
      console.log('👤 Fetching user profile for:', userId)
      
      // Mock profile for development - in Phase 2 this will be real database query
      const mockProfile = {
        id: userId,
        phone_number: user?.phone || '',
        name: null,
        role: 'organizer' as const, // Default to organizer for testing
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      console.log('👤 Using mock profile:', mockProfile)
      setUserProfile(mockProfile)
      setRole(mockProfile.role)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Don't throw error, just set defaults
      setUserProfile(null)
      setRole('organizer') // Default role for Phase 1
    }
  }

  const signInWithPhone = async (phone: string) => {
    // For development testing, simulate successful OTP REQUEST (not sign-in)
    const isTestMode = process.env.NODE_ENV === 'development'
    const testNumbers = ['+6581234567', '+6591234567', '+6598765432']
    
    if (isTestMode && testNumbers.includes(phone)) {
      // Just simulate that OTP was sent, don't actually sign in yet
      console.log('🧪 Development mode: Simulating OTP request for', phone)
      return { data: null, error: null }
    }
    
    return await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
        shouldCreateUser: true,
      },
    })
  }

  const verifyOtp = async (phone: string, token: string) => {
    // For development testing with test numbers
    const isTestMode = process.env.NODE_ENV === 'development'
    const testNumbers = ['+6581234567', '+6591234567', '+6598765432']
    
    if (isTestMode && testNumbers.includes(phone)) {
      // Accept any 6-digit code for test numbers
      if (token.length === 6 && /^\d{6}$/.test(token)) {
        console.log('🧪 Development mode: Accepting test OTP', token)
        
        // Create a mock user and session for development
        const mockUser = {
          id: 'test-user-' + phone.replace(/\D/g, ''),
          phone: phone,
          email: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        const mockSession = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          user: mockUser,
        }
        
        // Store mock user in localStorage for persistence
        localStorage.setItem('mock-user', JSON.stringify(mockUser))
        
        // Manually trigger auth state change
        setUser(mockUser as any)
        await fetchUserProfile(mockUser.id)
        
        return { data: { user: mockUser, session: mockSession }, error: null }
      } else {
        return { data: null, error: { message: 'Invalid OTP format' } }
      }
    }
    
    return await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
  }

  const signOut = async () => {
    try {
      console.log('🔓 Signing out user', { userId: user?.id, phone: user?.phone })
      
      // Check if this is a mock user BEFORE clearing state
      const isTestMode = process.env.NODE_ENV === 'development'
      const isMockUser = user?.id?.startsWith('test-user-')
      
      if (isTestMode && isMockUser) {
        console.log('🧪 Development mode: Clearing mock user session')
        localStorage.removeItem('mock-user')
      } else {
        console.log('🔓 Real Supabase user: calling supabase.auth.signOut()')
        
        // For real Supabase users, force sign out with scope 'global' to clear all sessions
        const { error } = await supabase.auth.signOut({ scope: 'global' })
        if (error) {
          console.error('🔓 Supabase signOut error:', error)
        } else {
          console.log('🔓 Supabase sign out completed successfully')
        }
        
        // Verify the session is actually cleared
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔓 Session check after signOut:', { hasSession: !!session })
        
        if (session) {
          console.warn('🔓 Warning: Session still exists after signOut, forcing clear')
          // Force clear browser storage
          localStorage.clear()
          sessionStorage.clear()
        }
      }
      
      // Clear local state
      setUser(null)
      setUserProfile(null)
      setRole(null)
      localStorage.removeItem('mock-user')
      
      console.log('🔓 Local state cleared')
    } catch (error) {
      console.error('Sign out error:', error)
      // Force clear everything on error
      setUser(null)
      setUserProfile(null)
      setRole(null)
      localStorage.clear()
      sessionStorage.clear()
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