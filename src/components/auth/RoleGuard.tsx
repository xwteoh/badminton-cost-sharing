'use client'

import { useEffect } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: ('organizer' | 'player')[]
  redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { user, userProfile, role, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // If not authenticated, redirect to login
    if (!user) {
      window.location.href = '/login'
      return
    }

    // Only redirect if we have a role loaded AND it's not allowed
    if (role && !allowedRoles.includes(role)) {
      if (role === 'player') {
        // Players can only access player dashboard
        window.location.href = '/player-dashboard'
      } else {
        // Other roles redirect to their default page
        window.location.href = redirectTo || '/dashboard'
      }
      return
    }
  }, [user, role, loading, allowedRoles, redirectTo])

  // Show loading while checking auth OR while waiting for role to load
  if (loading || !user || (user && !role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 mx-auto" style={{ borderTopColor: '#7c3aed' }}></div>
          <p className="text-sm text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    )
  }

  // If role is not allowed, show access denied (with automatic redirect)
  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-600">
            You don't have permission to access this page. You will be redirected shortly.
          </p>
        </div>
      </div>
    )
  }

  // If role is allowed, render children
  return <>{children}</>
}