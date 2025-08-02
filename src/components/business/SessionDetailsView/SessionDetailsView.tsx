'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { cn } from '@/lib/utils/cn'

export interface SessionDetailsViewProps {
  session: {
    id: string
    title?: string | null
    session_date: string
    start_time?: string | null
    end_time?: string | null
    location?: string | null
    shuttlecocks_used?: number | null
    court_cost?: number
    shuttlecock_cost?: number
    other_costs?: number
    total_cost?: number
    cost_per_player?: number
    player_count: number
    status: 'planned' | 'completed' | 'cancelled'
    notes?: string | null
    created_at: string
    updated_at?: string | null
    participants?: Array<{
      id: string
      amount_owed: number
      player: {
        id: string
        name: string
        phone_number?: string | null
        is_temporary?: boolean
      }
    }>
  }
  participants: Array<{
    id: string
    amount_owed: number
    player: {
      id: string
      name: string
      phone_number?: string | null
      is_temporary?: boolean
    }
  }>
  onEdit?: () => void
  onCancel?: () => void
}

export function SessionDetailsView({ 
  session, 
  participants = [], 
  onEdit, 
  onCancel 
}: SessionDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'financial'>('overview')

  // Format date and time
  const sessionDate = new Date(session.session_date)
  const createdDate = new Date(session.created_at)
  const updatedDate = session.updated_at ? new Date(session.updated_at) : null

  // Status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return '📅'
      case 'completed':
        return '✅'
      case 'cancelled':
        return '❌'
      default:
        return '📋'
    }
  }

  return (
    <div className="space-y-6">
      {/* Session Header Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {session.title || `Session at ${session.location}`}
              </h2>
              <span className={cn(
                'px-3 py-1 text-sm font-medium rounded-full border',
                getStatusStyle(session.status)
              )}>
                {getStatusIcon(session.status)} {session.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">📅</span>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {sessionDate.toLocaleDateString('en-SG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">🕐</span>
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">
                    {session.start_time && session.end_time 
                      ? `${session.start_time} - ${session.end_time}`
                      : 'Time TBD'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">📍</span>
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{session.location || 'TBD'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">👥</span>
                <div>
                  <p className="text-gray-600">Players</p>
                  <p className="font-medium text-gray-900">
                    {session.status === 'completed' ? participants.length : session.player_count} players
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">🏸</span>
                <div>
                  <p className="text-gray-600">Shuttlecocks</p>
                  <p className="font-medium text-gray-900">
                    {session.shuttlecocks_used ? `${session.shuttlecocks_used} used` : 'Not recorded'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 ml-6">
            {session.status === 'planned' && (
              <>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEdit}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <span className="mr-1">✏️</span>
                    Edit
                  </Button>
                )}
                {onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <span className="mr-1">❌</span>
                    Cancel
                  </Button>
                )}
              </>
            )}
            {session.status === 'completed' && onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <span className="mr-1">✏️</span>
                Edit Session
              </Button>
            )}
          </div>
        </div>
        
        {session.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium mb-1">Notes:</p>
            <p className="text-gray-800">{session.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: '📋' },
              { key: 'participants', label: 'Participants', icon: '👥', count: participants.length },
              { key: 'financial', label: 'Financial', icon: '💰' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'flex items-center space-x-2 py-4 border-b-2 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-bold',
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Session Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Session Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{session.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {createdDate.toLocaleDateString('en-SG')} at {createdDate.toLocaleTimeString('en-SG')}
                      </p>
                    </div>
                    {updatedDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {updatedDate.toLocaleDateString('en-SG')} at {updatedDate.toLocaleTimeString('en-SG')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded border',
                          getStatusStyle(session.status)
                        )}>
                          {getStatusIcon(session.status)} {session.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {session.status === 'completed' && session.total_cost && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                        <MoneyDisplay value={session.total_cost} size="lg" className="font-semibold text-green-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <span>👥</span>
                  <span>Session Participants</span>
                </h3>
                <div className="text-sm text-gray-600">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </div>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">👥</div>
                  <p className="text-gray-600">
                    {session.status === 'planned' 
                      ? 'No participants assigned yet'
                      : 'No participant data available'
                    }
                  </p>
                  {session.status === 'planned' && (
                    <p className="text-sm text-gray-500 mt-2">
                      Participants will be added when this session is recorded
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.map((participant) => (
                    <div key={participant.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">
                              {participant.player.name}
                            </h4>
                            {participant.player.is_temporary && (
                              <span className="text-orange-500 text-sm">👤</span>
                            )}
                          </div>
                          {participant.player.phone_number && (
                            <p className="text-sm text-gray-600">{participant.player.phone_number}</p>
                          )}
                          {participant.player.is_temporary && (
                            <p className="text-xs text-orange-600 mt-1">Drop-in player</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Amount owed:</p>
                          <MoneyDisplay 
                            value={participant.amount_owed} 
                            size="sm" 
                            className="font-semibold text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <span>💰</span>
                <span>Financial Breakdown</span>
              </h3>

              {session.status === 'completed' && session.court_cost !== undefined ? (
                <div className="space-y-6">
                  {/* Cost Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Court Cost</p>
                        <MoneyDisplay value={session.court_cost || 0} size="lg" className="font-semibold text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Shuttlecock Cost</p>
                        <MoneyDisplay value={session.shuttlecock_cost || 0} size="lg" className="font-semibold text-green-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Other Costs</p>
                        <MoneyDisplay value={session.other_costs || 0} size="lg" className="font-semibold text-purple-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <MoneyDisplay value={session.total_cost || 0} size="lg" className="font-bold text-gray-900" />
                      </div>
                    </div>
                  </div>

                  {/* Per Player Cost */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Cost Per Player</h4>
                        <p className="text-sm text-blue-700">Split equally among {session.player_count} players</p>
                      </div>
                      <MoneyDisplay 
                        value={session.cost_per_player || 0} 
                        size="xl" 
                        className="font-bold text-blue-900"
                      />
                    </div>
                  </div>

                  {/* Total Amount Owed */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900">Total Amount Owed</h4>
                        <p className="text-sm text-green-700">Amount added to player balances</p>
                      </div>
                      <MoneyDisplay 
                        value={(session.cost_per_player || 0) * session.player_count} 
                        size="xl" 
                        className="font-bold text-green-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">💰</div>
                  <p className="text-gray-600">
                    {session.status === 'planned' 
                      ? 'Financial data will be available after the session is recorded'
                      : 'No financial data available for this session'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}