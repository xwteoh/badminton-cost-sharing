'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'

export default function PlayerDashboard() {
  const { user, userProfile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hi {userProfile?.name || 'Player'}! 🏸
            </h1>
            <p className="text-muted-foreground">
              Track your badminton sessions and payments
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>

        {/* Phase 1 Implementation Notice */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-primary mb-2">
            🚧 Phase 1 Complete - Authentication System
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            You have successfully logged in as a player! The core authentication 
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
            Coming in Phase 2 - Your Features
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">💰 Your Balance</h4>
              <p className="text-sm text-muted-foreground">
                See your current balance, what you owe, or any credits
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">💳 Payment Instructions</h4>
              <p className="text-sm text-muted-foreground">
                Easy PayNow details and payment methods
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📅 Upcoming Sessions</h4>
              <p className="text-sm text-muted-foreground">
                View your upcoming badminton games
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📊 Transaction History</h4>
              <p className="text-sm text-muted-foreground">
                Track all your sessions and payments over time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}