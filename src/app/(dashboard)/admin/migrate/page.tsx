'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { DataMigrationTool } from '@/components/admin/DataMigrationTool'
import { useAuth } from '@/components/providers/AuthProvider'

export default function MigratePage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated or not organizer
  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'organizer')) {
      router.push('/dashboard')
    }
  }, [user, userProfile, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not organizer
  if (!user || (userProfile && userProfile.role !== 'organizer')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to organizers.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
    }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Data Migration Tools</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <DataMigrationTool organizerId={user.id} />
      </div>

      {/* Warning Footer */}
      <div className="bg-red-50 border-t border-red-200 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center space-x-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">
                Warning: Data migration is a one-time operation that directly modifies your database.
              </p>
              <p className="text-red-700 text-sm">
                Please backup your data and test thoroughly before running on production data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}