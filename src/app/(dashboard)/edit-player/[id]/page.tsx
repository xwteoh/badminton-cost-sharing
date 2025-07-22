'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { playerService } from '@/lib/services/players'
import type { Player as PlayerData } from '@/lib/supabase/types'

interface EditPlayerFormData {
  name: string
  phoneNumber: string
  notes: string
  isActive: boolean
}

export default function EditPlayerPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string

  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [formData, setFormData] = useState<EditPlayerFormData>({
    name: '',
    phoneNumber: '',
    notes: '',
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading])

  // Load player data
  useEffect(() => {
    const loadPlayer = async () => {
      if (!user?.id || !playerId) return

      try {
        setIsLoading(true)
        setError(null)
        
        console.log('📝 Loading player for editing:', playerId)
        const playerData = await playerService.getPlayerById(playerId)
        
        if (playerData.organizer_id !== user.id) {
          setError('You do not have permission to edit this player')
          return
        }

        setPlayer(playerData)
        setFormData({
          name: playerData.name,
          phoneNumber: playerData.phone_number || '',
          notes: playerData.notes || '',
          isActive: playerData.is_active
        })
        
        console.log('✅ Player loaded for editing:', playerData)
      } catch (err: any) {
        console.error('Error loading player:', err)
        setError(err.message || 'Failed to load player data')
      } finally {
        setIsLoading(false)
      }
    }

    loadPlayer()
  }, [user?.id, playerId])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
      }}>
        {/* Premium Loading Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent, rgba(34, 197, 94, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.1), transparent)'
        }}></div>
        
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-2xl mb-6" style={{
            background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(34, 197, 94, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-4xl filter drop-shadow-lg">👤</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="w-12 h-12 mx-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200" style={{ borderTopColor: '#3b82f6' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold" style={{
                background: 'linear-gradient(to right, #3b82f6, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Loading Player Editor
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Preparing player data...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Player name is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      console.log('💾 Updating player:', playerId, formData)
      
      await playerService.updatePlayer(playerId, {
        name: formData.name.trim(),
        phone_number: formData.phoneNumber.trim() || null,
        notes: formData.notes.trim() || null,
        is_active: formData.isActive
      })

      console.log('✅ Player updated successfully')
      setSuccess(true)
      
      // Redirect to players page after success
      setTimeout(() => {
        window.location.href = '/players?updated=true'
      }, 1500)
      
    } catch (err: any) {
      console.error('Error updating player:', err)
      setError(err.message || 'Failed to update player')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = '/players'
  }

  const handleFieldChange = (field: keyof EditPlayerFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  // Check role from userProfile instead of user object
  if (userProfile && userProfile.role !== 'organizer') {
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
              Only organizers can edit player information.
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
      background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
    }}>
      {/* Premium Background Pattern */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent, rgba(34, 197, 94, 0.05))'
      }}></div>
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
        background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.08), transparent)'
      }}></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
        background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.08), transparent)'
      }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), transparent)'
      }}></div>
      
      <div className="relative z-10 max-w-2xl mx-auto p-4 space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
            background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(34, 197, 94, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-2xl filter drop-shadow-lg">✏️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{
                  background: 'linear-gradient(to right, #3b82f6, #22c55e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Edit Player
                </h1>
                <p className="mt-1" style={{ color: '#6b7280' }}>
                  Update player information and settings
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
              style={{
                borderColor: 'rgba(59, 130, 246, 0.2)',
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
              Back to Players
            </Button>
          </div>
        </div>

        {/* Premium Success Message */}
        {success && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.05) 100%)',
              borderRadius: '16px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              borderRadius: '16px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>✅</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: '#16a34a' }}>Player updated successfully!</span>
                  <p className="mt-1 text-sm" style={{ color: '#15803d' }}>Redirecting to players list...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Error Message */}
        {error && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.05) 100%)',
              borderRadius: '16px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(239, 68, 68, 0.2)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '16px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>⚠️</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: '#dc2626' }}>Error</span>
                  <p className="mt-1 text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Loading State */}
        {isLoading ? (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.12) 0%, rgba(156, 163, 175, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(156, 163, 175, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-1/5"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          /* Premium Edit Form */
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(124, 58, 237, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full blur-3xl translate-x-28 translate-y-28" style={{
              background: 'linear-gradient(to top left, rgba(245, 158, 11, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(124, 58, 237, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            
            <div className="relative p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Player Name */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium" style={{
                    background: 'linear-gradient(to right, #f59e0b, #ea580c)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Player Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Enter player's full name"
                    className="w-full h-12 px-4 py-3 border rounded-xl text-base text-gray-900 transition-all duration-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    disabled={isSaving}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium" style={{
                    background: 'linear-gradient(to right, #7c3aed, #6d28d9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                    placeholder="+65 8123 4567"
                    className="w-full h-12 px-4 py-3 border rounded-xl text-base text-gray-900 transition-all duration-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    disabled={isSaving}
                  />
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    Required for players who want to login and view their own data
                  </p>
                </div>

                {/* Player Status */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium" style={{
                    background: 'linear-gradient(to right, #22c55e, #16a34a)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Player Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl backdrop-blur-sm transition-all duration-200 hover:shadow-lg" style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <input
                        type="radio"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={() => handleFieldChange('isActive', true)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        disabled={isSaving}
                      />
                      <span className="text-sm text-gray-900 flex items-center space-x-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></span>
                        <span>Active - Can join sessions</span>
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl backdrop-blur-sm transition-all duration-200 hover:shadow-lg" style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <input
                        type="radio"
                        name="isActive"
                        checked={!formData.isActive}
                        onChange={() => handleFieldChange('isActive', false)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        disabled={isSaving}
                      />
                      <span className="text-sm text-gray-900 flex items-center space-x-2">
                        <span className="w-3 h-3 bg-gray-500 rounded-full shadow-lg"></span>
                        <span>Inactive - Cannot join sessions</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium" style={{
                    background: 'linear-gradient(to right, #ef4444, #dc2626)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Optional notes about this player..."
                    rows={3}
                    className="w-full px-4 py-3 border rounded-xl text-base text-gray-900 transition-all duration-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    disabled={isSaving}
                  />
                </div>

                {/* Premium Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                      color: 'white',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1e40af)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #1d4ed8)'
                    }}
                  >
                    {isSaving ? (
                      <span className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating Player...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <span>💾</span>
                        <span>Update Player</span>
                      </span>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                    style={{
                      borderColor: 'rgba(59, 130, 246, 0.2)',
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
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Premium Player Info Summary */}
        {player && !isLoading && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl translate-x-24 -translate-y-24" style={{
              background: 'linear-gradient(to bottom left, rgba(59, 130, 246, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(59, 130, 246, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(99, 102, 241, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            
            <div className="relative p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>📋</span>
                </div>
                <h3 className="text-lg font-semibold" style={{
                  background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Player Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-blue-800">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Joined:</span>
                  <span className="px-2 py-1 text-sm rounded-md backdrop-blur-sm" style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {new Date(player.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Last Updated:</span>
                  <span className="px-2 py-1 text-sm rounded-md backdrop-blur-sm" style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {new Date(player.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-3 flex items-center space-x-2">
                <span>💡</span>
                <span>Changes will be reflected immediately in the players list</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    )
}