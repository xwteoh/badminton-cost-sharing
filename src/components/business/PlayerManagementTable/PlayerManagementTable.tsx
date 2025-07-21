'use client'

import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { money, formatMoney } from '@/lib/calculations/money'
import { cn } from '@/lib/utils/cn'

export interface Player {
  id: string
  name: string
  phone: string
  currentBalance: number
  isActive: boolean
  joinedAt: string
  lastSessionAt?: string
  totalSessions: number
  totalPaid: number
  notes?: string
}


export interface PlayerManagementTableProps {
  /** List of players */
  players: Player[]
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Search query */
  searchQuery?: string
  /** Filter options */
  filter?: 'all' | 'active' | 'inactive' | 'debt' | 'credit' | 'settled'
  /** Player action callbacks */
  onPlayerEdit?: (player: Player) => void
  onPlayerToggleStatus?: (player: Player) => void
  onPlayerDelete?: (player: Player) => void
  onPlayerViewDetails?: (player: Player) => void
  onPlayerCreditTransfer?: (player: Player) => void
  /** Bulk action callbacks */
  onBulkAction?: (action: string, playerIds: string[]) => void
  /** Custom className */
  className?: string
  /** Organizer ID for payment management */
  organizerId?: string
  /** Whether current user is organizer */
  isOrganizer?: boolean
  /** Callback when payments are updated */
  onPaymentsUpdate?: () => void
  /** Callback when payment history should be viewed */
  onPlayerViewPaymentHistory?: (player: Player) => void
}

export function PlayerManagementTable({
  players,
  loading = false,
  error,
  searchQuery = '',
  filter = 'all',
  onPlayerEdit,
  onPlayerToggleStatus,
  onPlayerDelete,
  onPlayerViewDetails,
  onPlayerCreditTransfer,
  onBulkAction,
  className,
  organizerId,
  isOrganizer = false,
  onPaymentsUpdate,
  onPlayerViewPaymentHistory
}: PlayerManagementTableProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [sortField, setSortField] = useState<keyof Player>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter players based on search and filter criteria
  const filteredPlayers = players.filter(player => {
    // Search filter
    const matchesSearch = !searchQuery || 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.phone.includes(searchQuery)

    // Status filter
    const matchesFilter = (() => {
      switch (filter) {
        case 'active': return player.isActive
        case 'inactive': return !player.isActive
        case 'debt': return player.currentBalance > 0 // Positive balance = owes money
        case 'credit': return player.currentBalance < 0 // Negative balance = has credit
        case 'settled': return player.currentBalance === 0
        case 'all':
        default: return true
      }
    })()

    return matchesSearch && matchesFilter
  })

  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  const handleSort = (field: keyof Player) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPlayers.length === sortedPlayers.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(sortedPlayers.map(p => p.id))
    }
  }

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { label: 'Owes', color: 'text-red-600', bg: 'bg-red-50' }
    if (balance < 0) return { label: 'Credit', color: 'text-green-600', bg: 'bg-green-50' }
    return { label: 'Settled', color: 'text-gray-600', bg: 'bg-gray-50' }
  }

  // Handle opening payment history modal
  const handleViewPaymentHistory = (player: Player) => {
    onPlayerViewPaymentHistory?.(player)
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('p-4 bg-red-50 border border-red-200 rounded-xl', className)}>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Bulk Actions */}
      {selectedPlayers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedPlayers.length} player{selectedPlayers.length === 1 ? '' : 's'} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction?.('activate', selectedPlayers)}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction?.('deactivate', selectedPlayers)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPlayers([])}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header - Desktop Only */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden md:block bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPlayers.length === sortedPlayers.length && sortedPlayers.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </label>
            <div className="flex-1 grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <button
                onClick={() => handleSort('name')}
                className="text-left hover:text-gray-700 flex items-center space-x-1"
              >
                <span>Player</span>
                {sortField === 'name' && (
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('currentBalance')}
                className="text-left hover:text-gray-700 flex items-center space-x-1"
              >
                <span>Balance</span>
                {sortField === 'currentBalance' && (
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('totalSessions')}
                className="text-left hover:text-gray-700 flex items-center space-x-1"
              >
                <span>Sessions</span>
                {sortField === 'totalSessions' && (
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('isActive')}
                className="text-left hover:text-gray-700 flex items-center space-x-1"
              >
                <span>Status</span>
                {sortField === 'isActive' && (
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <span>Actions</span>
            </div>
          </div>
        </div>
        
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPlayers.length === sortedPlayers.length && sortedPlayers.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSort('name')}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <span>Sort by Name</span>
                {sortField === 'name' && (
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {sortedPlayers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-gray-400">👥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No players match your search criteria' : 'No players have been added yet'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => onPlayerEdit?.({} as Player)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                >
                  <span className="mr-2">👤</span>
                  Add First Player
                </Button>
              )}
            </div>
          ) : (
            sortedPlayers.map(player => {
              const balanceStatus = getBalanceStatus(player.currentBalance)
              const isSelected = selectedPlayers.includes(player.id)
              
              return (
                <div
                  key={player.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-blue-50'
                  )}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectPlayer(player.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      
                      <div className="flex-1 space-y-3">
                        {/* Player Info */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">{player.name}</p>
                              <span className={cn(
                                'px-2 py-0.5 text-xs font-medium rounded-full',
                                player.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              )}>
                                {player.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{player.phone}</p>
                            {player.lastSessionAt && (
                              <p className="text-xs text-gray-400">
                                Last: {new Date(player.lastSessionAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          
                          {/* Balance */}
                          <div className={cn('px-3 py-2 rounded-lg text-center', balanceStatus.bg)}>
                            <MoneyDisplay 
                              value={player.currentBalance} 
                              size="sm" 
                              className={balanceStatus.color}
                            />
                            <p className={cn('text-xs mt-1', balanceStatus.color)}>
                              {balanceStatus.label}
                            </p>
                          </div>
                        </div>

                        {/* Sessions and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{player.totalSessions}</span> sessions
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onPlayerViewDetails?.(player)}
                              className="text-gray-600 hover:text-gray-900 w-8 h-8"
                              title="View Player Dashboard"
                            >
                              <span className="text-sm">👁️</span>
                            </Button>
                            {isOrganizer && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewPaymentHistory(player)}
                                className="text-purple-600 hover:text-purple-700 w-8 h-8"
                                title="View Payment History"
                              >
                                <span className="text-sm">💰</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onPlayerEdit?.(player)}
                              className="text-gray-600 hover:text-gray-900 w-8 h-8"
                              title="Edit Player"
                            >
                              <span className="text-sm">✏️</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onPlayerToggleStatus?.(player)}
                              className={cn(
                                'text-sm w-8 h-8',
                                player.isActive 
                                  ? 'text-orange-600 hover:text-orange-700' 
                                  : 'text-green-600 hover:text-green-700'
                              )}
                            >
                              {player.isActive ? '⏸️' : '▶️'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onPlayerCreditTransfer?.(player)}
                              className="text-blue-600 hover:text-blue-700 w-8 h-8"
                              title="Transfer Credit"
                            >
                              <span className="text-sm">💸</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:block">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectPlayer(player.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      
                      <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                        {/* Player Info */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{player.name}</p>
                            {!player.isActive && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{player.phone}</p>
                          {player.lastSessionAt && (
                            <p className="text-xs text-gray-400">
                              Last: {new Date(player.lastSessionAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* Balance */}
                        <div className={cn('px-3 py-2 rounded-lg text-center', balanceStatus.bg)}>
                          <MoneyDisplay 
                            value={player.currentBalance} 
                            size="sm" 
                            className={balanceStatus.color}
                          />
                          <p className={cn('text-xs mt-1', balanceStatus.color)}>
                            {balanceStatus.label}
                          </p>
                        </div>

                        {/* Sessions */}
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{player.totalSessions}</p>
                          <p className="text-xs text-gray-500">sessions</p>
                        </div>

                        {/* Status */}
                        <div className="text-center">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            player.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          )}>
                            {player.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onPlayerViewDetails?.(player)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Player Dashboard"
                          >
                            <span className="text-sm">👁️</span>
                          </Button>
                          {isOrganizer && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewPaymentHistory(player)}
                              className="text-purple-600 hover:text-purple-700"
                              title="View Payment History"
                            >
                              <span className="text-sm">💰</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onPlayerEdit?.(player)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Player"
                          >
                            <span className="text-sm">✏️</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onPlayerToggleStatus?.(player)}
                            className={cn(
                              'text-sm',
                              player.isActive 
                                ? 'text-orange-600 hover:text-orange-700' 
                                : 'text-green-600 hover:text-green-700'
                            )}
                          >
                            {player.isActive ? '⏸️' : '▶️'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onPlayerCreditTransfer?.(player)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Transfer Credit"
                          >
                            <span className="text-sm">💸</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {sortedPlayers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Total Players</p>
              <p className="font-semibold text-blue-900">{sortedPlayers.length}</p>
            </div>
            <div>
              <p className="text-blue-700">Active Players</p>
              <p className="font-semibold text-blue-900">
                {sortedPlayers.filter(p => p.isActive).length}
              </p>
            </div>
            <div>
              <p className="text-blue-700">Total Outstanding</p>
              <MoneyDisplay 
                value={sortedPlayers.filter(p => p.currentBalance > 0).reduce((sum, p) => sum + p.currentBalance, 0)}
                size="sm"
                className="font-semibold text-red-600"
              />
            </div>
            <div>
              <p className="text-blue-700">Total Credit</p>
              <MoneyDisplay 
                value={Math.abs(sortedPlayers.filter(p => p.currentBalance < 0).reduce((sum, p) => sum + p.currentBalance, 0))}
                size="sm"
                className="font-semibold text-green-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}