'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

export default function HomePage() {
  const router = useRouter()
  const { user, loading, role } = useAuth()
  const [showFallback, setShowFallback] = useState(false)
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false)

  useEffect(() => {
    console.log('🏠 Root page render:', { 
      loading, 
      hasUser: !!user, 
      userId: user?.id,
      role,
      userPhone: user?.phone,
      hasAttemptedRedirect
    })
  })

  // Auto-redirect logic
  useEffect(() => {
    if (loading || hasAttemptedRedirect) {
      return
    }

    if (user && role) {
      console.log('🏠 Root page: User authenticated, attempting auto-redirect to dashboard')
      setHasAttemptedRedirect(true)
      // Use window.location for reliable redirect
      window.location.href = '/dashboard'
      return
    }

    if (!loading && !user) {
      console.log('🏠 Root page: No user, attempting auto-redirect to login')
      setHasAttemptedRedirect(true)
      window.location.href = '/login'
      return
    }
  }, [user, loading, role, hasAttemptedRedirect])

  // Show fallback buttons after 2 seconds if redirect didn't work
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      console.log('🏠 Root page: Showing fallback options')
      setShowFallback(true)
    }, 2000)

    return () => clearTimeout(fallbackTimeout)
  }, [])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-md">
        {/* App Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <span className="text-3xl">🏸</span>
        </div>
        
        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        
        {/* App Name */}
        <h1 className="text-xl font-semibold text-foreground">
          Badminton Cost Tracker
        </h1>
        
        <p className="text-sm text-muted-foreground">
          {showFallback ? 'Choose where to go:' : 'Loading...'}
        </p>

        {/* Debug info */}
        {showFallback && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mb-4">
            <p>Debug: loading={loading ? 'true' : 'false'}, user={user ? 'yes' : 'no'}, role={role || 'none'}</p>
          </div>
        )}

        {/* Navigation buttons */}
        {showFallback && (
          <div className="mt-6 space-y-3">
            <a
              href="/dashboard"
              className="block w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors text-center"
            >
              Go to Dashboard (Link)
            </a>
            <button
              onClick={() => {
                console.log('🏠 Manual navigation to dashboard')
                window.location.href = '/dashboard'
              }}
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard (Button)
            </button>
            <a
              href="/login"
              className="block w-full bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors text-center"
            >
              Go to Login (Link)
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
