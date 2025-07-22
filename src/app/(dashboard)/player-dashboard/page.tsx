'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { money } from '@/lib/calculations/money'
import { balanceService } from '@/lib/services/balances'
import { sessionService } from '@/lib/services/sessions'
import { cn } from '@/lib/utils/cn'

interface PlayerSession {
  id: string
  date: string
  location: string
  duration: number
  shuttlecocksUsed: number
  totalCost: number
  costPerPlayer: number
  playerCount: number
  status: 'unpaid' | 'paid'
}

interface PlayerPayment {
  id: string
  date: string
  amount: number
  method: string
  reference?: string
  status: 'confirmed' | 'pending'
}

export default function PlayerDashboardPage() {
  const { user, userProfile, loading, signOut } = useAuth()
  const router = useRouter()
  
  // State variables
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null)
  const [viewingPlayerName, setViewingPlayerName] = useState<string>('')
  const [organizerId, setOrganizerId] = useState<string | null>(null)
  const [isOrganizerView, setIsOrganizerView] = useState(false)
  const [activeTab, setActiveTab] = useState<'sessions' | 'payments'>('sessions')
  const [dataLoading, setDataLoading] = useState(true)
  const [playerBalance, setPlayerBalance] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalOwed, setTotalOwed] = useState(0)
  const [sessions, setSessions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check if organizer is viewing another player's dashboard
  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile) {
      const params = new URLSearchParams(window.location.search)
      const playerId = params.get('playerId')
      if (playerId && userProfile.role === 'organizer') {
        setViewingPlayerId(playerId)
        setOrganizerId(user?.id || null)
        setIsOrganizerView(true)
      } else if (userProfile.role === 'player' && userProfile.phone_number) {
        findPlayerRecord()
      }
    }
  }, [userProfile, user?.id])

  // Function to find player record for logged-in players
  const findPlayerRecord = async () => {
    if (!userProfile?.phone_number) {
      console.log('🔍 No phone number available for player lookup')
      return
    }
    
    console.log('🔍 Finding player record for phone:', userProfile.phone_number)
    
    try {
      setDataLoading(true)
      setError(null)
      
      const { createClientSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createClientSupabaseClient()
      
      const { data: playerData, error } = await supabase
        .rpc('get_player_by_user_phone')
      
      if (error) {
        console.log('❌ Database function error:', error)
        setError(`Database error: ${error.message}`)
        setDataLoading(false)
        return
      }
      
      if (playerData && playerData.length > 0) {
        const player = playerData[0]
        console.log('✅ Found player record:', player)
        setViewingPlayerId(player.player_id)
        setViewingPlayerName(player.player_name)
        setOrganizerId(player.organizer_id)
        setIsOrganizerView(false)
      } else {
        console.log('❌ No player record found')
        setError('Player record not found. Please contact your organizer.')
        setDataLoading(false)
      }
    } catch (err) {
      console.error('Error finding player record:', err)
      setError('Failed to load player data.')
      setDataLoading(false)
    }
  }

  // Load player data when viewingPlayerId is set
  useEffect(() => {
    const loadPlayerData = async () => {
      if (!viewingPlayerId || !organizerId) return
      
      try {
        console.log('📊 Loading player data for player ID:', viewingPlayerId)
        console.log('📊 Loading player data for organizer ID:', organizerId)
        setDataLoading(true)
        setError(null)
        
        // Load player balance using the organizer ID
        const balance = await balanceService.getPlayerBalance(organizerId, viewingPlayerId)
        console.log('💰 Player balance:', balance)
        setPlayerBalance(balance.current_balance || 0)
        setTotalPaid(balance.total_paid || 0)
        setTotalOwed(balance.total_owed || 0)
        
        // Get player name from balance data
        if (balance.player?.name) {
          setViewingPlayerName(balance.player.name)
        }
        
        // Load player sessions using direct database query
        const { createClientSupabaseClient } = await import('@/lib/supabase/client')
        const supabase = createClientSupabaseClient()
        
        // Get completed sessions for this player (filtered by organizer)
        console.log('🔍 Querying sessions for player:', viewingPlayerId, 'organizer:', organizerId)
        const { data: sessionData, error: sessionError } = await supabase
          .from('session_participants')
          .select(`
            *,
            session:sessions!inner(*)
          `)
          .eq('player_id', viewingPlayerId)
          .eq('session.status', 'completed')
          .eq('session.organizer_id', organizerId)
          .order('created_at', { ascending: false })
        
        console.log('🏸 Session query result:', { sessionData, sessionError, count: sessionData?.length })
        
        if (sessionError) {
          console.error('❌ Error loading player sessions:', sessionError)
        } else {
          console.log('🏸 Player sessions:', sessionData)
          setSessions(sessionData || [])
          setTotalSessions(sessionData?.length || 0)
        }
        
        // Load player payments (filtered by organizer)
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('player_id', viewingPlayerId)
          .eq('organizer_id', organizerId)
          .order('payment_date', { ascending: false })
        
        if (paymentError) {
          console.error('❌ Error loading player payments:', paymentError)
        } else {
          console.log('💳 Player payments:', paymentData)
          setPayments(paymentData || [])
        }
        
        // Load upcoming sessions
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('sessions')
          .select('*')
          .eq('organizer_id', organizerId)
          .eq('status', 'planned')
          .gte('session_date', new Date().toISOString().split('T')[0])
          .order('session_date', { ascending: true })
        
        if (upcomingError) {
          console.error('❌ Error loading upcoming sessions:', upcomingError)
        } else {
          console.log('📅 Upcoming sessions:', upcomingData)
          setUpcomingSessions(upcomingData || [])
        }
        
        console.log('✅ Player data loaded successfully')
        
      } catch (err: any) {
        console.error('❌ Error loading player data:', err)
        setError(err.message || 'Failed to load player data')
      } finally {
        setDataLoading(false)
      }
    }
    
    loadPlayerData()
  }, [viewingPlayerId, organizerId])

  // Check authentication and role - also show loading during data fetch
  if (loading || (userProfile && dataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
      }}>
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
            <span className="text-4xl filter drop-shadow-lg">👤</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'rgba(124, 58, 237, 0.2)' }}></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: '#7c3aed' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold" style={{
                background: 'linear-gradient(to right, #7c3aed, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Loading Player Dashboard
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                {dataLoading ? 'Loading player data...' : 'Preparing your badminton data...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Redirect unauthenticated users
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  // Check if user has valid role
  if (userProfile?.role && !['player', 'organizer'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.03), #ffffff, rgba(245, 158, 11, 0.03))'
      }}>
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
              Invalid user role for player dashboard access.
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
      
      <div className="relative z-10 max-w-6xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
        {/* Premium Modern Header */}
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
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              {/* Left Section - Welcome & Player Info */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                    background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <span className="text-3xl filter drop-shadow-lg">👤</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg" style={{
                    background: 'linear-gradient(to bottom right, #22c55e, #16a34a)'
                  }}>
                    <span className="text-xs text-white">✓</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold leading-tight" style={{
                    background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Welcome back{viewingPlayerName ? `, ${viewingPlayerName}!` : ', Player!'}
                  </h1>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full animate-pulse shadow-sm" style={{
                        background: 'linear-gradient(to right, #22c55e, #16a34a)'
                      }}></div>
                      <span className="font-medium" style={{ color: '#6b7280' }}>Dashboard Active</span>
                    </div>
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#9ca3af' }}></div>
                    <span style={{ color: '#6b7280' }}>Badminton Activity Hub</span>
                  </div>
                </div>
              </div>
              
              {/* Right Section - Actions */}
              <div className="flex items-center space-x-4">
                {isOrganizerView ? (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/players'}
                    className="font-bold text-base transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))',
                      color: '#7c3aed',
                      borderColor: 'rgba(124, 58, 237, 0.2)'
                    }}
                  >
                    <span className="mr-2">←</span>
                    Back to Players
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        await signOut()
                        window.location.href = '/login'
                      } catch (error) {
                        console.error('Sign out error:', error)
                        window.location.href = '/login'
                      }
                    }}
                    className="font-bold text-base transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    <span className="mr-2">👋</span>
                    Sign out
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl translate-x-24 -translate-y-24" style={{
            background: 'linear-gradient(to bottom left, rgba(59, 130, 246, 0.08), transparent)'
          }}></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl -translate-x-20 translate-y-20" style={{
            background: 'linear-gradient(to top right, rgba(34, 197, 94, 0.08), transparent)'
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
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-2xl">📅</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold" style={{
                    background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Upcoming Sessions
                  </h2>
                  <p className="font-medium" style={{ color: '#6b7280' }}>Sessions planned for your group</p>
                </div>
              </div>
              
              <div className="backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg" style={{
                background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #22c55e, #16a34a)'
                  }}></div>
                  <span className="text-sm font-medium" style={{ color: '#6b7280' }}>{upcomingSessions.length} planned</span>
                </div>
              </div>
            </div>
            
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="text-gray-600 text-3xl mb-2">📅</div>
                <p className="text-gray-900 font-medium">No upcoming sessions</p>
                <p className="text-sm text-gray-700">Check back later for newly planned sessions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map(session => (
                  <div key={session.id} className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-bold text-blue-900">{session.title}</p>
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                            PLANNED
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-blue-800 font-medium flex items-center space-x-1">
                            <span>📅</span>
                            <span>{new Date(`${session.session_date  }T00:00:00`).toLocaleDateString('en-SG', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                          </p>
                          <p className="text-blue-700 text-sm flex items-center space-x-1">
                            <span>🕐</span>
                            <span>{session.start_time} - {session.end_time}</span>
                          </p>
                          <p className="text-blue-700 text-sm flex items-center space-x-1">
                            <span>📍</span>
                            <span>{session.location}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-800 text-sm">
                          <span className="font-medium">Expected:</span>
                        </div>
                        <div className="text-blue-900 font-bold">
                          {session.player_count === 0 ? 'TBD' : session.player_count} players
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Cost TBD
                        </div>
                      </div>
                    </div>
                    
                    {session.notes && (
                      <div className="mt-3 p-3 bg-blue-100/50 rounded-lg">
                        <p className="text-blue-800 text-sm flex items-start space-x-2">
                          <span className="flex-shrink-0">📝</span>
                          <span>{session.notes}</span>
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between text-xs text-blue-600">
                        <span>💡 Costs will be calculated after session completion</span>
                        <span>
                          Planned {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial Overview */}
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
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl translate-x-32 translate-y-32" style={{
            background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.08), transparent)'
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
          
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl" style={{
                  background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.3), rgba(34, 197, 94, 0.3))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-3xl filter drop-shadow-lg">💰</span>
                </div>
                <div>
                  <h2 className="text-4xl font-bold leading-tight" style={{
                    background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Financial Overview
                  </h2>
                  <p className="text-lg font-medium" style={{ color: '#6b7280' }}>Your badminton financial summary</p>
                </div>
              </div>
              
              <div className="backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl" style={{
                background: 'linear-gradient(to right, rgba(124, 58, 237, 0.15), rgba(124, 58, 237, 0.1))',
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #7c3aed, #6d28d9)'
                  }}></div>
                  <span className="text-sm font-bold" style={{ color: '#7c3aed' }}>
                    Financial Summary
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Current Balance Card */}
              <div className="relative overflow-hidden" style={{ 
                borderRadius: '20px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                transform: 'translateZ(0)'
              }}>
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(124, 58, 237, 0.05) 100%)',
                  borderRadius: '20px'
                }}></div>
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl translate-x-8 -translate-y-8" style={{
                  background: 'linear-gradient(to bottom left, rgba(124, 58, 237, 0.08), transparent)'
                }}></div>
                <div className="absolute inset-0 backdrop-blur-xl" style={{
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
                }}></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 50%, rgba(124, 58, 237, 0.03) 100%)',
                  borderRadius: '20px'
                }}></div>
                <div className="relative p-6 text-center">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1))',
                    border: '1px solid rgba(124, 58, 237, 0.3)'
                  }}>
                    <span className="text-xl">💳</span>
                  </div>
                  <p className="text-sm font-medium mb-3" style={{ color: '#6b7280' }}>Current Balance</p>
                  <MoneyDisplay 
                    value={playerBalance} 
                    size="2xl" 
                    className="font-bold" 
                    colorScheme={playerBalance > 0 ? 'danger' : 'success'} 
                  />
                  <p className="text-xs mt-2 font-medium" style={{ color: '#6b7280' }}>
                    {playerBalance > 0 ? 'Amount you owe' : 'Credit balance'}
                  </p>
                </div>
              </div>
              
              {/* Sessions Card */}
              <div className="relative overflow-hidden" style={{ 
                borderRadius: '20px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                transform: 'translateZ(0)'
              }}>
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.05) 100%)',
                  borderRadius: '20px'
                }}></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full blur-xl -translate-x-8 translate-y-8" style={{
                  background: 'linear-gradient(to top right, rgba(34, 197, 94, 0.08), transparent)'
                }}></div>
                <div className="absolute inset-0 backdrop-blur-xl" style={{
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
                }}></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.03) 100%)',
                  borderRadius: '20px'
                }}></div>
                <div className="relative p-6 text-center">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <span className="text-xl">🏸</span>
                  </div>
                  <p className="text-sm font-medium mb-3" style={{ color: '#6b7280' }}>Sessions</p>
                  <div className="text-4xl font-bold" style={{ color: '#22c55e', fontSize: '2.25rem', lineHeight: '2.5rem' }}>{totalSessions}</div>
                  <p className="text-xs mt-2 font-medium" style={{ color: '#6b7280' }}>Games completed</p>
                </div>
              </div>
              
              {/* Total Paid Card */}
              <div className="relative overflow-hidden" style={{ 
                borderRadius: '20px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                transform: 'translateZ(0)'
              }}>
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.05) 100%)',
                  borderRadius: '20px'
                }}></div>
                <div className="absolute top-0 left-0 w-16 h-16 rounded-full blur-xl -translate-x-8 -translate-y-8" style={{
                  background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.08), transparent)'
                }}></div>
                <div className="absolute inset-0 backdrop-blur-xl" style={{
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
                }}></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(245, 158, 11, 0.03) 100%)',
                  borderRadius: '20px'
                }}></div>
                <div className="relative p-6 text-center">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <span className="text-xl">✅</span>
                  </div>
                  <p className="text-sm font-medium mb-3" style={{ color: '#6b7280' }}>All Time Payments</p>
                  <MoneyDisplay 
                    value={totalPaid} 
                    size="2xl" 
                    className="font-bold" 
                    colorScheme="warning" 
                  />
                  <p className="text-xs mt-2 font-medium" style={{ color: '#6b7280' }}>Paid to organizer</p>
                </div>
              </div>
              
              {/* Outstanding Amount Card */}
              <div className="relative overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                  borderRadius: '20px'
                }}></div>
                <div className="absolute inset-0 backdrop-blur-sm shadow-lg" style={{
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '20px'
                }}></div>
                <div className="relative p-6 text-center">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <span className="text-xl">⚠️</span>
                  </div>
                  <p className="text-sm font-medium mb-3" style={{ color: '#6b7280' }}>Total Spent</p>
                  <MoneyDisplay 
                    value={totalOwed} 
                    size="2xl" 
                    className="font-bold" 
                    colorScheme="danger" 
                  />
                  <p className="text-xs mt-2 font-medium" style={{ color: '#6b7280' }}>All session costs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative overflow-hidden" style={{ borderRadius: '24px' }}>
          <div className="absolute inset-0 shadow-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px'
          }}></div>
          <div className="relative z-10">
            <div className="border-b" style={{ borderColor: 'rgba(124, 58, 237, 0.1)' }}>
              <nav className="flex space-x-8 px-6">
                {[
                  { key: 'sessions', label: 'Sessions', icon: '🏸' },
                  { key: 'payments', label: 'Payments', icon: '💰' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as 'sessions' | 'payments')}
                    className="flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-all duration-300"
                    style={{
                      borderBottomColor: activeTab === tab.key ? '#7c3aed' : 'transparent',
                      color: activeTab === tab.key ? '#7c3aed' : '#6b7280'
                    }}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {activeTab === 'sessions' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold" style={{
                      background: 'linear-gradient(to right, #7c3aed, #22c55e)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Session History
                    </h3>
                    <div className="backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg" style={{
                      background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(34, 197, 94, 0.1))',
                      border: '1px solid rgba(124, 58, 237, 0.2)'
                    }}>
                      <span className="text-sm font-medium" style={{ color: '#6b7280' }}>{sessions.length} total sessions</span>
                    </div>
                  </div>
                  
                  {sessions.length === 0 ? (
                    <div className="text-center py-12 relative overflow-hidden" style={{ borderRadius: '20px' }}>
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), rgba(255, 255, 255, 0.95), rgba(34, 197, 94, 0.05))',
                        borderRadius: '20px'
                      }}></div>
                      <div className="absolute inset-0 shadow-lg" style={{
                        border: '1px solid rgba(124, 58, 237, 0.1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '20px'
                      }}></div>
                      <div className="relative">
                        <div className="text-6xl mb-4">🏸</div>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#374151' }}>No sessions yet</h4>
                        <p style={{ color: '#6b7280' }}>Your completed badminton sessions will appear here once you join some games.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map(session => {
                        const sessionCost = session.session?.cost_per_player || session.costPerPlayer || 0
                        
                        return (
                          <div key={session.id} className="relative overflow-hidden p-6" style={{ borderRadius: '20px' }}>
                            <div className="absolute inset-0" style={{
                              background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))',
                              borderRadius: '20px'
                            }}></div>
                            <div className="absolute inset-0 shadow-lg" style={{
                              border: '1px solid rgba(124, 58, 237, 0.2)',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '20px'
                            }}></div>
                            <div className="relative">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{
                                    background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1))',
                                    border: '1px solid rgba(124, 58, 237, 0.3)'
                                  }}>
                                    <span className="text-2xl">⏳</span>
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-bold" style={{ color: '#374151' }}>
                                      {new Date(session.session?.session_date || session.session_date).toLocaleDateString('en-SG', { 
                                        weekday: 'long', 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </h4>
                                    <p className="font-medium" style={{ color: '#6b7280' }}>{session.session?.location || session.location}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <MoneyDisplay 
                                    value={sessionCost} 
                                    size="lg" 
                                    className="font-bold" 
                                    style={{ color: '#22c55e' }} 
                                  />
                                  <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                                    Your Share
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="font-medium" style={{ color: '#6b7280' }}>Time</p>
                                  <p className="font-bold" style={{ color: '#374151' }}>
                                    {session.session?.start_time && session.session?.end_time 
                                      ? `${session.session.start_time} - ${session.session.end_time}`
                                      : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium" style={{ color: '#6b7280' }}>Players</p>
                                  <p className="font-bold" style={{ color: '#374151' }}>{session.session?.player_count || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="font-medium" style={{ color: '#6b7280' }}>Location</p>
                                  <p className="font-bold" style={{ color: '#374151' }}>{session.session?.location || session.location}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold" style={{
                      background: 'linear-gradient(to right, #7c3aed, #22c55e)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Payment History
                    </h3>
                    <div className="backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg" style={{
                      background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(34, 197, 94, 0.1))',
                      border: '1px solid rgba(124, 58, 237, 0.2)'
                    }}>
                      <span className="text-sm font-medium" style={{ color: '#6b7280' }}>{payments.length} total payments</span>
                    </div>
                  </div>
                  
                  {payments.length === 0 ? (
                    <div className="text-center py-12 relative overflow-hidden" style={{ borderRadius: '20px' }}>
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), rgba(255, 255, 255, 0.95), rgba(34, 197, 94, 0.05))',
                        borderRadius: '20px'
                      }}></div>
                      <div className="absolute inset-0 shadow-lg" style={{
                        border: '1px solid rgba(124, 58, 237, 0.1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '20px'
                      }}></div>
                      <div className="relative">
                        <div className="text-6xl mb-4">💰</div>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#374151' }}>No payments yet</h4>
                        <p style={{ color: '#6b7280' }}>Your payment history will appear here once you make payments.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map(payment => (
                        <div key={payment.id} className="relative overflow-hidden p-6" style={{ borderRadius: '20px' }}>
                          <div className="absolute inset-0" style={{
                            background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                            borderRadius: '20px'
                          }}></div>
                          <div className="absolute inset-0 shadow-lg" style={{
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '20px'
                          }}></div>
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{
                                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
                                  border: '1px solid rgba(34, 197, 94, 0.3)'
                                }}>
                                  <span className="text-2xl">💸</span>
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold" style={{ color: '#374151' }}>
                                    {new Date(payment.payment_date).toLocaleDateString('en-SG', { 
                                      weekday: 'long', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </h4>
                                  <p className="font-medium" style={{ color: '#6b7280' }}>{payment.payment_method}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <MoneyDisplay 
                                  value={payment.amount} 
                                  size="lg" 
                                  className="font-bold" 
                                  style={{ color: '#22c55e' }} 
                                />
                                <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                                  Payment Made
                                </p>
                              </div>
                            </div>
                            
                            {payment.reference && (
                              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                <p className="text-green-800 text-sm">
                                  <span className="font-medium">Reference:</span> {payment.reference}
                                </p>
                              </div>
                            )}
                            
                            {payment.notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-blue-800 text-sm">
                                  <span className="font-medium">Notes:</span> {payment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}