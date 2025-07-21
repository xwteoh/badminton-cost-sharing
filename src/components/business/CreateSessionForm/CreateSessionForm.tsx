'use client'

import { useState, useEffect, useMemo } from 'react'

import { PlayerSelectionGrid, type Player } from '@/components/business/PlayerSelectionGrid'
import { type TemporaryPlayerData } from '@/components/business/TemporaryPlayerModal'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { SessionScheduler, validateSessionTime, calculateSessionDuration } from '@/components/ui/SessionScheduler'
import { locationService, type Location } from '@/lib/services/locations'
import { playerService } from '@/lib/services/players'
import { cn } from '@/lib/utils/cn'

export interface CreateSessionFormData {
  title: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string
  notes: string
  selectedPlayerIds: string[]
  temporaryPlayers: TemporaryPlayerData[]
}

export interface CreateSessionFormProps {
  /** Form data */
  data?: Partial<CreateSessionFormData>
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Success callback */
  onSubmit?: (data: CreateSessionFormData) => void | Promise<void>
  /** Cancel callback */
  onCancel?: () => void
  /** Custom className */
  className?: string
  /** Edit mode - changes UI text and behavior */
  isEditMode?: boolean
}

// Removed hardcoded locations - now using dynamic location service

export function CreateSessionForm({
  data = {},
  loading = false,
  error,
  onSubmit,
  onCancel,
  className,
  isEditMode = false
}: CreateSessionFormProps) {
  // Default to tomorrow for new sessions
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<CreateSessionFormData>(() => ({
    title: data?.title || '',
    sessionDate: data?.sessionDate || getTomorrowDate(),
    startTime: data?.startTime || '07:00', // Default to 7 AM
    endTime: data?.endTime || '09:00', // Default to 9 AM
    location: data?.location || '',
    notes: data?.notes || '',
    selectedPlayerIds: data?.selectedPlayerIds || [],
    temporaryPlayers: data?.temporaryPlayers || []
  }))

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [locations, setLocations] = useState<Location[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [locationsError, setLocationsError] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [playersError, setPlayersError] = useState<string | null>(null)

  const { user } = useAuth()

  // Update form data when data prop changes (for edit mode)
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const newFormData = {
        title: data.title || '',
        sessionDate: data.sessionDate || getTomorrowDate(),
        startTime: data.startTime || '07:00',
        endTime: data.endTime || '09:00',
        location: data.location || '',
        notes: data.notes || '',
        selectedPlayerIds: data.selectedPlayerIds || [],
        temporaryPlayers: data.temporaryPlayers || []
      }
      setFormData(newFormData)
    }
  }, [data?.title, data?.sessionDate, data?.startTime, data?.endTime, data?.location, data?.notes, data?.selectedPlayerIds, data?.temporaryPlayers])

  // Load locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      if (!user?.id) return

      try {
        setLocationsLoading(true)
        setLocationsError(null)
        const locationsData = await locationService.getLocationsByOrganizer(user.id)
        setLocations(locationsData)
      } catch (error: any) {
        console.error('Error loading locations:', error)
        setLocationsError(error.message || 'Failed to load locations')
      } finally {
        setLocationsLoading(false)
      }
    }

    loadLocations()
  }, [user?.id])

  // Load players on component mount
  useEffect(() => {
    const loadPlayers = async () => {
      if (!user?.id) return

      try {
        setPlayersLoading(true)
        setPlayersError(null)
        const playersData = await playerService.getPlayersByOrganizer(user.id)
        // Transform to match Player interface
        const transformedPlayers: Player[] = playersData.map(player => ({
          id: player.id,
          name: player.name,
          phone: player.phone_number,
          isActive: player.is_active
        }))
        setPlayers(transformedPlayers)
      } catch (error: any) {
        console.error('Error loading players:', error)
        setPlayersError(error.message || 'Failed to load players')
      } finally {
        setPlayersLoading(false)
      }
    }

    loadPlayers()
  }, [user?.id])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate required fields
    if (!formData.sessionDate) errors.sessionDate = 'Session date is required'
    if (!formData.startTime) errors.startTime = 'Start time is required'
    if (!formData.endTime) errors.endTime = 'End time is required'
    if (!formData.location) errors.location = 'Location is required'

    // Validate session time
    const timeError = validateSessionTime(formData.sessionDate, formData.startTime, formData.endTime)
    if (timeError) errors.time = timeError

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await onSubmit?.(formData)
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  const handleFieldChange = <K extends keyof CreateSessionFormData>(
    field: K,
    value: CreateSessionFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
  }

  // Generate suggested session title based on date - memoized for better performance
  const suggestedTitle = useMemo(() => {
    console.log('🗓️ Generating suggested title for date:', formData.sessionDate)
    
    if (!formData.sessionDate) {
      console.log('🗓️ No session date, returning empty title')
      return ''
    }
    
    try {
      const date = new Date(`${formData.sessionDate  }T00:00:00`)
      console.log('🗓️ Parsed date object:', date)
      
      const weekday = date.toLocaleDateString('en-SG', { weekday: 'long' })
      const shortDate = date.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })
      
      const title = `${weekday} Session - ${shortDate}`
      console.log('🗓️ Generated suggested title:', title)
      
      return title
    } catch (error) {
      console.error('Error generating suggested title:', error)
      return ''
    }
  }, [formData.sessionDate])

  const sessionDuration = calculateSessionDuration(formData.startTime, formData.endTime)
  const totalPlayers = formData.selectedPlayerIds.length + formData.temporaryPlayers.length

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
            background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-2xl filter drop-shadow-lg">📅</span>
          </div>
          <h2 className="text-2xl font-bold" style={{
            background: 'linear-gradient(to right, #7c3aed, #22c55e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {isEditMode ? 'Edit Session' : 'Plan New Session'}
          </h2>
          <p className="font-medium" style={{ color: '#6b7280' }}>
            {isEditMode 
              ? 'Update the details of your planned session'
              : 'Schedule an upcoming badminton session for your group'
            }
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <span>⚠️</span>
              <span className="font-medium">Error creating session</span>
            </div>
            <p className="text-red-700 mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Session Title */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '20px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="relative p-6 space-y-3">
            <label className="block text-sm font-medium" style={{
              background: 'linear-gradient(to right, #7c3aed, #22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Session Title
            </label>
          <div className="space-y-2">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                console.log('📝 Title changed:', e.target.value)
                handleFieldChange('title', e.target.value)
              }}
              placeholder={suggestedTitle || 'Enter session title'}
              className="w-full h-12 px-4 py-3 border border-gray-200 rounded-lg text-base text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
            />
            {!formData.title && formData.sessionDate && suggestedTitle && (
              <button
                type="button"
                onClick={() => handleFieldChange('title', suggestedTitle)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Use suggested title: "{suggestedTitle}"
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Date & Time Scheduler */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '20px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(124, 58, 237, 0.12) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(124, 58, 237, 0.05) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="relative p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{
              background: 'linear-gradient(to right, #22c55e, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              <span>🗓️</span>
              <span>When</span>
            </h3>
            <SessionScheduler
              selectedDate={formData.sessionDate}
              selectedStartTime={formData.startTime}
              selectedEndTime={formData.endTime}
              onDateChange={(date) => {
                console.log('📅 Date changed to:', date)
                handleFieldChange('sessionDate', date)
              }}
              onStartTimeChange={(time) => handleFieldChange('startTime', time)}
              onEndTimeChange={(time) => handleFieldChange('endTime', time)}
              error={validationErrors.time || validationErrors.sessionDate || validationErrors.startTime || validationErrors.endTime}
            />
          </div>
        </div>

        {/* Location */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '20px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(124, 58, 237, 0.12) 100%)',
            borderRadius: '20px'
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
          <div className="relative p-6 space-y-3">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{
              background: 'linear-gradient(to right, #f59e0b, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              <span>📍</span>
              <span>Where</span>
            </h3>
            <label className="block text-sm font-medium" style={{
              background: 'linear-gradient(to right, #f59e0b, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Location *
            </label>
            <select
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              className={cn(
                'w-full h-12 px-4 py-3 border rounded-lg text-base text-gray-900 bg-gray-50/50',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white',
                'transition-all duration-200',
                validationErrors.location ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
              )}
            >
              <option value="">Select location</option>
              {locationsLoading ? (
                <option disabled>Loading locations...</option>
              ) : locationsError ? (
                <option disabled>Error loading locations</option>
              ) : locations.length === 0 ? (
                <option disabled>No locations available</option>
              ) : (
                locations.map(location => (
                  <option key={location.id} value={location.name}>
                    {location.name}
                  </option>
                ))
              )}
            </select>
            {validationErrors.location && (
              <p className="text-sm text-red-600">{validationErrors.location}</p>
            )}
            {!locationsLoading && locations.length === 0 && !locationsError && (
              <p className="text-sm text-amber-600 flex items-center space-x-1">
                <span>⚠️</span>
                <span>No locations configured. You can still enter location in the notes field.</span>
              </p>
            )}
            {locationsError && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <span>❌</span>
                <span>{locationsError}</span>
              </p>
            )}
          </div>
        </div>


        {/* Player Selection */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '20px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(124, 58, 237, 0.12) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(124, 58, 237, 0.05) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="relative p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{
              background: 'linear-gradient(to right, #22c55e, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              <span>👥</span>
              <span>Who's Playing</span>
            </h3>
            <PlayerSelectionGrid
              players={players}
              selectedPlayerIds={formData.selectedPlayerIds}
              onSelectionChange={(selectedIds) => handleFieldChange('selectedPlayerIds', selectedIds)}
              temporaryPlayers={formData.temporaryPlayers}
              onTemporaryPlayersChange={(tempPlayers) => handleFieldChange('temporaryPlayers', tempPlayers)}
              maxSelection={20}
              loading={playersLoading}
              error={playersError}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="relative overflow-hidden shadow-xl" style={{ borderRadius: '16px' }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom right, rgba(156, 163, 175, 0.08), rgba(255, 255, 255, 0.95))',
            borderRadius: '16px'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-md shadow-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}></div>
          <div className="relative p-4 space-y-3">
            <label className="block text-sm font-medium" style={{
              background: 'linear-gradient(to right, #9ca3af, #6b7280)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Any additional information about this session..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 resize-none"
            />
          </div>
        </div>

        {/* Session Summary */}
        {formData.sessionDate && formData.startTime && formData.endTime && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(99, 102, 241, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="relative p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2" style={{
                background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                <span>📋</span>
                <span>Session Summary</span>
              </h3>
            <div className="space-y-2 text-blue-800">
              <div className="flex items-center justify-between">
                <span>Duration:</span>
                <span className="font-medium">{sessionDuration}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Expected Players:</span>
                <span className="font-medium">{totalPlayers} players</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-lg text-sm font-medium">Planned</span>
              </div>
            </div>
              <p className="text-xs text-blue-600 mt-3">
                💡 Players will see this session in their upcoming games list
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-xl hover:-translate-y-1 transform"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              color: 'white',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              minHeight: '48px',
              paddingLeft: '32px',
              paddingRight: '32px'
            }}
          >
            <span className="relative z-10 flex items-center space-x-2">
              <span className="text-xl">✨</span>
              <span>{isEditMode ? 'Update Session' : 'Create Planned Session'}</span>
            </span>
          </Button>
        </div>
      </form>
    </div>
  )
}