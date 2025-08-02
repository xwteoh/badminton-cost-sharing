'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { RoleGuard } from '@/components/auth/RoleGuard'
import type { Player } from '@/components/business/PlayerSelectionGrid'
import { SessionForm, type SessionFormData } from '@/components/business/SessionForm'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { calculateSessionDuration } from '@/components/ui/SessionScheduler'
import type { UsageCostBreakdown } from '@/lib/calculations/usage-costs'
import { playerService } from '@/lib/services/players'
import { sessionService } from '@/lib/services/sessions'

export default function RecordSessionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [preselectedPlayerIds, setPreselectedPlayerIds] = useState<string[]>([])
  const [plannedSessionLoading, setPlannedSessionLoading] = useState(false)
  
  // Check if converting from planned session
  const fromPlanned = searchParams.get('fromPlanned')
  const prefilledDate = searchParams.get('date')
  const prefilledStartTime = searchParams.get('startTime')
  const prefilledEndTime = searchParams.get('endTime')
  const prefilledLocation = searchParams.get('location')
  const prefilledNotes = searchParams.get('notes')
  
  // Calculate prefilled hours if times are provided
  const prefilledHours = prefilledStartTime && prefilledEndTime 
    ? calculateSessionDuration(prefilledStartTime, prefilledEndTime)
    : undefined

  // Debug logging for planned session conversion
  if (fromPlanned) {
    console.log('🔍 Converting planned session - URL params:', {
      fromPlanned,
      prefilledDate,
      prefilledStartTime,
      prefilledEndTime,
      prefilledLocation,
      prefilledNotes
    })
    console.log('⏱️ Calculated duration:', prefilledHours)
  }

  // Fetch planned session participants when converting
  useEffect(() => {
    const fetchPlannedSessionParticipants = async () => {
      if (!fromPlanned || !user?.id) return
      
      try {
        setPlannedSessionLoading(true)
        console.log('🔍 Fetching planned session participants for:', fromPlanned)
        
        const plannedSession = await sessionService.getSessionById(fromPlanned)
        
        if (plannedSession?.participants) {
          const participantIds = plannedSession.participants.map(p => p.player.id)
          setPreselectedPlayerIds(participantIds)
          console.log(`✅ Auto-selecting ${participantIds.length} players from planned session:`, participantIds)
        }
        
      } catch (error: any) {
        console.error('Error fetching planned session participants:', error)
        // Don't set error state for this - it's not critical, just means no auto-selection
      } finally {
        setPlannedSessionLoading(false)
      }
    }

    fetchPlannedSessionParticipants()
  }, [fromPlanned, user?.id])

  // Fetch players data
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!user?.id) return
      
      try {
        setPlayersLoading(true)
        console.log('👥 Fetching players for session form')
        
        const playersData = await playerService.getPlayersWithBalances(user.id, false) // Only active players
        
        // Transform to SessionForm Player interface
        const transformedPlayers: Player[] = playersData.map(player => ({
          id: player.id,
          name: player.name,
          phone: player.phone_number || '',
          isActive: player.is_active
        }))
        
        setPlayers(transformedPlayers)
        console.log(`✅ Loaded ${transformedPlayers.length} players for session form`)
        
      } catch (error: any) {
        console.error('Error fetching players:', error)
        setSubmitError(error.message || 'Failed to load players')
      } finally {
        setPlayersLoading(false)
      }
    }

    fetchPlayers()
  }, [user?.id])

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading, router])

  // Show loading while checking auth or loading players
  if (loading || playersLoading || (fromPlanned && plannedSessionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
      }}>
        {/* Premium Loading Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), transparent, rgba(34, 197, 94, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.1), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.1), transparent)'
        }}></div>
        
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-2xl mb-6" style={{
            background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-4xl filter drop-shadow-lg">🏸</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="w-12 h-12 mx-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200" style={{ borderTopColor: '#7c3aed' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold" style={{
                background: 'linear-gradient(to right, #7c3aed, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {loading ? 'Loading Session Form' : plannedSessionLoading ? 'Loading Planned Session' : 'Loading Players'}
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                {loading ? 'Preparing session recording interface...' : plannedSessionLoading ? 'Fetching planned session participants...' : 'Fetching player data...'}
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

  const handleSessionSubmit = async (sessionData: SessionFormData & { costBreakdown: UsageCostBreakdown }) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    
    try {
      console.log('📝 Recording session:', sessionData)
      
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      
      // Transform form data to match database schema
      // Note: total_cost and cost_per_player are computed columns in the database
      const courtCost = sessionData.hoursPlayed * parseFloat(sessionData.courtRatePerHour)
      const shuttlecockCost = sessionData.shuttlecocksUsed * parseFloat(sessionData.shuttlecockRateEach)
      
      // Create temporary players in database first
      const temporaryPlayerIds: string[] = []
      
      if (sessionData.temporaryPlayers.length > 0) {
        console.log('👤 Creating temporary players:', sessionData.temporaryPlayers)
        
        for (const tempPlayer of sessionData.temporaryPlayers) {
          const tempPlayerData = {
            organizer_id: user.id,
            name: tempPlayer.name,
            phone_number: tempPlayer.phone || null,
            is_temporary: true,
            is_active: true,
            user_id: null // No user account for temporary players
          }
          
          const createdTempPlayer = await playerService.createPlayer(tempPlayerData)
          temporaryPlayerIds.push(createdTempPlayer.id)
        }
        
        console.log('✅ Created temporary players:', temporaryPlayerIds)
        
      }
      
      // Combine regular and temporary player IDs
      const allPlayerIds = [...sessionData.selectedPlayerIds, ...temporaryPlayerIds]
      
      const sessionServiceData = {
        organizer_id: user.id,
        session_date: sessionData.sessionDate,
        start_time: sessionData.startTime || null,
        end_time: sessionData.endTime || null,
        location: sessionData.location,
        // Store original rates for accurate data retrieval
        court_rate_per_hour: parseFloat(sessionData.courtRatePerHour),
        shuttlecock_rate_each: parseFloat(sessionData.shuttlecockRateEach),
        shuttlecocks_used: sessionData.shuttlecocksUsed,
        hours_played: sessionData.hoursPlayed,
        // Calculated totals (backward compatibility)
        court_cost: courtCost,
        shuttlecock_cost: shuttlecockCost,
        other_costs: parseFloat(sessionData.otherCosts),
        player_count: allPlayerIds.length,
        notes: sessionData.notes || null,
      }
      
      // If converting from planned session, use convertPlannedToCompleted
      let createdSession
      if (fromPlanned) {
        console.log('📅 Converting planned session:', fromPlanned)
        createdSession = await sessionService.convertPlannedToCompleted(
          fromPlanned,
          sessionServiceData,
          allPlayerIds
        )
      } else {
        // Create new completed session with participants
        createdSession = await sessionService.createCompletedSession(
          sessionServiceData,
          allPlayerIds
        )
      }
      
      console.log('✅ Session recorded successfully:', createdSession)
      
      // Wait a moment for database triggers to complete balance calculations
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Success
      const totalPlayerCount = allPlayerIds.length
      const regularPlayerCount = sessionData.selectedPlayerIds.length
      const tempPlayerCount = sessionData.temporaryPlayers.length
      
      let successMessage = fromPlanned 
        ? `Planned session converted successfully! ${totalPlayerCount} players will be charged $${sessionData.costBreakdown.costPerPlayer.toString()} each.`
        : `Session recorded successfully! ${totalPlayerCount} players will be charged $${sessionData.costBreakdown.costPerPlayer.toString()} each.`
      
      if (tempPlayerCount > 0) {
        successMessage += ` (${regularPlayerCount} regular + ${tempPlayerCount} drop-in players)`
      }
      
      setSubmitSuccess(successMessage)
      
      // Set flag for temporary players created
      if (tempPlayerCount > 0) {
        localStorage.setItem('temp_players_created', Date.now().toString())
      }
      
      // Redirect after showing success message
      setTimeout(() => {
        if (fromPlanned) {
          window.location.href = '/upcoming-sessions?converted=true'
        } else {
          window.location.href = '/dashboard?session=recorded'
        }
      }, 2000)
      
    } catch (error: any) {
      console.error('Error recording session:', error)
      setSubmitError(error.message || 'Failed to record session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create prefilled data object
  const prefilledData = prefilledDate ? {
    sessionDate: prefilledDate,
    startTime: prefilledStartTime || '',
    endTime: prefilledEndTime || '',
    location: prefilledLocation || '',
    hoursPlayed: prefilledHours || 0,
    notes: prefilledNotes || '',
    selectedPlayerIds: fromPlanned ? preselectedPlayerIds : []
  } : undefined

  // Debug logging for prefilled data
  if (fromPlanned && prefilledData) {
    console.log('📋 Prefilled data object:', prefilledData)
    console.log('👥 Preselected players:', preselectedPlayerIds)
  }

  return (
    <RoleGuard allowedRoles={['organizer']}>
      <div className="min-h-screen relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
      }}>
        {/* Premium Background Pattern */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), transparent, rgba(34, 197, 94, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.08), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.08), transparent)'
        }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
          background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent)'
        }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
            background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-2xl lg:text-3xl filter drop-shadow-lg">🏸</span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {fromPlanned ? 'Convert Planned Session' : 'Record Session'}
                </h1>
                <p className="mt-1 flex items-center space-x-2 text-sm lg:text-base" style={{ color: '#6b7280' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #7c3aed, #22c55e)'
                  }}></span>
                  <span>
                    {fromPlanned 
                      ? 'Complete the planned session by recording actual attendance and costs'
                      : 'Log a completed badminton session with costs and participants'
                    }
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(124, 58, 237, 0.2)',
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

        {/* Premium Conversion Banner */}
        {fromPlanned && (
          <div className="relative overflow-hidden" style={{ borderRadius: '20px' }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
              borderRadius: '20px'
            }}></div>
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl -translate-x-16 -translate-y-16" style={{
              background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-sm" style={{
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '20px'
            }}></div>
            
            <div className="relative p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-white text-lg filter drop-shadow-lg">📅</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1e40af' }}>Converting Planned Session</h3>
                  <p className="text-sm lg:text-base" style={{ color: '#1e3a8a' }}>
                    Some details have been pre-filled from your planned session. Update attendance, costs, and other details below.
                  </p>
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm" style={{
                  background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                  color: 'white'
                }}>
                  CONVERSION
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Success/Error Messages */}
        {submitSuccess && (
          <div className="relative overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
              borderRadius: '16px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-sm" style={{
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '16px'
            }}></div>
            <div className="relative p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.2)'
                }}>
                  <span>✅</span>
                </div>
                <div className="flex-1">
                  <span className="font-medium" style={{ color: '#15803d' }}>Session recorded successfully!</span>
                  <p className="mt-1 text-sm" style={{ color: '#166534' }}>{submitSuccess}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="relative overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
              borderRadius: '16px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-sm" style={{
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px'
            }}></div>
            <div className="relative p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)'
                }}>
                  <span>❌</span>
                </div>
                <div className="flex-1">
                  <span className="font-medium" style={{ color: '#dc2626' }}>Error recording session</span>
                  <p className="mt-1 text-sm" style={{ color: '#b91c1c' }}>{submitError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Main Content */}
        <div className="relative overflow-hidden" style={{ borderRadius: '24px' }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl -translate-x-24 -translate-y-24" style={{
            background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.03), transparent)'
          }}></div>
          <div className="absolute inset-0" style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'transparent',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-6 lg:p-8">
            <SessionForm
              onSubmit={handleSessionSubmit}
              loading={isSubmitting}
              organizerId={user.id}
              initialData={prefilledData}
              players={players}
            />
          </div>
        </div>

        {/* Premium Quick Tips */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '20px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(249, 115, 22, 0.12) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl -translate-x-16 -translate-y-16" style={{
            background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(249, 115, 22, 0.05) 100%)',
            borderRadius: '20px'
          }}></div>
          
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{
                background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2))'
              }}>
                <span className="text-lg">💡</span>
              </div>
              <h3 className="text-lg font-semibold" style={{
                background: 'linear-gradient(to right, #f59e0b, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Session Recording Tips</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium" style={{ color: '#ea580c' }}>Recording Accuracy</h4>
                <ul className="text-sm space-y-2" style={{ color: '#c2410c' }}>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ea580c' }}></span>
                    <span>Double-check player attendance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ea580c' }}></span>
                    <span>Verify court hours played</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ea580c' }}></span>
                    <span>Count shuttlecocks used accurately</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ea580c' }}></span>
                    <span>Include any additional costs</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium" style={{ color: '#ea580c' }}>After Recording</h4>
                <ul className="text-sm space-y-2" style={{ color: '#c2410c' }}>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ea580c' }}></span>
                    <span>Player balances update automatically</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ea580c' }}></span>
                    <span>Cost is split equally among attendees</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ea580c' }}></span>
                    <span>Players can see updated debt/credit</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#ea580c' }}></span>
                    <span>Session appears in history</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </RoleGuard>
  )
}