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
    // Get initial session with faster response
    const getInitialSession = async () => {
      console.log('🔐 AuthProvider: Getting initial session...')
      
      try {
        // Add timeout to prevent hanging - increased to 10 seconds for better reliability
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        })
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        console.log('🔐 AuthProvider: Supabase session check', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error: error?.message 
        })
        
        if (session?.user) {
          console.log('🔐 AuthProvider: Found valid Supabase session, setting user')
          setUser(session.user)
          
          // Don't set a default role immediately - wait for database lookup
          // This prevents wrong redirects
          console.log('🔐 AuthProvider: Fetching user profile to determine role')
          
          try {
            // Add timeout to fetchUserProfile to prevent hanging - reduced to 3 seconds
            const profileTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            })
            
            await Promise.race([
              fetchUserProfile(session.user.id),
              profileTimeout
            ])
          } catch (error) {
            console.error('🔐 AuthProvider: Error fetching profile on initial load:', error)
            // Provide immediate fallback profile
            await provideFallbackProfile(session.user.id)
          }
          
          setLoading(false)
          return
        }
        
        console.log('🔐 AuthProvider: No session found, user not authenticated')
        setLoading(false)
      } catch (error) {
        console.error('🔐 AuthProvider: Error getting initial session:', error)
        
        // If it's a timeout, try once more without timeout as a fallback
        if (error instanceof Error && error.message === 'Session check timeout') {
          console.warn('🔐 AuthProvider: Session check timed out, trying once more without timeout...')
          try {
            const { data: { session }, error: fallbackError } = await supabase.auth.getSession()
            if (session?.user && !fallbackError) {
              console.log('🔐 AuthProvider: Fallback session check succeeded')
              setUser(session.user)
              try {
                // Add timeout to prevent hanging
                const profileTimeout = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
                })
                
                await Promise.race([
                  fetchUserProfile(session.user.id),
                  profileTimeout
                ])
              } catch (profileError) {
                console.error('🔐 AuthProvider: Error fetching profile on fallback:', profileError)
                await provideFallbackProfile(session.user.id)
              }
            }
          } catch (fallbackError) {
            console.error('🔐 AuthProvider: Fallback session check also failed:', fallbackError)
          }
        }
        
        setLoading(false)
      }
    }

    getInitialSession()
    
    // Failsafe: Force loading to false after 8 seconds - even more time for slow connections
    const failsafe = setTimeout(() => {
      console.warn('🔐 AuthProvider: Loading timeout, forcing completion')
      setLoading(false)
    }, 8000)

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
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('🔐 User session found, setting user state')
          setUser(session.user)
          
          // Always fetch profile to ensure we have the latest data
          // This prevents race conditions during initial login
          try {
            // Add timeout to prevent hanging
            const profileTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            })
            
            await Promise.race([
              fetchUserProfile(session.user.id),
              profileTimeout
            ])
          } catch (error) {
            console.error('🔐 Auth state change: fetchUserProfile failed:', {
              error,
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            })
            // Provide immediate fallback profile
            await provideFallbackProfile(session.user.id)
          }
          setLoading(false)
        } else {
          console.log('🔐 No session found, clearing user state')
          setUser(null)
          setUserProfile(null)
          setRole(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(failsafe)
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('👤 Fetching user profile for:', userId)
    
    // Compare with current auth user
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser()
    console.log('👤 Auth user comparison:', {
      searchingFor: userId,
      currentAuthUser: currentAuthUser?.id,
      idsMatch: currentAuthUser?.id === userId,
      currentAuthPhone: currentAuthUser?.phone
    })
    
    try {
      // First, test basic Supabase connectivity with a simple query
      console.log('🔍 Testing Supabase connection with simple query...')
      
      try {
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, role')
          .limit(5)
        
        console.log('🔍 Sample users query result:', { 
          userCount: allUsers?.length,
          users: allUsers,
          allUsersError,
          canConnect: !allUsersError
        })
        
        if (allUsersError) {
          console.error('❌ Basic users query failed:', allUsersError)
          throw new Error(`Database query failed: ${allUsersError.message}`)
        }
      } catch (connectionError) {
        console.error('❌ Supabase connection test failed:', connectionError)
        throw new Error(`Database connection failed: ${connectionError}`)
      }
      
      // Add retry logic with exponential backoff for better reliability
      let attempts = 0
      const maxAttempts = 3
      let lastError = null
      
      while (attempts < maxAttempts) {
        attempts++
        console.log(`👤 Database query attempt ${attempts} for user:`, userId)
        
        try {
          // Query real user profile from database with longer timeout
          console.log('👤 Executing query: SELECT * FROM users WHERE id =', userId)
          console.log('👤 Raw query params:', { userId, userIdType: typeof userId, userIdLength: userId.length })
          
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle() // Use maybeSingle to avoid PGRST116 errors
          
          console.log('👤 Database query result:', { 
            userProfile, 
            error, 
            userId, 
            attempt: attempts,
            hasData: !!userProfile,
            errorCode: error?.code,
            errorMessage: error?.message,
            errorDetails: error?.details,
            errorHint: error?.hint
          })

          // Additional debugging - try a count query to see if user exists
          if (!userProfile && !error) {
            console.log('👤 No data returned, testing if user exists...')
            const { count, error: countError } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('id', userId)
            
            console.log('👤 User existence check:', { count, countError })
          }
          
          if (userProfile) {
            console.log('👤 Found existing user profile:', userProfile)
            console.log('👤 Setting role to:', userProfile.role)
            setUserProfile(userProfile)
            setRole(userProfile.role)
            return
          }
          
          // Handle no profile found cases
          if (error?.code === 'PGRST116' || (!userProfile && !error)) {
            const reason = error?.code === 'PGRST116' ? 'PGRST116 - No rows returned' : 'No data and no error'
            console.log(`👤 ${reason}, trying alternative lookup methods`)
            
            // First, try to find user by phone number as a fallback
            try {
              const { data: { user: authUser } } = await supabase.auth.getUser()
              if (authUser?.phone) {
                console.log('👤 Trying to find user by phone:', authUser.phone)
                const { data: userByPhone, error: phoneError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('phone_number', authUser.phone)
                  .maybeSingle()
                
                console.log('👤 User lookup by phone result:', { userByPhone, phoneError })
                
                if (userByPhone) {
                  console.log('👤 Found user by phone! Setting profile:', userByPhone)
                  setUserProfile(userByPhone)
                  setRole(userByPhone.role)
                  return
                }
              }
            } catch (phoneError) {
              console.log('👤 Phone lookup failed:', phoneError)
            }
            
            // If phone lookup also fails, try creating new profile
            console.log(`👤 No existing user found, creating new user profile`)
            try {
              await createUserProfile(userId)
              return // Successfully created profile
            } catch (createError) {
              console.error('❌ Failed to create user profile:', createError)
              // Continue with retry logic or fallback
            }
          }
          
          // Store error for potential retry
          lastError = error
          
          // If it's a transient error, retry
          if (error?.message?.includes('timeout') || error?.message?.includes('network') || attempts < maxAttempts) {
            const delay = Math.pow(2, attempts - 1) * 1000 // Exponential backoff: 1s, 2s, 4s
            console.log(`👤 Retrying database query in ${delay}ms due to error:`, error?.message)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          
          // Non-retryable error
          break
          
        } catch (queryError) {
          lastError = queryError
          if (attempts < maxAttempts) {
            const delay = Math.pow(2, attempts - 1) * 1000
            console.log(`👤 Query exception, retrying in ${delay}ms:`, queryError)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          break
        }
      }
      
      // All attempts failed
      console.error('👤 All database query attempts failed:', {
        lastError,
        attempts,
        userId
      })
      
      // Try to create profile anyway
      console.log('👤 Attempting to create user profile due to persistent errors')
      try {
        await createUserProfile(userId)
        return
      } catch (createError) {
        console.error('❌ Profile creation also failed, using immediate fallback')
        // Force immediate fallback if everything fails
        await provideFallbackProfile(userId)
        return
      }
      
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error && typeof error === 'object' ? (error as any).code : undefined,
        details: error && typeof error === 'object' ? (error as any).details : undefined,
        userId
      })
      
      // Always provide a fallback profile with player role for security
      await provideFallbackProfile(userId)
    }
  }

  const provideFallbackProfile = async (userId: string) => {
    console.log('🔄 Providing immediate fallback profile for user:', userId)
    
    // Get phone from current auth session
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    // Try one more direct query attempt before falling back
    try {
      console.log('🔄 Last attempt: Direct query for user profile')
      const { data: directUser, error: directError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single to avoid PGRST116 error
      
      console.log('🔄 Direct query result:', { directUser, directError })
      
      if (directUser) {
        console.log('✅ Direct query succeeded! Setting profile:', directUser)
        setUserProfile(directUser)
        setRole(directUser.role)
        return
      }
      
      // If still no user, try phone lookup
      if (authUser?.phone) {
        console.log('🔄 Trying phone lookup as final attempt:', authUser.phone)
        const { data: phoneUser, error: phoneError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', authUser.phone)
          .maybeSingle()
        
        console.log('🔄 Phone lookup result:', { phoneUser, phoneError })
        
        if (phoneUser) {
          console.log('✅ Phone lookup succeeded! Setting profile:', phoneUser)
          setUserProfile(phoneUser)
          setRole(phoneUser.role)
          return
        }
      }
    } catch (error) {
      console.error('🔄 Direct query attempts failed:', error)
    }
    
    // Final fallback: Create client-side profile with player role
    const fallbackProfile = {
      id: userId,
      phone_number: authUser?.phone || user?.phone || '',
      name: null,
      role: 'player' as 'player',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    setUserProfile(fallbackProfile)
    setRole('player')
    console.log('✅ Final fallback profile set (player role):', fallbackProfile)
  }

  const createUserProfile = async (userId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession()
      const userPhone = session.session?.user?.phone || ''
      
      // Check if this phone number already exists in the users table
      console.log('👤 Checking if user already exists with phone:', userPhone)
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', userPhone)
        .single()
      
      if (existingUser) {
        console.log('👤 Found existing user with same phone:', existingUser)
        setUserProfile(existingUser)
        setRole(existingUser.role)
        return
      }
      
      // Default new users to 'player' role for security
      // Only promote to organizer manually in database when needed
      const userRole = 'player'
      
      console.log('👤 Creating user profile with player role:', { userPhone, userRole })
      
      const newUserProfile = {
        id: userId,
        phone_number: userPhone,
        name: null,
        role: userRole,
        is_active: true,
      }
      
      console.log('👤 Creating new user profile:', newUserProfile)
      
      // First, check current authentication status
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log('👤 Auth user before insert:', { 
        authUserId: authUser?.id, 
        targetUserId: userId,
        idsMatch: authUser?.id === userId 
      })
      
      const { data, error } = await supabase
        .from('users')
        .insert([newUserProfile])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating user profile:', {
          error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          possibleCauses: {
            rls_policy_blocking: error.code === '42501' || error.message?.includes('policy'),
            auth_required: error.code === '401' || error.message?.includes('JWT'),
            constraint_violation: error.code === '23505',
            missing_permissions: error.message?.includes('permission')
          }
        })
        
        // Handle different error types
        if (error.code === '23505') { // Unique constraint violation
          console.log('👤 User already exists, trying to fetch existing profile')
          const { data: fetchedUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (fetchedUser) {
            console.log('👤 Found existing user profile:', fetchedUser)
            setUserProfile(fetchedUser)
            setRole(fetchedUser.role)
            return
          }
        }
        
        // Handle RLS policy issues
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.warn('🔒 RLS policy blocking user creation, using fallback profile')
          // Create fallback profile with player role for security
          const fallbackProfile = {
            id: userId,
            phone_number: userPhone,
            name: null,
            role: 'player' as 'player',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          setUserProfile(fallbackProfile)
          setRole('player')
          console.log('👤 Using RLS fallback player profile')
          return
        }
        
        throw error
      }
      
      console.log('✅ User profile created successfully:', data)
      setUserProfile(data)
      setRole(data.role)
    } catch (error) {
      console.error('❌ Error creating user profile:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error && typeof error === 'object' ? (error as any).code : undefined,
        details: error && typeof error === 'object' ? (error as any).details : undefined,
        userId
      })
      
      // Fallback: create a client-side profile for this session with player role for security
      const fallbackProfile = {
        id: userId,
        phone_number: user?.phone || '',
        name: null,
        role: 'player' as 'player',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUserProfile(fallbackProfile)
      setRole('player')
      console.log('👤 Using fallback player profile after creation failed')
      // Don't throw error here - let the app continue with fallback profile
    }
  }

  const signInWithPhone = async (phone: string) => {
    console.log('📱 Requesting OTP for phone:', phone)
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
          shouldCreateUser: true,
        },
      })
      
      if (error) {
        console.error('❌ Error requesting OTP:', error)
        return { error }
      }
      
      console.log('✅ OTP request successful')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Exception requesting OTP:', error)
      return { error }
    }
  }

  const verifyOtp = async (phone: string, token: string) => {
    console.log('🔐 Verifying OTP for phone:', phone)
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      })
      
      if (error) {
        console.error('❌ Error verifying OTP:', error)
        return { data: null, error }
      }
      
      if (data.user) {
        console.log('✅ OTP verification successful, user logged in:', data.user.id)
        // The onAuthStateChange will handle updating the user state
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('❌ Exception verifying OTP:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('🔓 Signing out user', { userId: user?.id, phone: user?.phone })
      
      // Clear local state first
      setUser(null)
      setUserProfile(null)
      setRole(null)
      
      // Sign out from Supabase with global scope to clear all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) {
        console.error('🔓 Supabase signOut error:', error)
      } else {
        console.log('🔓 Supabase sign out completed successfully')
      }
      
      // Force clear all browser storage related to authentication
      try {
        if (typeof window !== 'undefined') {
          // Clear localStorage items that might contain session data
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.startsWith('supabase.auth.token') || key.startsWith('sb-'))) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key))
          
          // Clear sessionStorage as well
          const sessionKeysToRemove = []
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key && (key.startsWith('supabase.auth.token') || key.startsWith('sb-'))) {
              sessionKeysToRemove.push(key)
            }
          }
          sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
          
          console.log('🔓 Browser storage cleared')
        }
      } catch (storageError) {
        console.error('🔓 Error clearing browser storage:', storageError)
      }
      
      console.log('🔓 Complete sign out process finished')
    } catch (error) {
      console.error('Sign out error:', error)
      // Force clear everything on error
      setUser(null)
      setUserProfile(null)
      setRole(null)
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