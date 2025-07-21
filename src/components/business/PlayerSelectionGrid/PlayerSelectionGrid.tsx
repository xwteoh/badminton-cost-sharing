'use client'

import { useState, useEffect } from 'react'

import { TemporaryPlayerModal, type TemporaryPlayerData } from '@/components/business/TemporaryPlayerModal'
import { cn } from '@/lib/utils/cn'

export interface Player {
  id: string
  name: string
  phone?: string
  isActive: boolean
}

export interface PlayerSelectionGridProps {
  players: Player[]
  selectedPlayerIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  temporaryPlayers?: TemporaryPlayerData[]
  onTemporaryPlayersChange?: (temporaryPlayers: TemporaryPlayerData[]) => void
  maxSelection?: number
  loading?: boolean
  error?: string
}

export function PlayerSelectionGrid({
  players,
  selectedPlayerIds,
  onSelectionChange,
  temporaryPlayers = [],
  onTemporaryPlayersChange,
  maxSelection = 20,
  loading = false,
  error
}: PlayerSelectionGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showTemporaryModal, setShowTemporaryModal] = useState(false)
  
  
  // Filter players based on search
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.phone && player.phone.includes(searchTerm))
  ).filter(player => player.isActive)
  
  const handlePlayerToggle = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      // Remove player
      onSelectionChange(selectedPlayerIds.filter(id => id !== playerId))
    } else {
      // Add player (if under max limit)
      if (selectedPlayerIds.length < maxSelection) {
        onSelectionChange([...selectedPlayerIds, playerId])
      }
    }
  }
  
  const selectAll = () => {
    const allFilteredIds = filteredPlayers.slice(0, maxSelection).map(p => p.id)
    onSelectionChange(allFilteredIds)
  }
  
  const clearAll = () => {
    onSelectionChange([])
  }
  
  // Quick selection buttons for common group sizes
  const quickSelectButtons = [2, 4, 6, 8]
  
  const quickSelect = (count: number) => {
    const selectedIds = filteredPlayers.slice(0, Math.min(count, maxSelection)).map(p => p.id)
    onSelectionChange(selectedIds)
  }

  // Temporary player handlers
  const handleAddTemporaryPlayer = (player: TemporaryPlayerData) => {
    if (onTemporaryPlayersChange) {
      onTemporaryPlayersChange([...temporaryPlayers, player])
    }
  }

  const handleRemoveTemporaryPlayer = (playerId: string) => {
    if (onTemporaryPlayersChange) {
      onTemporaryPlayersChange(temporaryPlayers.filter(p => p.id !== playerId))
    }
  }

  // Calculate total selected count (regular + temporary)
  const totalSelectedCount = selectedPlayerIds.length + temporaryPlayers.length
  const canAddMore = totalSelectedCount < maxSelection
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Players ({totalSelectedCount}/{maxSelection})
          </h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={filteredPlayers.length === 0}
              className="text-xs px-3 py-1 rounded-full transition-colors disabled:opacity-50"
              style={{
                background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))',
                color: '#7c3aed',
                border: '1px solid rgba(124, 58, 237, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1))'
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))'
                }
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={selectedPlayerIds.length === 0}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search players by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        
      </div>
      
      {/* Player Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-600 text-4xl mb-2">👥</div>
          <p className="text-gray-600">
            {searchTerm ? 'No players found matching your search' : 'No active players found'}
          </p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-sm text-primary hover:underline mt-2"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredPlayers.map(player => {
            const isSelected = selectedPlayerIds.includes(player.id)
            const isMaxReached = selectedPlayerIds.length >= maxSelection && !isSelected
            
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => handlePlayerToggle(player.id)}
                disabled={isMaxReached}
                className={cn(
                  'h-16 px-4 py-3 rounded-xl border text-left transition-all shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-offset-1',
                  isMaxReached && 'opacity-50 cursor-not-allowed'
                )}
                style={isSelected ? {
                  background: 'linear-gradient(to right, #7c3aed, #6d28d9)',
                  color: 'white',
                  borderColor: '#7c3aed',
                  boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.2)'
                } : {
                  backgroundColor: 'white',
                  color: '#374151',
                  borderColor: '#d1d5db'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isMaxReached) {
                    e.currentTarget.style.borderColor = '#9ca3af'
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isMaxReached) {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.backgroundColor = 'white'
                  }
                }}
              >
                <div className="flex items-center space-x-3 h-full">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                    isSelected
                      ? 'bg-white border-white'
                      : 'border-gray-400'
                  )}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7c3aed' }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <p className="font-semibold truncate text-base leading-tight">{player.name}</p>
                    {player.phone && (
                      <p className={cn(
                        'text-sm truncate leading-tight',
                        isSelected ? 'text-white/80' : 'text-gray-500'
                      )}>
                        {player.phone}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      
      {/* Temporary Players Section */}
      {onTemporaryPlayersChange && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900 flex items-center space-x-2">
              <span>👤</span>
              <span>Drop-in Players ({temporaryPlayers.length})</span>
            </h4>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowTemporaryModal(true)
              }}
              disabled={!canAddMore}
              className={cn(
                'px-3 py-1 text-sm rounded-lg border transition-all',
                canAddMore
                  ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
              )}
            >
              <span className="flex items-center space-x-1">
                <span>+</span>
                <span>Add Drop-in</span>
              </span>
            </button>
          </div>
          
          {temporaryPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {temporaryPlayers.map(player => (
                <div
                  key={player.id}
                  className="h-12 px-3 py-2 rounded-lg border bg-orange-50 border-orange-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{player.name}</p>
                      {player.phone && (
                        <p className="text-xs text-gray-500 truncate">{player.phone}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTemporaryPlayer(player.id)}
                    className="text-orange-600 hover:text-orange-800 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No drop-in players added yet</p>
              <p className="text-xs">Click "Add Drop-in" to add temporary players for this session</p>
            </div>
          )}
        </div>
      )}
      
      {/* Selection Summary */}
      {totalSelectedCount > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">
            {totalSelectedCount} player{totalSelectedCount === 1 ? '' : 's'} selected
            {temporaryPlayers.length > 0 && (
              <span className="ml-2 text-blue-600">
                ({selectedPlayerIds.length} regular + {temporaryPlayers.length} drop-in)
              </span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {selectedPlayerIds.slice(0, 5).map(playerId => {
              const player = players.find(p => p.id === playerId)
              return player ? (
                <span
                  key={playerId}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                >
                  {player.name}
                  <button
                    type="button"
                    onClick={() => handlePlayerToggle(playerId)}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ) : null
            })}
            {selectedPlayerIds.length > 5 && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                +{selectedPlayerIds.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Temporary Player Modal */}
      <TemporaryPlayerModal
        isOpen={showTemporaryModal}
        onClose={() => setShowTemporaryModal(false)}
        onAdd={handleAddTemporaryPlayer}
        existingPlayers={temporaryPlayers}
      />
    </div>
  )
}