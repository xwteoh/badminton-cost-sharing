'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function OrganizerDashboard() {
  const { user, userProfile, signOut, loading } = useAuth()
  const router = useRouter()

  // Redirect unauthenticated users to login
  useEffect(() => {
    console.log('🔒 Dashboard: Auth check', { loading, hasUser: !!user, userId: user?.id })
    if (!loading && !user) {
      console.log('🔒 Dashboard: No user found, redirecting to login')
      router.replace('/login')
    } else if (user) {
      console.log('🔒 Dashboard: User authenticated, staying on dashboard')
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="text-2xl">🏸</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {userProfile?.name || 'Organizer'}!
            </h1>
            <p className="text-muted-foreground">
              Manage your badminton group sessions and payments
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={async () => {
              console.log('🔓 Dashboard: Sign out clicked')
              try {
                await signOut()
                console.log('🔓 Dashboard: Sign out completed, redirecting to login')
                // Use window.location for reliable redirect after sign out
                window.location.href = '/login'
              } catch (error) {
                console.error('🔓 Dashboard: Sign out error:', error)
                // Still redirect even if sign out fails
                window.location.href = '/login'
              }
            }}
          >
            Sign out
          </Button>
        </div>

        {/* Phase 1 Implementation Notice */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-primary mb-2">
            🚧 Phase 1 Complete - Authentication System
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            You have successfully logged in as an organizer! The core authentication 
            system is now working with Singapore phone number validation and OTP verification.
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Phone:</strong> {user?.phone}</p>
            <p><strong>Role:</strong> {userProfile?.role}</p>
          </div>
        </div>

        {/* Coming in Phase 2 */}
        <div className="bg-muted/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Coming in Phase 2 - Core Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">📊 Financial Overview</h4>
              <p className="text-sm text-muted-foreground">
                Outstanding balances, credits, and payment summaries
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📝 Record Session</h4>
              <p className="text-sm text-muted-foreground">
                Quick session recording with cost calculation
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">💳 Record Payment</h4>
              <p className="text-sm text-muted-foreground">
                Easy payment tracking with balance updates
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">👥 Player Overview</h4>
              <p className="text-sm text-muted-foreground">
                Manage all players and their balances
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}