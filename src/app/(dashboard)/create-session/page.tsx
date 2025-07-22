'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { CreateSessionForm, type CreateSessionFormData } from '@/components/business/CreateSessionForm'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { sessionService } from '@/lib/services/sessions'
import type { Session } from '@/lib/supabase/types'

export default function CreateSessionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  
  // Edit mode state
  const editSessionId = searchParams.get('edit')
  const isEditMode = !!editSessionId
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [loadingSession, setLoadingSession] = useState(isEditMode)

  // Memoize form data to prevent infinite re-renders - MUST be at top with other hooks
  const formData = useMemo(() => {
    if (!editSession) return undefined;
    
    return {
      title: editSession.title || '',
      sessionDate: editSession.session_date,
      startTime: editSession.start_time ? editSession.start_time.substring(0, 5) : '07:00', // Remove seconds
      endTime: editSession.end_time ? editSession.end_time.substring(0, 5) : '09:00', // Remove seconds
      location: editSession.location || '',
      notes: editSession.notes || '',
      selectedPlayerIds: editSession.expectedPlayerIds || [],
      temporaryPlayers: [] // TODO: Parse from notes if needed
    };
  }, [editSession?.id, editSession?.title, editSession?.session_date, editSession?.start_time, editSession?.end_time, editSession?.location, editSession?.notes, editSession?.expectedPlayerIds])

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading, router])

  // Load session data for editing
  useEffect(() => {
    const loadSession = async () => {
      if (!isEditMode || !editSessionId || !user?.id) {
        setLoadingSession(false)
        return
      }

      try {
        console.log('📋 Loading session for editing:', editSessionId)
        setLoadingSession(true)
        
        // Get the session to edit
        const sessions = await sessionService.getSessionsByOrganizer(user.id)
        const sessionToEdit = sessions.find(s => s.id === editSessionId)
        
        if (!sessionToEdit) {
          setFormError('Session not found or you do not have permission to edit it')
          setLoadingSession(false)
          return
        }

        if (sessionToEdit.status !== 'planned') {
          setFormError('Only planned sessions can be edited')
          setLoadingSession(false)
          return
        }

        console.log('✅ Session loaded for editing:', sessionToEdit)
        
        // Load expected participants for this planned session
        const { createClientSupabaseClient } = await import('@/lib/supabase/client')
        const supabase = createClientSupabaseClient()
        
        const { data: expectedParticipants } = await supabase
          .from('session_participants')
          .select('player_id')
          .eq('session_id', sessionToEdit.id)
          .is('amount_owed', null) // Expected participants have null amount_owed
        
        // Add expected participants to session data
        sessionToEdit.expectedPlayerIds = expectedParticipants?.map(p => p.player_id) || []
        
        setEditSession(sessionToEdit)
        
      } catch (error: any) {
        console.error('❌ Error loading session for editing:', error)
        setFormError(`Failed to load session: ${error.message}`)
      } finally {
        setLoadingSession(false)
      }
    }

    loadSession()
  }, [isEditMode, editSessionId, user?.id])

  // Show loading while checking auth or loading session
  if (loading || loadingSession) {
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
            <span className="text-4xl filter drop-shadow-lg">📅</span>
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
                {loadingSession ? 'Loading Session Data' : 'Loading Session Planner'}
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                {loadingSession ? 'Preparing session for editing...' : 'Setting up session creation interface...'}
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

  const handleSubmit = async (data: CreateSessionFormData) => {
    setFormError('')
    setSubmitSuccess(null)
    setSubmitting(true)

    try {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      if (isEditMode && editSession) {
        // Update existing session
        console.log('Updating planned session:', editSession.id, data)
        
        // Calculate total expected players
        const totalExpectedPlayers = data.selectedPlayerIds.length + data.temporaryPlayers.length
        
        await sessionService.updateSession(editSession.id, {
          title: data.title || null,
          session_date: data.sessionDate,
          start_time: data.startTime || null,
          end_time: data.endTime || null,
          location: data.location,
          notes: data.notes || null,
          player_count: totalExpectedPlayers, // Use actual selected players count
        })
        
        // Update expected participants for planned sessions
        const { createClientSupabaseClient } = await import('@/lib/supabase/client')
        const supabase = createClientSupabaseClient()
        
        // Remove existing expected participants (amount_owed IS NULL)
        await supabase
          .from('session_participants')
          .delete()
          .eq('session_id', editSession.id)
          .is('amount_owed', null)
        
        // Insert new expected participants
        if (data.selectedPlayerIds.length > 0) {
          const expectedParticipants = data.selectedPlayerIds.map(playerId => ({
            session_id: editSession.id,
            player_id: playerId,
            amount_owed: null // null indicates this is expected, not actual participant
          }))
          
          await supabase.from('session_participants').insert(expectedParticipants)
        }

        console.log('✅ Planned session updated successfully')
        const sessionTitle = data.title || `Session - ${new Date(data.sessionDate).toLocaleDateString()}`
        setSubmitSuccess(`Session "${sessionTitle}" has been updated successfully!`)
        
      } else {
        // Create new planned session
        console.log('Creating planned session:', data)
        
        // Calculate total expected players
        const totalExpectedPlayers = data.selectedPlayerIds.length + data.temporaryPlayers.length
        
        // Transform form data to match database schema
        const sessionServiceData = {
          organizer_id: user.id,
          title: data.title || null,
          session_date: data.sessionDate,
          start_time: data.startTime || null,
          end_time: data.endTime || null,
          location: data.location,
          notes: data.notes || null,
          status: 'planned' as const,
          // For planned sessions, costs are 0 until session is completed
          court_cost: 0,
          shuttlecock_cost: 0,
          other_costs: 0,
          player_count: totalExpectedPlayers, // Use actual selected players count
        }
        
        // Create planned session using the service
        const createdSession = await sessionService.createSession(sessionServiceData)
        
        // Store expected participants for planned sessions
        if (data.selectedPlayerIds.length > 0) {
          const { createClientSupabaseClient } = await import('@/lib/supabase/client')
          const supabase = createClientSupabaseClient()
          
          // Insert expected participants (amount_owed = null for planned sessions)
          const expectedParticipants = data.selectedPlayerIds.map(playerId => ({
            session_id: createdSession.id,
            player_id: playerId,
            amount_owed: null // null indicates this is expected, not actual participant
          }))
          
          await supabase.from('session_participants').insert(expectedParticipants)
        }
        
        // Store temporary players in notes if any (since we can't store them in participants table)
        if (data.temporaryPlayers.length > 0) {
          const tempPlayersNote = `\n\nExpected drop-in players: ${data.temporaryPlayers.map(p => p.name).join(', ')}`
          await sessionService.updateSession(createdSession.id, {
            notes: (data.notes || '') + tempPlayersNote
          })
        }
        console.log('✅ Planned session created successfully:', createdSession)
        
        // Success
        const sessionTitle = data.title || `Session - ${new Date(data.sessionDate).toLocaleDateString()}`
        setSubmitSuccess(`Planned session "${sessionTitle}" has been created successfully! Players can now see it in their upcoming sessions.`)
      }
      
      // Redirect to upcoming sessions after showing success message
      setTimeout(() => {
        window.location.href = '/upcoming-sessions?created=true'
      }, 2000)
      
    } catch (error: any) {
      console.error('Error creating session:', error)
      setFormError(error.message || 'Failed to create session. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
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
                <span className="text-2xl lg:text-3xl filter drop-shadow-lg">📅</span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {isEditMode ? 'Edit Session' : 'Plan New Session'}
                </h1>
                <p className="mt-1 flex items-center space-x-2 text-sm lg:text-base" style={{ color: '#6b7280' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #7c3aed, #22c55e)'
                  }}></span>
                  <span>
                    {isEditMode 
                      ? 'Update the details of your planned session'
                      : 'Schedule an upcoming badminton session for your group'
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

        {/* Premium Success Message */}
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
                  <span className="font-medium" style={{ color: '#15803d' }}>Session planned successfully!</span>
                  <p className="mt-1 text-sm" style={{ color: '#166534' }}>{submitSuccess}</p>
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
            <CreateSessionForm
              key={editSession ? `edit-${editSession.id}` : 'create'} // Force re-render when switching modes
              data={formData}
              loading={submitting}
              error={formError}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isEditMode={isEditMode}
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl -translate-x-16 -translate-y-16" style={{
            background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.08), transparent)'
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
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{
                background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))'
              }}>
                <span className="text-lg">💡</span>
              </div>
              <h3 className="text-lg font-semibold" style={{
                background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Session Planning Tips</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium" style={{ color: '#1d4ed8' }}>Best Practices</h4>
                <ul className="text-sm space-y-2" style={{ color: '#1e3a8a' }}>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>Plan sessions 2-7 days in advance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>Popular times: 7-9 AM, 7-9 PM</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>Include location details in notes</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>Set realistic player expectations</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium" style={{ color: '#1d4ed8' }}>What Happens Next</h4>
                <ul className="text-sm space-y-2" style={{ color: '#1e3a8a' }}>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>Players will see this in upcoming sessions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>You can edit or cancel before session date</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>Convert to completed session after playing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>Costs calculated only when completed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Quick Actions */}
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
          
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-lg">⚡</span>
              </div>
              <h3 className="text-lg font-semibold" style={{
                background: 'linear-gradient(to right, #7c3aed, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Quick Actions</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.location.href = '/upcoming-sessions'}
                className="relative overflow-hidden p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))'
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{
                    background: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)'
                  }}>
                    <span className="text-white text-sm">📋</span>
                  </div>
                  <span className="font-medium" style={{ color: '#1e40af' }}>View Upcoming</span>
                </div>
                <p className="text-sm" style={{ color: '#1e3a8a' }}>See all planned sessions</p>
              </button>

              <button
                onClick={() => window.location.href = '/record-session'}
                className="relative overflow-hidden p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.08))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))'
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{
                    background: 'linear-gradient(to bottom right, #f59e0b, #d97706)'
                  }}>
                    <span className="text-white text-sm">🏸</span>
                  </div>
                  <span className="font-medium" style={{ color: '#c2410c' }}>Record Session</span>
                </div>
                <p className="text-sm" style={{ color: '#9a3412' }}>Log completed session</p>
              </button>

              <button
                onClick={() => window.location.href = '/players'}
                className="relative overflow-hidden p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))'
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{
                    background: 'linear-gradient(to bottom right, #22c55e, #16a34a)'
                  }}>
                    <span className="text-white text-sm">👥</span>
                  </div>
                  <span className="font-medium" style={{ color: '#15803d' }}>Manage Players</span>
                </div>
                <p className="text-sm" style={{ color: '#166534' }}>View player balances</p>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </RoleGuard>
  )
}