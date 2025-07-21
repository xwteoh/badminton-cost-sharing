'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { Player } from '@/components/business/PlayerSelectionGrid'
import { SessionForm, type SessionFormData } from '@/components/business/SessionForm'
import type { TemporaryPlayerData } from '@/components/business/TemporaryPlayerModal'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { calculateSessionDuration } from '@/components/ui/SessionScheduler'
import type { UsageCostBreakdown } from '@/lib/calculations/usage-costs'
import { playerService } from '@/lib/services/players'
import { sessionService } from '@/lib/services/sessions'

export default function EditSessionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')
  
  const [sessionData, setSessionData] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [playersLoading, setPlayersLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Fetch players data
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!user?.id) return
      
      try {
        setPlayersLoading(true)
        console.log('👥 Fetching players for edit session form')
        
        const playersData = await playerService.getPlayersWithBalances(user.id, true) // Include inactive players for editing
        
        // Transform to SessionForm Player interface
        const transformedPlayers: Player[] = playersData.map(player => ({
          id: player.id,
          name: player.name,
          phone: player.phone_number || '',
          isActive: player.is_active
        }))
        
        setPlayers(transformedPlayers)
        console.log(`✅ Loaded ${transformedPlayers.length} players for edit session form`)
        
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

  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      if (!user?.id || !sessionId) return

      try {
        setDataLoading(true)
        setSubmitError(null)

        console.log('📋 Loading session data for editing:', sessionId)

        // Load session data with participants
        const sessions = await sessionService.getSessionsByOrganizer(user.id)
        const session = sessions.find(s => s.id === sessionId)

        if (!session) {
          throw new Error('Session not found')
        }

        if (session.status !== 'completed') {
          throw new Error('Only completed sessions can be edited from this page')
        }

        console.log('✅ Session loaded for editing:', session)
        setSessionData(session)

        // Set participants if they exist
        if (session.participants) {
          setParticipants(session.participants)
        }

      } catch (error: any) {
        console.error('Error loading session data:', error)
        setSubmitError(error.message || 'Failed to load session data')
      } finally {
        setDataLoading(false)
      }
    }

    loadSessionData()
  }, [user?.id, sessionId])

  // Show loading while checking auth or loading data
  if (loading || dataLoading || playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl">✏️</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-gray-600">
            {loading || dataLoading ? 'Loading session data...' : 'Loading players...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (submitError && !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl text-white">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Error Loading Session</h2>
          <p className="text-gray-600 max-w-md">{submitError}</p>
          <Button
            onClick={() => window.location.href = '/upcoming-sessions'}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
          >
            <span className="mr-2">←</span>
            Back to Sessions
          </Button>
        </div>
      </div>
    )
  }

  const handleSessionSubmit = async (sessionFormData: SessionFormData & { costBreakdown: UsageCostBreakdown }) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    
    try {
      console.log('📝 Updating session:', sessionId, sessionFormData)
      
      if (!user?.id || !sessionId) {
        throw new Error('Missing required data for session update')
      }
      
      // Calculate costs from form data
      const courtCost = sessionFormData.hoursPlayed * parseFloat(sessionFormData.courtRatePerHour)
      const shuttlecockCost = sessionFormData.shuttlecocksUsed * parseFloat(sessionFormData.shuttlecockRateEach)
      const otherCosts = parseFloat(sessionFormData.otherCosts)
      
      // Handle temporary players - create any new ones
      const temporaryPlayerIds: string[] = []
      
      if (sessionFormData.temporaryPlayers.length > 0) {
        console.log('👤 Creating new temporary players:', sessionFormData.temporaryPlayers)
        
        for (const tempPlayer of sessionFormData.temporaryPlayers) {
          const tempPlayerData = {
            organizer_id: user.id,
            name: tempPlayer.name,
            phone_number: tempPlayer.phone || null,
            is_temporary: true,
            is_active: true,
            user_id: null
          }
          
          const createdTempPlayer = await playerService.createPlayer(tempPlayerData)
          temporaryPlayerIds.push(createdTempPlayer.id)
        }
        
        console.log('✅ Created new temporary players:', temporaryPlayerIds)
      }
      
      // Combine regular and new temporary player IDs
      const allPlayerIds = [...sessionFormData.selectedPlayerIds, ...temporaryPlayerIds]
      
      // Update session data
      const sessionUpdateData = {
        session_date: sessionFormData.sessionDate,
        start_time: sessionFormData.startTime || null,
        end_time: sessionFormData.endTime || null,
        location: sessionFormData.location,
        court_cost: courtCost,
        shuttlecock_cost: shuttlecockCost,
        other_costs: otherCosts,
        player_count: allPlayerIds.length,
        notes: sessionFormData.notes || null,
      }
      
      // Use the session service's update method that handles participants and balance recalculation
      await sessionService.updateCompletedSession(sessionId, sessionUpdateData, allPlayerIds)
      
      console.log('✅ Session updated successfully')
      
      // Wait a moment for database triggers to complete balance calculations
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Success message
      const totalPlayerCount = allPlayerIds.length
      const regularPlayerCount = sessionFormData.selectedPlayerIds.length
      const tempPlayerCount = sessionFormData.temporaryPlayers.length
      
      let successMessage = `Session updated successfully! ${totalPlayerCount} players will be charged $${sessionFormData.costBreakdown.costPerPlayer.toString()} each.`
      
      if (tempPlayerCount > 0) {
        successMessage += ` (${regularPlayerCount} regular + ${tempPlayerCount} drop-in players)`
      }
      
      setSubmitSuccess(successMessage)
      
      // Redirect back to session details after showing success message
      setTimeout(() => {
        window.location.href = `/session-details?id=${sessionId}`
      }, 2000)
      
    } catch (error: any) {
      console.error('Error updating session:', error)
      setSubmitError(error.message || 'Failed to update session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create prefilled data object from existing session
  const prefilledData: Partial<SessionFormData> | undefined = sessionData ? (() => {
    const hoursPlayed = sessionData.start_time && sessionData.end_time 
      ? calculateSessionDuration(sessionData.start_time, sessionData.end_time)
      : 0
    
    return {
      sessionDate: sessionData.session_date,
      startTime: sessionData.start_time ? sessionData.start_time.substring(0, 5) : '',
      endTime: sessionData.end_time ? sessionData.end_time.substring(0, 5) : '',
      location: sessionData.location || '',
      hoursPlayed,
      // Calculate rates from existing costs
      courtRatePerHour: sessionData.start_time && sessionData.end_time && sessionData.court_cost 
        ? (sessionData.court_cost / hoursPlayed).toFixed(2)
        : '50.00',
      // Try to reverse-calculate shuttlecocks used, or default to a reasonable estimate
      shuttlecocksUsed: sessionData.shuttlecock_cost && sessionData.shuttlecock_cost > 0
        ? Math.round(sessionData.shuttlecock_cost / 5) // Assume $5 per shuttlecock
        : Math.max(1, Math.floor(hoursPlayed * 2)), // Estimate: 2 shuttlecocks per hour
      shuttlecockRateEach: '5.00', // Default rate
      otherCosts: (sessionData.other_costs || 0).toFixed(2),
      selectedPlayerIds: participants
        .filter(p => !p.player.is_temporary)
        .map(p => p.player.id),
      temporaryPlayers: participants
        .filter(p => p.player.is_temporary)
        .map(p => ({
          name: p.player.name,
          phone: p.player.phone_number || ''
        } as TemporaryPlayerData)),
      notes: sessionData.notes || ''
    }
  })() : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl"></div>
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">✏️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Edit Completed Session
                </h1>
                <p className="text-gray-600 mt-1 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  <span>Update session details, costs, and participants</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = `/session-details?id=${sessionId}`}
                className="border-gray-300 bg-white/50 text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
              >
                <span className="mr-2">←</span>
                Back to Details
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">✏️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-2">Editing Completed Session</h3>
              <p className="text-amber-800">
                Update hours played, shuttlecock usage, costs, and participants. Player balances will be recalculated automatically.
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold rounded-full shadow-lg">
              EDIT MODE
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-green-800">
              <span>✅</span>
              <span className="font-medium">Session updated successfully!</span>
            </div>
            <p className="text-green-700 mt-1 text-sm">{submitSuccess}</p>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <span>❌</span>
              <span className="font-medium">Error updating session</span>
            </div>
            <p className="text-red-700 mt-1 text-sm">{submitError}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-8">
          <SessionForm
            onSubmit={handleSessionSubmit}
            loading={isSubmitting}
            organizerId={user.id}
            initialData={prefilledData}
            players={players}
          />
        </div>

        {/* Edit Tips */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center space-x-2">
            <span>💡</span>
            <span>Session Editing Tips</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-orange-800">
            <div className="space-y-2">
              <h4 className="font-medium">What You Can Update</h4>
              <ul className="text-sm space-y-1">
                <li>• Add or remove participants</li>
                <li>• Adjust hours played</li>
                <li>• Update shuttlecock usage</li>
                <li>• Modify court rates and costs</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">What Happens</h4>
              <ul className="text-sm space-y-1">
                <li>• Player balances recalculated automatically</li>
                <li>• Previous charges are reversed</li>
                <li>• New charges applied based on updates</li>
                <li>• Session history is preserved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}