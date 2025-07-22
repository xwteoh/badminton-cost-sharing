'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'

export default function HomePage() {
  const { user, userProfile, role, loading } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected || loading) return
    
    if (user) {
      // If we have a user but no role yet, wait for role to load
      if (!role) {
        console.log('🏠 HomePage: User found but role still loading, waiting...')
        return
      }
      
      console.log('🏠 HomePage: Authenticated user with role:', role)
      setHasRedirected(true)
      
      // Redirect based on user role
      if (role === 'player') {
        console.log('🏠 HomePage: Player role, redirecting to player-dashboard')
        window.location.href = '/player-dashboard'
      } else if (role === 'organizer') {
        console.log('🏠 HomePage: Organizer role, redirecting to dashboard')
        window.location.href = '/dashboard'
      } else {
        console.log('🏠 HomePage: Unknown role, redirecting to login')
        window.location.href = '/login'
      }
    } else {
      console.log('🏠 HomePage: No user, redirecting to login')
      setHasRedirected(true)
      window.location.href = '/login'
    }
  }, [user, role, loading, hasRedirected])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <span className="text-3xl">🏸</span>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200" style={{ borderTopColor: '#7c3aed' }}></div>
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Badminton Cost Tracker
        </h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
