'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { UpcomingSessionCard, UpcomingSessionsEmptyState, type UpcomingSession } from '@/components/business/UpcomingSessionCard'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { sessionService } from '@/lib/services/sessions'
import { cn } from '@/lib/utils/cn'

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled'

export default function UpcomingSessionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessions, setSessions] = useState<UpcomingSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('upcoming')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Check for success message
  const created = searchParams.get('created')

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading, router])

  const loadSessions = useCallback(async () => {
    if (!user?.id || initialLoadComplete) return // Prevent reloading
    
    setSessionsLoading(true)
    try {
      console.log('📋 Fetching sessions from database for organizer:', user.id)
      
      // Fetch all sessions from the database
      const allSessions = await sessionService.getSessionsByOrganizer(user.id)
      
      console.log(`✅ Loaded ${allSessions.length} sessions from database`)
      
      // Transform database sessions to UI format
      const transformedSessions: UpcomingSession[] = allSessions.map(session => ({
        id: session.id,
        title: session.notes ? `${session.location} - ${session.notes}` : session.location || 'Badminton Session',
        sessionDate: session.session_date,
        startTime: session.start_time || '',
        endTime: session.end_time || '',
        location: session.location || 'TBD',
        expectedPlayers: session.player_count,
        actualPlayers: session.status === 'completed' ? session.player_count : undefined,
        notes: session.notes || '',
        status: session.status as 'planned' | 'completed' | 'cancelled',
        createdAt: session.created_at,
        updatedAt: session.updated_at || undefined
      }))
      
      setSessions(transformedSessions)
      console.log('📊 Sessions loaded and transformed:', transformedSessions)
      
    } catch (error: any) {
      console.error('Error loading sessions:', error)
      // Show user-friendly error but don't break the UI
      setSessions([])
    } finally {
      setSessionsLoading(false)
      setInitialLoadComplete(true)
    }
  }, [user?.id, initialLoadComplete])

  // Load sessions
  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user, loadSessions])

  // Show loading while checking auth or loading sessions
  if (loading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading sessions...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Simple filtering without complex memoization
  const now = new Date()
  console.log('🚀 UPCOMING SESSIONS DEBUG START')
  console.log('🕐 Current time for filtering:', now.toISOString())
  console.log('📊 Total sessions loaded:', sessions.length)
  console.log('🔍 Current filter:', filter)
  
  console.log('📋 All sessions before filtering:', sessions.map(s => {
    const endTime = s.endTime || '23:59:00'
    const dateTimeString = `${s.sessionDate}T${endTime}`
    const sessionDateTime = new Date(dateTimeString)
    
    console.log(`Session ${s.id}: status=${s.status}, date=${s.sessionDate}, endTime=${s.endTime}`)
    
    return {
      id: s.id, 
      status: s.status, 
      date: s.sessionDate, 
      endTime: s.endTime,
      dateTimeString,
      sessionDateTime: isNaN(sessionDateTime.getTime()) ? 'Invalid Date' : sessionDateTime.toISOString()
    }
  }))
  
  const filteredSessions = sessions.filter(session => {
    console.log(`🔍 Filtering session ${session.id}: status=${session.status}, date=${session.sessionDate}, endTime=${session.endTime}`)
    
    switch (filter) {
      case 'upcoming':
        // Handle missing endTime by using end of day
        const endTime = session.endTime || '23:59:00'
        // Create proper ISO datetime string - endTime already includes seconds
        const sessionDate = new Date(`${session.sessionDate}T${endTime}`)
        
        // Skip sessions with invalid dates for upcoming filter
        if (isNaN(sessionDate.getTime())) {
          console.log(`❌ Skipping session ${session.id} from upcoming due to invalid date: ${session.sessionDate}T${endTime}`)
          return false
        }
        
        const isUpcoming = session.status === 'planned' && sessionDate > now
        console.log(`✅ Session ${session.id} upcoming check: ${isUpcoming}`)
        
        return isUpcoming
        
      case 'past':
        const pastEndTime = session.endTime || '23:59:00'
        const pastSessionDate = new Date(`${session.sessionDate}T${pastEndTime}`)
        
        // Skip sessions with invalid dates for past filter
        if (isNaN(pastSessionDate.getTime())) {
          console.log(`❌ Skipping session ${session.id} from past due to invalid date`)
          return false
        }
        
        return pastSessionDate < now || session.status === 'completed'
        
      case 'cancelled':
        return session.status === 'cancelled'
        
      case 'all':
      default:
        // Show ALL sessions, even with invalid dates, for debugging
        console.log(`📋 Including session ${session.id} in 'all' tab`)
        return true
    }
  }).sort((a, b) => {
    const dateA = new Date(`${a.sessionDate}T${a.startTime || '00:00'}:00`)
    const dateB = new Date(`${b.sessionDate}T${b.startTime || '00:00'}:00`)
    
    // Handle invalid dates in sorting
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return 0 // Keep original order if dates are invalid
    }
    
    return dateA.getTime() - dateB.getTime()
  })
  
  console.log('📊 Filtered sessions for current filter:', filter, filteredSessions.length)
  console.log('🏁 UPCOMING SESSIONS DEBUG END')

  // Simple tab counts with date validation
  const tabCounts = {
    upcoming: sessions.filter(s => {
      const sessionDate = new Date(`${s.sessionDate}T${s.endTime || '23:59:00'}`)
      return s.status === 'planned' && !isNaN(sessionDate.getTime()) && sessionDate > now
    }).length,
    past: sessions.filter(s => {
      const sessionDate = new Date(`${s.sessionDate}T${s.endTime || '23:59:00'}`)
      return (!isNaN(sessionDate.getTime()) && sessionDate < now) || s.status === 'completed'
    }).length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
    all: sessions.length
  }

  // Session actions
  const handleEditSession = (session: UpcomingSession) => {
    console.log('Edit session:', session.id)
    // TODO: Navigate to edit session page
    window.location.href = `/create-session?edit=${session.id}`
  }

  const handleCancelSession = async (session: UpcomingSession) => {
    if (!confirm('Are you sure you want to cancel this session?')) return
    
    setActionLoading(session.id)
    try {
      console.log('❌ Cancelling session:', session.id)
      
      // Update session status to cancelled in database
      await sessionService.updateSession(session.id, { 
        status: 'cancelled',
        notes: `${session.notes || ''  } (Cancelled by organizer)`
      })
      
      console.log('✅ Session cancelled successfully')
      
      // Update local state
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, status: 'cancelled' as const, notes: `${s.notes || ''  } (Cancelled by organizer)` }
          : s
      ))
    } catch (error: any) {
      console.error('Error cancelling session:', error)
      alert(`Failed to cancel session: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleConvertSession = (session: UpcomingSession) => {
    console.log('Convert session to completed:', session.id)
    console.log('📋 Session data for conversion:', {
      id: session.id,
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      notes: session.notes
    })
    
    // Navigate to record session with pre-filled data
    const params = new URLSearchParams({
      fromPlanned: session.id,
      date: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      notes: session.notes || ''
    })
    
    console.log('🔗 Generated URL params:', params.toString())
    window.location.href = `/record-session?${params.toString()}`
  }

  const handleViewSession = (session: UpcomingSession) => {
    console.log('View session details:', session.id)
    // Navigate to dedicated session details page
    window.location.href = `/session-details?id=${session.id}`
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
          background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent)'
        }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)',
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(99, 102, 241, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-2xl lg:text-3xl filter drop-shadow-lg">📋</span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Session Management
                </h1>
                <p className="mt-1 flex items-center space-x-2 text-sm lg:text-base" style={{ color: '#6b7280' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #3b82f6, #6366f1)'
                  }}></span>
                  <span>Manage your planned and completed badminton sessions</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => window.location.href = '/create-session'}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #4f46e5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #6366f1)'
                }}
              >
                <span className="mr-2">➕</span>
                Plan Session
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
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
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Success Message */}
        {created && (
          <div className="relative overflow-hidden" style={{ borderRadius: '20px' }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-sm" style={{
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '20px'
            }}></div>
            <div className="relative p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.2)'
                }}>
                  <span>✅</span>
                </div>
                <div className="flex-1">
                  <span className="font-medium" style={{ color: '#15803d' }}>Session planned successfully!</span>
                  <p className="mt-1 text-sm" style={{ color: '#166534' }}>Your session has been added and players can now see it in their upcoming games.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Filter Tabs */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(59, 130, 246, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl translate-x-24 -translate-y-24" style={{
            background: 'linear-gradient(to bottom left, rgba(34, 197, 94, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(59, 130, 246, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center space-x-2" style={{
              background: 'linear-gradient(to right, #22c55e, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              <span>🎯</span>
              <span>Filter Sessions</span>
            </h2>
            <div className="text-sm" style={{ color: '#6b7280' }}>
              {filteredSessions.length} of {sessions.length} sessions
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'upcoming', label: 'Upcoming', icon: '📅', count: tabCounts.upcoming },
              { key: 'past', label: 'Past', icon: '🏸', count: tabCounts.past },
              { key: 'cancelled', label: 'Cancelled', icon: '❌', count: tabCounts.cancelled },
              { key: 'all', label: 'All', icon: '📋', count: tabCounts.all }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as FilterType)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5',
                  filter === tab.key
                    ? 'text-white shadow-md transform scale-105'
                    : 'text-gray-700 border border-white/30 hover:shadow-sm'
                )}
                style={filter === tab.key ? {
                  background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                } : {
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (filter !== tab.key) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== tab.key) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold',
                  filter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Premium Sessions List */}
        <div className="space-y-6">
          {sessionsLoading ? (
            // Premium Loading State
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="relative overflow-hidden animate-pulse" style={{ 
                  borderRadius: '20px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  transform: 'translateZ(0)'
                }}>
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.08) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(107, 114, 128, 0.08) 100%)',
                    borderRadius: '20px'
                  }}></div>
                  <div className="absolute inset-0 backdrop-blur-md" style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px'
                  }}></div>
                  <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                    <div className="h-4 bg-gray-200 rounded w-36"></div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            // Premium Empty State
            <div className="relative overflow-hidden" style={{ 
              borderRadius: '24px',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.15)',
              transform: 'translateZ(0)'
            }}>
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.08) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(107, 114, 128, 0.08) 100%)',
                borderRadius: '24px'
              }}></div>
              <div className="absolute inset-0 backdrop-blur-xl" style={{
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '24px'
              }}></div>
              <div className="relative">
              <UpcomingSessionsEmptyState
                type={filter === 'upcoming' ? 'upcoming' : filter === 'past' ? 'completed' : 'all'}
                onCreateSession={() => window.location.href = '/create-session'}
              />
              </div>
            </div>
          ) : (
            // Sessions Grid
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSessions.map(session => (
                <UpcomingSessionCard
                  key={session.id}
                  session={session}
                  showOrganizerActions={true}
                  loading={actionLoading === session.id}
                  onEdit={handleEditSession}
                  onCancel={handleCancelSession}
                  onConvert={handleConvertSession}
                  onView={handleViewSession}
                />
              ))}
            </div>
          )}
        </div>

        {/* Premium Quick Actions */}
        {!sessionsLoading && filteredSessions.length > 0 && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '24px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(249, 115, 22, 0.12) 100%)',
              borderRadius: '24px'
            }}></div>
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full blur-3xl translate-x-28 translate-y-28" style={{
              background: 'linear-gradient(to top left, rgba(245, 158, 11, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(249, 115, 22, 0.05) 100%)',
              borderRadius: '24px'
            }}></div>
            
            <div className="relative p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center space-x-2" style={{
              background: 'linear-gradient(to right, #f59e0b, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              <span>⚡</span>
              <span>Quick Actions</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.location.href = '/create-session'}
                className="relative overflow-hidden p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08))'
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))'
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{
                    background: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)'
                  }}>
                    <span className="text-white text-sm">➕</span>
                  </div>
                  <span className="font-medium" style={{ color: '#1e40af' }}>Plan Another Session</span>
                </div>
                <p className="text-sm" style={{ color: '#1e3a8a' }}>Schedule more sessions for your group</p>
              </button>

              <button
                onClick={() => window.location.href = '/record-session'}
                className="relative overflow-hidden p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.08))'
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))'
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)'
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
                <p className="text-sm" style={{ color: '#9a3412' }}>Log a completed session</p>
              </button>

              <button
                onClick={() => window.location.href = '/players'}
                className="relative overflow-hidden p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08))'
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))'
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)'
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
                <p className="text-sm" style={{ color: '#166534' }}>View player balances and details</p>
              </button>
            </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </RoleGuard>
  )
}