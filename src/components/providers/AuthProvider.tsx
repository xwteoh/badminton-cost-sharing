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
      // Sequential Query Testing with Detailed Logging
      console.log('🧪 AuthProvider: Starting sequential query debugging...')
      
      // Helper function for detailed timing
      const testQuery = async (testName: string, queryPromise: Promise<any> | PromiseLike<any>, timeoutMs: number = 5000) => {
        const startTime = performance.now()
        console.log(`🧪 Test ${testName}: Starting...`)
        
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${testName} timeout after ${timeoutMs}ms`)), timeoutMs)
          })
          
          const result = await Promise.race([queryPromise, timeoutPromise])
          const endTime = performance.now()
          const duration = Math.round(endTime - startTime)
          
          console.log(`✅ Test ${testName}: SUCCESS in ${duration}ms`, { result })
          return { success: true, result, duration, error: null }
        } catch (error: any) {
          const endTime = performance.now()
          const duration = Math.round(endTime - startTime)
          
          console.error(`❌ Test ${testName}: FAILED in ${duration}ms`, { 
            error: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            fullError: error
          })
          return { success: false, result: null, duration, error }
        }
      }

      // Test 1: Minimal connectivity test
      const test1 = await testQuery(
        'Minimal-Connection', 
        supabase.from('users').select('id').limit(1).then(result => result),
        3000
      )

      // Test 2: Count query (no data transfer)  
      const test2 = await testQuery(
        'Count-Query',
        supabase.from('users').select('*', { count: 'exact' }).limit(0).then(result => result),
        3000
      )

      // Test 3: Your specific user query
      const test3 = await testQuery(
        'Specific-User-Query',
        supabase.from('users').select('*').eq('id', userId).maybeSingle().then(result => result),
        5000
      )

      // Test 4: Different table test (if players table exists)
      const test4 = await testQuery(
        'Different-Table',
        supabase.from('players').select('id').limit(1).then(result => result),
        3000
      )

      // Test 5: Fresh client test
      console.log('🧪 Test Fresh-Client: Creating new Supabase client...')
      const freshClient = createClientSupabaseClient()
      const test5 = await testQuery(
        'Fresh-Client',
        freshClient.from('users').select('id, role, name').eq('id', userId).maybeSingle().then(result => result),
        5000
      )

      // Test 6: Direct HTTP fetch test (to isolate browser-specific network issues)
      const test6 = await testQuery(
        'Direct-HTTP-Fetch',
        fetch(`https://krackqotjvlhcagfwxft.supabase.co/rest/v1/users?select=id&limit=1`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYWNrcW90anZsaGNhZ2Z3eGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzODY1NTksImV4cCI6MjA2Nzk2MjU1OX0.h3cSprGtnPEP7OxuLKBD_QyHeD0l1PZRfGZchpPR74k',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYWNrcW90anZsaGNhZ2Z3eGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzODY1NTksImV4cCI6MjA2Nzk2MjU1OX0.h3cSprGtnPEP7OxuLKBD_QyHeD0l1PZRfGZchpPR74k`,
            'Content-Type': 'application/json'
          }
        }).then(response => response.json()),
        3000
      )

      // Test 7: DNS resolution test
      const test7 = await testQuery(
        'DNS-Resolution',
        fetch('https://krackqotjvlhcagfwxft.supabase.co/', { 
          method: 'HEAD',
          mode: 'no-cors' 
        }).then(response => ({ status: response.status, type: response.type })),
        2000
      )

      console.log('📊 AuthProvider: Test Results Summary:', {
        'Minimal-Connection': test1.success ? `✅ ${test1.duration}ms` : `❌ ${test1.duration}ms`,
        'Count-Query': test2.success ? `✅ ${test2.duration}ms` : `❌ ${test2.duration}ms`, 
        'Specific-User-Query': test3.success ? `✅ ${test3.duration}ms` : `❌ ${test3.duration}ms`,
        'Different-Table': test4.success ? `✅ ${test4.duration}ms` : `❌ ${test4.duration}ms`,
        'Fresh-Client': test5.success ? `✅ ${test5.duration}ms` : `❌ ${test5.duration}ms`,
        'Direct-HTTP-Fetch': test6.success ? `✅ ${test6.duration}ms` : `❌ ${test6.duration}ms`,
        'DNS-Resolution': test7.success ? `✅ ${test7.duration}ms` : `❌ ${test7.duration}ms`
      })

      console.log('🔍 AuthProvider: Browser-specific analysis:', {
        isChrome,
        isNetlify,
        supabaseClientTimeout: test1.duration,
        directHttpTimeout: test6.duration,
        dnsResolutionTimeout: test7.duration,
        possibleCause: test6.success && !test1.success ? 'Supabase JS Client Issue' :
                      test7.success && !test6.success ? 'API Authentication Issue' :
                      !test7.success ? 'DNS/Network Routing Issue' : 'Unknown'
      })

      // Use successful result if any test succeeded
      if (test3.success && test3.result.data) {
        console.log('✅ AuthProvider: Using Specific-User-Query result')
        setUserProfile(test3.result.data)
        setRole(test3.result.data.role)
        return
      }
      
      if (test5.success && test5.result.data) {
        console.log('✅ AuthProvider: Using Fresh-Client result')  
        setUserProfile(test5.result.data)
        setRole(test5.result.data.role)
        return
      }

      // If no profile found, try creating one
      console.log('🔄 AuthProvider: No existing profile found, creating new one...')
      await createUserProfile(userId)

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