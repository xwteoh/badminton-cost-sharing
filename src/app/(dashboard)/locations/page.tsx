'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { LocationForm } from '@/components/business/LocationForm'
import { LocationList } from '@/components/business/LocationList'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { locationService, type Location } from '@/lib/services/locations'
import { cn } from '@/lib/utils/cn'

export default function LocationsPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  const loadLocations = async () => {
    if (!user?.id) {
      console.log('⚠️ loadLocations: No user ID available')
      return
    }

    try {
      console.log('🔄 loadLocations: Starting to load locations for user:', user.id)
      setLoading(true)
      setError(null)
      const data = await locationService.getLocationsByOrganizer(user.id, true) // Include inactive
      console.log('✅ loadLocations: Loaded locations:', data.length, 'items')
      setLocations(data)
    } catch (err: any) {
      console.error('❌ loadLocations: Error loading locations:', err)
      setError(err.message || 'Failed to load locations')
    } finally {
      console.log('🔄 loadLocations: Setting loading to false')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [user?.id])

  const handleAddLocation = () => {
    setEditingLocation(null)
    setShowForm(true)
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setShowForm(true)
  }

  const handleFormSubmit = async (data: { name: string; address?: string; notes?: string }) => {
    console.log('🏗️ Starting location submission:', { data, userId: user?.id, userProfile: userProfile?.id })
    
    if (!user?.id) {
      console.error('❌ No user ID available for location submission')
      throw new Error('User not authenticated')
    }

    try {
      if (editingLocation) {
        console.log('✏️ Updating existing location:', editingLocation.id)
        await locationService.updateLocation(editingLocation.id, data)
      } else {
        console.log('➕ Creating new location with data:', { organizer_id: user.id, ...data })
        await locationService.createLocation({
          organizer_id: user.id,
          ...data
        })
      }
      
      console.log('✅ Location saved successfully')
      setShowForm(false)
      setEditingLocation(null)
      
      // Add timeout to loadLocations to prevent hanging
      const loadPromise = loadLocations()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Loading locations timed out')), 5000)
      )
      
      try {
        await Promise.race([loadPromise, timeoutPromise])
        console.log('✅ Locations reloaded successfully')
      } catch (loadError: any) {
        console.error('⚠️ Error reloading locations (non-critical):', loadError)
        // Don't throw here - the location was saved successfully
      }
    } catch (err: any) {
      console.error('❌ Error saving location:', err)
      throw new Error(err.message || 'Failed to save location')
    }
  }

  const handleDeactivateLocation = async (locationId: string) => {
    try {
      await locationService.deactivateLocation(locationId)
      await loadLocations()
    } catch (err: any) {
      console.error('Error deactivating location:', err)
      setError(err.message || 'Failed to deactivate location')
    }
  }

  const handleActivateLocation = async (locationId: string) => {
    try {
      await locationService.updateLocation(locationId, { is_active: true })
      await loadLocations()
    } catch (err: any) {
      console.error('Error activating location:', err)
      setError(err.message || 'Failed to activate location')
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to permanently delete this location? This action cannot be undone.')) {
      return
    }

    try {
      await locationService.deleteLocation(locationId)
      await loadLocations()
    } catch (err: any) {
      console.error('Error deleting location:', err)
      setError(err.message || 'Failed to delete location')
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingLocation(null)
  }

  // Show loading while authentication is being resolved
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
      }}>
        {/* Premium Loading Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent, rgba(34, 197, 94, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.1), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.1), transparent)'
        }}></div>
        
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-2xl mb-6" style={{
            background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(34, 197, 94, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-4xl filter drop-shadow-lg">📍</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="w-12 h-12 mx-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200" style={{ borderTopColor: '#f59e0b' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold" style={{
                background: 'linear-gradient(to right, #f59e0b, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Loading Locations Manager
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Checking permissions...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check role from userProfile instead of user object
  if (userProfile?.role !== 'organizer') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.03), #ffffff, rgba(245, 158, 11, 0.03))'
      }}>
        {/* Premium Error Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.05), transparent, rgba(245, 158, 11, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.1), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(245, 158, 11, 0.1), transparent)'
        }}></div>
        
        <div className="relative z-10 text-center space-y-6 max-w-md mx-auto p-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-2xl mb-6" style={{
            background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-4xl filter drop-shadow-lg">🚫</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{
              background: 'linear-gradient(to right, #ef4444, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Access Denied
            </h2>
            <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
              Only organizers can manage locations.
            </p>
            <div className="space-y-2 text-xs" style={{ color: '#9ca3af' }}>
              <p>Current role: {userProfile?.role || 'not set'}</p>
              <p>User ID: {user?.id?.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
    }}>
      {/* Premium Background Pattern */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent, rgba(34, 197, 94, 0.05))'
      }}></div>
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
        background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.08), transparent)'
      }}></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
        background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.08), transparent)'
      }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), transparent)'
      }}></div>
      
      <div className="relative z-10 max-w-4xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
            background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(34, 197, 94, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-2xl lg:text-3xl filter drop-shadow-lg">📍</span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #f59e0b, #22c55e, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Manage Locations
                </h1>
                <p className="mt-1 flex items-center space-x-2 text-sm lg:text-base" style={{ color: '#6b7280' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #f59e0b, #22c55e)'
                  }}></span>
                  <span>Add and manage badminton court locations for sessions</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-2 text-xs rounded-lg px-3 py-2 backdrop-blur-sm" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#6b7280'
              }}>
                <span>🏢</span>
                <span>Location Management</span>
              </div>
              <Button
                onClick={handleAddLocation}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(to right, #f59e0b, #f97316)',
                  color: 'white',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #ea580c, #dc2626)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #f59e0b, #f97316)'
                }}
              >
                <span className="mr-2">➕</span>
                Add Location
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(245, 158, 11, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.color = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.color = '#6b7280'
                }}
              >
                <span className="mr-2">←</span>
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Error Message */}
        {error && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(239, 68, 68, 0.2)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>❌</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: '#dc2626' }}>Error loading locations</span>
                  <p className="mt-1 text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Location Form */}
        {showForm && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '24px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(124, 58, 237, 0.12) 100%)',
              borderRadius: '24px'
            }}></div>
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full blur-3xl translate-x-28 translate-y-28" style={{
              background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(124, 58, 237, 0.05) 100%)',
              borderRadius: '24px'
            }}></div>
            
            <div className="relative">
              <div className="p-4 lg:p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                    background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(124, 58, 237, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <span className="text-xl filter drop-shadow-lg">🏗️</span>
                  </div>
                  <h3 className="text-lg font-semibold" style={{
                    background: 'linear-gradient(to right, #22c55e, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {editingLocation ? 'Edit Location' : 'Add New Location'}
                  </h3>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <LocationForm
                  initialData={editingLocation ? {
                    name: editingLocation.name,
                    address: editingLocation.address || undefined,
                    notes: editingLocation.notes || undefined
                  } : undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Premium Location List */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(245, 158, 11, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl translate-x-32 -translate-y-32" style={{
            background: 'linear-gradient(to bottom left, rgba(124, 58, 237, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 50%, rgba(245, 158, 11, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative">
            <div className="p-4 lg:p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                    background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(245, 158, 11, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <span className="text-xl filter drop-shadow-lg">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold" style={{
                    background: 'linear-gradient(to right, #7c3aed, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Your Locations
                  </h3>
                </div>
                <div className="text-sm px-3 py-2 rounded-lg backdrop-blur-sm" style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#6b7280'
                }}>
                  {locations.length} location{locations.length === 1 ? '' : 's'} total
                </div>
              </div>
            </div>
            <div className="p-4 lg:p-6">
              <LocationList
                locations={locations}
                loading={loading}
                onEdit={handleEditLocation}
                onDeactivate={handleDeactivateLocation}
                onActivate={handleActivateLocation}
                onDelete={handleDeleteLocation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}