'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

import { CreditTransferModal } from '@/components/business/CreditTransferModal'
import { PlayerManagementTable, type Player } from '@/components/business/PlayerManagementTable'
import { PlayerPaymentHistoryModal } from '@/components/business/PlayerPaymentHistoryModal'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { money } from '@/lib/calculations/money'
import { balanceService } from '@/lib/services/balances'
import { paymentService } from '@/lib/services/payments'
import { playerService } from '@/lib/services/players'
import { cn } from '@/lib/utils/cn'

export default function PlayersPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'debt' | 'credit' | 'settled'>('active')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [showCreditTransferModal, setShowCreditTransferModal] = useState(false)
  const [selectedPlayerForTransfer, setSelectedPlayerForTransfer] = useState<Player | null>(null)
  const [transferLoading, setTransferLoading] = useState(false)
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false)
  const [selectedPlayerForHistory, setSelectedPlayerForHistory] = useState<Player | null>(null)

  // Define fetchPlayers first
  const fetchPlayers = useCallback(async () => {
    try {
      setPlayersLoading(true)
      setError(null)
      
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      console.log('👥 Fetching players for organizer:', user.id)

      // Fetch players using the service (include inactive players for management)
      const playersWithBalances = await playerService.getPlayersWithBalances(user.id, true)
      console.log('✅ Fetched players with balances:', playersWithBalances)

      // Transform to match Player interface expected by PlayerManagementTable
      const transformedPlayers: Player[] = playersWithBalances.map(player => {
        return {
          id: player.id,
          name: player.name,
          phone: player.phone_number || '',
          currentBalance: player.current_balance || 0,
          isActive: player.is_active,
          joinedAt: player.created_at.split('T')[0], // Convert to date string
          lastSessionAt: player.last_session_date || undefined,
          totalSessions: player.total_sessions || 0,
          totalPaid: player.total_paid || 0,
          notes: player.notes || undefined
        }
      })

      setPlayers(transformedPlayers)
      console.log(`✅ Loaded ${transformedPlayers.length} players`)

    } catch (err: any) {
      console.error('Error fetching players:', err)
      setError(err.message || 'Failed to load players')
    } finally {
      setPlayersLoading(false)
    }
  }, [user?.id])

  // Credit transfer handlers
  const handleCreditTransfer = (player: Player) => {
    setSelectedPlayerForTransfer(player)
    setShowCreditTransferModal(true)
  }

  const handleTransferSubmit = async (fromPlayerId: string, toPlayerId: string, amount: number, notes: string) => {
    try {
      setTransferLoading(true)
      
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      
      await paymentService.transferCredit(fromPlayerId, toPlayerId, amount, user.id, notes)
      
      // Refresh players data
      await fetchPlayers()
      
      setShowCreditTransferModal(false)
      setSelectedPlayerForTransfer(null)
      
      // Show success message
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
      
    } catch (err: any) {
      console.error('Error transferring credit:', err)
      setError(err.message || 'Failed to transfer credit')
    } finally {
      setTransferLoading(false)
    }
  }

  // Payment history handlers
  const handleViewPaymentHistory = (player: Player) => {
    setSelectedPlayerForHistory(player)
    setShowPaymentHistoryModal(true)
  }

  const handleClosePaymentHistory = () => {
    setSelectedPlayerForHistory(null)
    setShowPaymentHistoryModal(false)
  }

  // Check for success message from add player redirect
  useEffect(() => {
    if (searchParams.get('added') === 'true') {
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
      // Clear the URL parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('added')
      window.history.replaceState({}, '', newUrl.toString())
      
      // Refresh players list to show the new player
      if (user?.id) {
        fetchPlayers()
      }
    }
  }, [searchParams, user?.id, fetchPlayers])

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading, router])

  // Fetch players data
  useEffect(() => {
    if (user?.id) {
      fetchPlayers()
    }
  }, [user?.id, fetchPlayers])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
      }}>
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-2xl mb-6" style={{
            background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-4xl filter drop-shadow-lg">👥</span>
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
                Loading Players
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Fetching player data and balances...
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
              Only organizers can manage players.
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

  // Calculate summary stats from real data
  const totalPlayers = players.filter(p => p.isActive).length
  const totalInactive = players.filter(p => !p.isActive).length
  
  
  const playersWithDebt = players.filter(p => p.isActive && money(p.currentBalance).gt(0)).length
  const playersWithCredit = players.filter(p => p.isActive && money(p.currentBalance).lt(0)).length
  const totalOutstanding = players
    .filter(p => p.isActive && money(p.currentBalance).gt(0))
    .reduce((sum, p) => sum + p.currentBalance, 0)
  const totalCredit = players
    .filter(p => p.isActive && money(p.currentBalance).lt(0))
    .reduce((sum, p) => sum + Math.abs(p.currentBalance), 0)


  // Player management callbacks
  const handlePlayerEdit = (player: Player) => {
    if (!player.id) {
      // Add new player
      window.location.href = '/add-player'
    } else {
      // Edit existing player
      window.location.href = `/edit-player/${player.id}`
    }
  }

  const handlePlayerToggleStatus = async (player: Player) => {
    try {
      setIsLoading(true)
      const newStatus = !player.isActive
      console.log(`${player.isActive ? 'Deactivating' : 'Activating'} player:`, player.name)
      
      // Update player status using the service
      await playerService.updatePlayer(player.id, { is_active: newStatus })
      
      console.log(`✅ Player ${player.name} ${newStatus ? 'activated' : 'deactivated'}`)
      
      // Refresh players list
      await fetchPlayers()
    } catch (err: any) {
      console.error('Error toggling player status:', err)
      setError(err.message || 'Failed to update player status')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayerViewDetails = (player: Player) => {
    // Navigate to player dashboard with the specific player ID
    window.location.href = `/player-dashboard?playerId=${player.id}`
  }

  const handleBulkAction = async (action: string, playerIds: string[]) => {
    try {
      setIsLoading(true)
      console.log(`Bulk ${action} for players:`, playerIds)
      
      // Implement bulk actions using the service
      if (action === 'activate' || action === 'deactivate') {
        const isActive = action === 'activate'
        
        await playerService.bulkUpdatePlayers(playerIds, { is_active: isActive })
        
        console.log(`✅ Bulk ${action}d ${playerIds.length} players`)
        
        // Refresh players list
        await fetchPlayers()
      } else {
        throw new Error(`Bulk action "${action}" not implemented yet`)
      }
    } catch (err: any) {
      console.error('Error performing bulk action:', err)
      setError(err.message || `Failed to ${action} players`)
    } finally {
      setIsLoading(false)
    }
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
      
      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
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
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-2xl lg:text-3xl filter drop-shadow-lg">👥</span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Players Management
                </h1>
                <p className="mt-1 flex items-center space-x-2 text-sm lg:text-base" style={{ color: '#6b7280' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #7c3aed, #22c55e)'
                  }}></span>
                  <span>Manage all players, balances, and access permissions</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => window.location.href = '/add-player'}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(to right, #7c3aed, #22c55e)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #6d28d9, #16a34a)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #7c3aed, #22c55e)'
                }}
              >
                <span className="mr-2">👤</span>
                Add Player
              </Button>
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
        {showSuccessMessage && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>✅</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: '#15803d' }}>Player added successfully!</span>
                  <p className="mt-1 text-sm" style={{ color: '#166534' }}>The new player has been added to your group.</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <span className="font-semibold" style={{ color: '#dc2626' }}>Error occurred</span>
                  <p className="mt-1 text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Active Players */}
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl translate-x-12 -translate-y-12" style={{
              background: 'linear-gradient(to bottom left, rgba(124, 58, 237, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 50%, rgba(99, 102, 241, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold" style={{
                    background: 'linear-gradient(to right, #7c3aed, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{totalPlayers}</p>
                  <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Active Players</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(99, 102, 241, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-2xl filter drop-shadow-lg">👤</span>
                </div>
              </div>
            </div>
          </div>

          {/* Players with Debt */}
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(220, 38, 38, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl -translate-x-12 translate-y-12" style={{
              background: 'linear-gradient(to top right, rgba(239, 68, 68, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 50%, rgba(220, 38, 38, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold" style={{
                    background: 'linear-gradient(to right, #ef4444, #dc2626)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{playersWithDebt}</p>
                  <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Owe Money</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-2xl filter drop-shadow-lg">💳</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Outstanding */}
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(249, 115, 22, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full blur-2xl -translate-x-12 -translate-y-12" style={{
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold" style={{
                    background: 'linear-gradient(to right, #f59e0b, #f97316)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    <MoneyDisplay value={totalOutstanding} />
                  </p>
                  <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Total Outstanding</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-2xl filter drop-shadow-lg">💰</span>
                </div>
              </div>
            </div>
          </div>

          {/* Players with Credit */}
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(16, 185, 129, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full blur-2xl translate-x-12 translate-y-12" style={{
              background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(16, 185, 129, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold" style={{
                    background: 'linear-gradient(to right, #22c55e, #10b981)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{playersWithCredit}</p>
                  <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Have Credit</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-2xl filter drop-shadow-lg">💚</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Search and Filter Controls */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(168, 85, 247, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl translate-x-24 -translate-y-24" style={{
            background: 'linear-gradient(to bottom left, rgba(99, 102, 241, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, transparent 50%, rgba(168, 85, 247, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center space-x-2" style={{
                background: 'linear-gradient(to right, #6366f1, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                <span>🔍</span>
                <span>Search & Filter Players</span>
              </h2>
              <div className="text-sm" style={{ color: '#6b7280' }}>
                {players.length} total players
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 px-4 py-3 border rounded-xl text-base text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  style={{
                    borderColor: 'rgba(99, 102, 241, 0.2)'
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'inactive', 'debt', 'credit', 'settled'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={cn(
                      "px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5",
                      filter === filterOption
                        ? "text-white shadow-md transform scale-105"
                        : "text-gray-700 border border-white/30 hover:shadow-sm"
                    )}
                    style={filter === filterOption ? {
                      background: 'linear-gradient(to right, #6366f1, #a855f7)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    } : {
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (filter !== filterOption) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== filterOption) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  >
                    <span>{filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Player Management Table */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(59, 130, 246, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 translate-y-32" style={{
            background: 'linear-gradient(to top right, rgba(34, 197, 94, 0.08), transparent)'
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
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-xl filter drop-shadow-lg">📊</span>
              </div>
              <h3 className="text-lg font-semibold" style={{
                background: 'linear-gradient(to right, #22c55e, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Player Management Table</h3>
            </div>
            
            <PlayerManagementTable
              players={players}
              loading={playersLoading}
              searchQuery={searchQuery}
              filter={filter}
              onPlayerEdit={handlePlayerEdit}
              onPlayerToggleStatus={handlePlayerToggleStatus}
              onPlayerViewDetails={handlePlayerViewDetails}
              onPlayerCreditTransfer={handleCreditTransfer}
              onBulkAction={handleBulkAction}
              organizerId={user?.id}
              isOrganizer={userProfile?.role === 'organizer'}
              onPaymentsUpdate={fetchPlayers}
              onPlayerViewPaymentHistory={handleViewPaymentHistory}
            />
          </div>
        </div>
      </div>
      
      {/* Credit Transfer Modal */}
      {selectedPlayerForTransfer && (
        <CreditTransferModal
          players={players.map(p => ({
            id: p.id,
            name: p.name,
            phone_number: p.phone,
            balance: p.currentBalance
          }))}
          fromPlayer={selectedPlayerForTransfer ? {
            id: selectedPlayerForTransfer.id,
            name: selectedPlayerForTransfer.name,
            phone_number: selectedPlayerForTransfer.phone,
            balance: selectedPlayerForTransfer.currentBalance
          } : null}
          isOpen={showCreditTransferModal}
          onClose={() => {
            setShowCreditTransferModal(false)
            setSelectedPlayerForTransfer(null)
          }}
          onTransfer={handleTransferSubmit}
          loading={transferLoading}
        />
      )}
      
      {/* Player Payment History Modal */}
      <PlayerPaymentHistoryModal
        player={selectedPlayerForHistory}
        isOpen={showPaymentHistoryModal}
        onClose={handleClosePaymentHistory}
        organizerId={user?.id}
        isOrganizer={userProfile?.role === 'organizer'}
        onPaymentsUpdate={fetchPlayers}
      />
    </div>
  )
}