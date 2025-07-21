'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import type { Location } from '@/lib/services/locations'
import { cn } from '@/lib/utils/cn'

export interface LocationListProps {
  locations: Location[]
  loading?: boolean
  onEdit: (location: Location) => void
  onDeactivate: (locationId: string) => void
  onActivate: (locationId: string) => void
  onDelete: (locationId: string) => void
}

export function LocationList({
  locations,
  loading = false,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete
}: LocationListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAction = async (action: () => Promise<void>, locationId: string) => {
    try {
      setActionLoading(locationId)
      await action()
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const activeLocations = locations.filter(l => l.is_active)
  const inactiveLocations = locations.filter(l => !l.is_active)

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse relative overflow-hidden" style={{ 
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%)',
              borderRadius: '16px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(156, 163, 175, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px'
            }}></div>
            <div className="relative h-24 p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12 relative overflow-hidden" style={{ 
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%)',
          borderRadius: '20px'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-md" style={{
          border: '1px solid rgba(156, 163, 175, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px'
        }}></div>
        <div className="relative space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xl backdrop-blur-md" style={{
            background: 'linear-gradient(to bottom right, rgba(156, 163, 175, 0.2), rgba(107, 114, 128, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-2xl filter drop-shadow-lg">📍</span>
          </div>
          <h3 className="text-lg font-medium" style={{
            background: 'linear-gradient(to right, #6b7280, #4b5563)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            No locations yet
          </h3>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Add your first badminton court location to get started.
          </p>
        </div>
      </div>
    )
  }

  const LocationCard = ({ location }: { location: Location }) => (
    <div
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        location.is_active ? 'opacity-100' : 'opacity-75'
      )}
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}
    >
      {/* Background layers */}
      <div className="absolute inset-0" style={{
        background: location.is_active 
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(59, 130, 246, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(156, 163, 175, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(107, 114, 128, 0.12) 100%)',
        borderRadius: '16px'
      }}></div>
      <div className="absolute inset-0 backdrop-blur-xl" style={{
        border: location.is_active 
          ? '1px solid rgba(34, 197, 94, 0.18)'
          : '1px solid rgba(156, 163, 175, 0.18)',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
      }}></div>
      
      <div className="relative p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md flex-shrink-0" style={{
            background: location.is_active 
              ? 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))'
              : 'linear-gradient(to bottom right, rgba(156, 163, 175, 0.2), rgba(107, 114, 128, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-lg filter drop-shadow-lg">📍</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h4 className={cn(
                'font-semibold text-base leading-tight flex-1',
                location.is_active ? 'text-gray-900' : 'text-gray-600'
              )} style={{ wordBreak: 'break-word' }}>
                {location.name}
              </h4>
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium flex-shrink-0',
                location.is_active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-200 text-gray-600'
              )}>
                {location.is_active ? '✅ Active' : '⏸️ Inactive'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Address and Notes */}
        <div className="space-y-2">
          {location.address && (
            <p className={cn(
              'text-sm px-3 py-2 rounded-lg backdrop-blur-sm',
              location.is_active ? 'text-gray-600' : 'text-gray-500'
            )} style={{
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              wordBreak: 'break-word'
            }}>
              📍 {location.address}
            </p>
          )}
          
          {location.notes && (
            <p className={cn(
              'text-sm px-3 py-2 rounded-lg backdrop-blur-sm',
              location.is_active ? 'text-gray-600' : 'text-gray-500'
            )} style={{
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              wordBreak: 'break-word'
            }}>
              💡 {location.notes}
            </p>
          )}
        </div>

        {/* Premium Metadata */}
        <div className="flex items-center justify-between text-xs pt-3 mt-3" style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#9ca3af'
        }}>
          <span className="px-2 py-1 rounded-md backdrop-blur-sm" style={{
            background: 'rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            Added {new Date(location.created_at).toLocaleDateString('en-SG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
          {location.updated_at !== location.created_at && (
            <span className="px-2 py-1 rounded-md backdrop-blur-sm" style={{
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Updated {new Date(location.updated_at).toLocaleDateString('en-SG', {
                day: 'numeric',
                month: 'short'
              })}
            </span>
          )}
        </div>

        {/* Premium Actions */}
        <div className="flex items-center space-x-2 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(location)}
            disabled={actionLoading === location.id}
            className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
            style={{
              borderColor: 'rgba(59, 130, 246, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              color: '#3b82f6'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
              e.currentTarget.style.color = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
              e.currentTarget.style.color = '#3b82f6'
            }}
          >
            ✏️ Edit
          </Button>
          
          {location.is_active ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(() => onDeactivate(location.id), location.id)}
              disabled={actionLoading === location.id}
              className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
              style={{
                borderColor: 'rgba(245, 158, 11, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                color: '#f59e0b'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)'
                e.currentTarget.style.color = '#d97706'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                e.currentTarget.style.color = '#f59e0b'
              }}
            >
              {actionLoading === location.id ? (
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>⏸️ Deactivate</>
              )}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(() => onActivate(location.id), location.id)}
                disabled={actionLoading === location.id}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(34, 197, 94, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  color: '#22c55e'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'
                  e.currentTarget.style.color = '#16a34a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.color = '#22c55e'
                }}
              >
                {actionLoading === location.id ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>▶️ Activate</>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(() => onDelete(location.id), location.id)}
                disabled={actionLoading === location.id}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  color: '#ef4444'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                  e.currentTarget.style.color = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.color = '#ef4444'
                }}
              >
                {actionLoading === location.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>🗑️ Delete</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Active Locations */}
      {activeLocations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-sm" style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#16a34a'
          }}>
            <span>✅</span>
            <span>Active Locations ({activeLocations.length})</span>
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {activeLocations.map(location => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Locations */}
      {inactiveLocations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-sm" style={{
            background: 'rgba(156, 163, 175, 0.1)',
            border: '1px solid rgba(156, 163, 175, 0.2)',
            color: '#6b7280'
          }}>
            <span>⏸️</span>
            <span>Inactive Locations ({inactiveLocations.length})</span>
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {inactiveLocations.map(location => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}