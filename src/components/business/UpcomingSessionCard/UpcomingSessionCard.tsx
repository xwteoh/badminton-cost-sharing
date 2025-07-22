'use client'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export interface UpcomingSession {
  id: string
  title: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string
  expectedPlayers?: number
  actualPlayers?: number
  notes?: string
  status: 'planned' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt?: string
}

export interface UpcomingSessionCardProps {
  session: UpcomingSession
  /** Show organizer actions (edit, cancel, convert) */
  showOrganizerActions?: boolean
  /** Show player view (read-only) */
  playerView?: boolean
  /** Loading state */
  loading?: boolean
  /** Callbacks */
  onEdit?: (session: UpcomingSession) => void
  onCancel?: (session: UpcomingSession) => void
  onConvert?: (session: UpcomingSession) => void
  onView?: (session: UpcomingSession) => void
  /** Custom className */
  className?: string
}

export function UpcomingSessionCard({
  session,
  showOrganizerActions = false,
  playerView = false,
  loading = false,
  onEdit,
  onCancel,
  onConvert,
  onView,
  className
}: UpcomingSessionCardProps) {
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'planned':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          badge: 'bg-blue-500 text-white'
        }
      case 'completed':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          badge: 'bg-green-500 text-white'
        }
      case 'cancelled':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          badge: 'bg-red-500 text-white'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          badge: 'bg-gray-500 text-white'
        }
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr  }T00:00:00`)
    return date.toLocaleDateString('en-SG', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getSessionDuration = () => {
    // Validate input times
    if (!session.startTime || !session.endTime) {
      return 'TBD'
    }

    try {
      // Ensure times are in HH:MM format by adding seconds if needed
      const startTimeFormatted = session.startTime.includes(':') 
        ? (session.startTime.split(':').length === 2 ? `${session.startTime}:00` : session.startTime)
        : 'Invalid'
      const endTimeFormatted = session.endTime.includes(':')
        ? (session.endTime.split(':').length === 2 ? `${session.endTime}:00` : session.endTime)
        : 'Invalid'

      if (startTimeFormatted === 'Invalid' || endTimeFormatted === 'Invalid') {
        return 'TBD'
      }

      const start = new Date(`2000-01-01T${startTimeFormatted}`)
      const end = new Date(`2000-01-01T${endTimeFormatted}`)
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'TBD'
      }

      const durationMs = end.getTime() - start.getTime()
      
      // Handle negative duration (end time before start time)
      if (durationMs <= 0) {
        return 'TBD'
      }

      const hours = Math.floor(durationMs / (1000 * 60 * 60))
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`
      } else if (hours > 0) {
        return `${hours}h`
      } else if (minutes > 0) {
        return `${minutes}m`
      } else {
        return 'TBD'
      }
    } catch (error) {
      console.warn('Error calculating session duration:', { 
        startTime: session.startTime, 
        endTime: session.endTime, 
        error 
      })
      return 'TBD'
    }
  }

  const isUpcoming = () => {
    const sessionDateTime = new Date(`${session.sessionDate}T${session.startTime}:00`)
    return sessionDateTime > new Date() && session.status === 'planned'
  }

  const isPast = () => {
    const sessionDateTime = new Date(`${session.sessionDate}T${session.endTime}:00`)
    return sessionDateTime < new Date()
  }

  const statusStyle = getStatusStyling(session.status)

  return (
    <div className={cn(
      'relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1',
      loading && 'opacity-50 pointer-events-none',
      className
    )}
    style={{ 
      borderRadius: '24px',
      boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
      transform: 'translateZ(0)'
    }}
    >
      {/* Premium Glassmorphism Background */}
      <div className="absolute inset-0" style={{
        background: session.status === 'planned' 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)'
          : session.status === 'completed'
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(16, 185, 129, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(220, 38, 38, 0.12) 100%)',
        borderRadius: '24px'
      }}></div>
      <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl -translate-x-24 -translate-y-24" style={{
        background: session.status === 'planned'
          ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.08), transparent)'
          : session.status === 'completed'
          ? 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.08), transparent)'
          : 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.08), transparent)'
      }}></div>
      <div className="absolute inset-0 backdrop-blur-xl" style={{
        border: '1px solid rgba(255, 255, 255, 0.18)',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
      }}></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
        background: session.status === 'planned'
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(99, 102, 241, 0.05) 100%)'
          : session.status === 'completed'
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(16, 185, 129, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 50%, rgba(220, 38, 38, 0.05) 100%)',
        borderRadius: '24px'
      }}></div>
      
      <div className="relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-bold" style={{
              background: session.status === 'planned'
                ? 'linear-gradient(to right, #3b82f6, #6366f1)'
                : session.status === 'completed'
                ? 'linear-gradient(to right, #22c55e, #10b981)'
                : 'linear-gradient(to right, #ef4444, #dc2626)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {session.title || `Session - ${formatDate(session.sessionDate)}`}
            </h3>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm shadow-lg" style={{
              background: session.status === 'planned'
                ? 'linear-gradient(to right, #3b82f6, #6366f1)'
                : session.status === 'completed'
                ? 'linear-gradient(to right, #22c55e, #10b981)'
                : 'linear-gradient(to right, #ef4444, #dc2626)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {session.status.toUpperCase()}
            </span>
          </div>
          
          {/* Date & Time */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-medium" style={{
              color: session.status === 'planned' ? '#1e40af' : session.status === 'completed' ? '#15803d' : '#dc2626'
            }}>
              <span>📅</span>
              <span>{formatDate(session.sessionDate)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm" style={{
              color: session.status === 'planned' ? '#1e3a8a' : session.status === 'completed' ? '#166534' : '#b91c1c'
            }}>
              <span>🕐</span>
              <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
              <span className="text-xs opacity-75">({getSessionDuration()})</span>
            </div>
          </div>
        </div>

        {/* Quick Status Indicator */}
        <div className="flex flex-col items-end space-y-1">
          {isUpcoming() && (
            <div className="text-white text-xs px-3 py-1.5 rounded-full font-medium animate-pulse backdrop-blur-sm shadow-lg" style={{
              background: 'linear-gradient(to right, #3b82f6, #6366f1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Upcoming
            </div>
          )}
          {isPast() && session.status === 'planned' && (
            <div className="text-white text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-sm shadow-lg" style={{
              background: 'linear-gradient(to right, #f59e0b, #f97316)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Needs Recording
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        {/* Location */}
        <div className="flex items-center space-x-2 text-sm" style={{
          color: session.status === 'planned' ? '#1e40af' : session.status === 'completed' ? '#15803d' : '#dc2626'
        }}>
          <span>📍</span>
          <span className="font-medium">{session.location}</span>
        </div>

        {/* Players */}
        <div className="flex items-center space-x-2 text-sm" style={{
          color: session.status === 'planned' ? '#1e40af' : session.status === 'completed' ? '#15803d' : '#dc2626'
        }}>
          <span>👥</span>
          <span>
            {session.status === 'completed' && session.actualPlayers
              ? `${session.actualPlayers} players attended`
              : session.expectedPlayers === 0 ? 'TBD players expected' : `${session.expectedPlayers} players expected`
            }
          </span>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="text-sm" style={{
            color: session.status === 'planned' ? '#1e3a8a' : session.status === 'completed' ? '#166534' : '#b91c1c'
          }}>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0">📝</span>
              <span className="flex-1">{session.notes}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!playerView && showOrganizerActions && (
        <div className="flex flex-wrap gap-3 pt-4" style={{
          borderTop: session.status === 'planned' 
            ? '1px solid rgba(59, 130, 246, 0.2)' 
            : session.status === 'completed'
            ? '1px solid rgba(34, 197, 94, 0.2)'
            : '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          {session.status === 'planned' && (
            <>
              {/* Convert to Completed */}
              {onConvert && (
                <Button
                  size="sm"
                  onClick={() => onConvert(session)}
                  className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(to right, #22c55e, #10b981)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #059669)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #22c55e, #10b981)'
                  }}
                >
                  <span className="mr-1">🏸</span>
                  Record Session
                </Button>
              )}
              
              {/* Edit Session */}
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(session)}
                  className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                  style={{
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    color: '#1e40af'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                    e.currentTarget.style.color = '#1d4ed8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'
                    e.currentTarget.style.color = '#1e40af'
                  }}
                >
                  <span className="mr-1">✏️</span>
                  Edit
                </Button>
              )}
              
              {/* Cancel Session */}
              {onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(session)}
                  className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    color: '#dc2626'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(254, 242, 242, 0.9)'
                    e.currentTarget.style.color = '#b91c1c'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'
                    e.currentTarget.style.color = '#dc2626'
                  }}
                >
                  <span className="mr-1">❌</span>
                  Cancel
                </Button>
              )}
            </>
          )}
          
          {/* View Details (for completed or cancelled sessions) */}
          {(session.status === 'completed' || session.status === 'cancelled') && onView && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(session)}
              className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
              style={{
                borderColor: session.status === 'completed' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                color: session.status === 'completed' ? '#15803d' : '#dc2626'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'
              }}
            >
              <span className="mr-1">👁️</span>
              View Details
            </Button>
          )}
        </div>
      )}

      {/* Player View Actions */}
      {playerView && onView && (
        <div className="pt-4" style={{
          borderTop: session.status === 'planned' 
            ? '1px solid rgba(59, 130, 246, 0.2)' 
            : session.status === 'completed'
            ? '1px solid rgba(34, 197, 94, 0.2)'
            : '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(session)}
            className="w-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
            style={{
              borderColor: session.status === 'planned' ? 'rgba(59, 130, 246, 0.3)' : session.status === 'completed' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              color: session.status === 'planned' ? '#1e40af' : session.status === 'completed' ? '#15803d' : '#dc2626'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <span className="mr-2">👁️</span>
            View Session Details
          </Button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '24px'
        }}>
          <div className={`w-6 h-6 border-2 rounded-full animate-spin ${
            session.status === 'planned' ? 'border-blue-200' : 
            session.status === 'completed' ? 'border-green-200' : 
            'border-red-200'
          }`} style={{
            borderTopColor: session.status === 'planned' ? '#3b82f6' : session.status === 'completed' ? '#22c55e' : '#ef4444'
          }}></div>
        </div>
      )}
      </div>
    </div>
  )
}

// Helper component for empty state
export function UpcomingSessionsEmptyState({ 
  type = 'upcoming',
  onCreateSession
}: { 
  type?: 'upcoming' | 'completed' | 'all'
  onCreateSession?: () => void 
}) {
  const getEmptyMessage = () => {
    switch (type) {
      case 'upcoming':
        return {
          icon: '📅',
          title: 'No upcoming sessions',
          message: 'Plan your next badminton session to get started',
          actionText: 'Plan New Session'
        }
      case 'completed':
        return {
          icon: '🏸',
          title: 'No completed sessions',
          message: 'Completed sessions will appear here after recording',
          actionText: 'Record Session'
        }
      default:
        return {
          icon: '📋',
          title: 'No sessions yet',
          message: 'Start by planning your first badminton session',
          actionText: 'Plan First Session'
        }
    }
  }

  const empty = getEmptyMessage()

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        <span className="text-4xl text-gray-600">{empty.icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{empty.title}</h3>
      <p className="text-gray-600 mb-6">{empty.message}</p>
      {onCreateSession && (
        <Button
          onClick={onCreateSession}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span className="mr-2">➕</span>
          {empty.actionText}
        </Button>
      )}
    </div>
  )
}