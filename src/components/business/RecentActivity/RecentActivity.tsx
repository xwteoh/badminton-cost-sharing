'use client'

import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { type MoneyInput } from '@/lib/calculations/money'
import { cn } from '@/lib/utils/cn'

export interface ActivityItem {
  id: string
  type: 'session' | 'payment' | 'player_added' | 'player_updated'
  title: string
  description: string
  amount?: MoneyInput
  timestamp: Date
  playerName?: string
  icon: string
  href?: string
}

export interface RecentActivityProps {
  activities: ActivityItem[]
  maxItems?: number
  loading?: boolean
  onViewAll?: () => void
  className?: string
}

export function RecentActivity({ 
  activities, 
  maxItems = 10,
  loading = false,
  onViewAll,
  className 
}: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems)

  if (loading) {
    return (
      <div className={cn('relative overflow-hidden', className)} style={{ 
        borderRadius: '24px',
        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
          borderRadius: '24px'
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
        <div className="relative">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    )
  }

  if (displayActivities.length === 0) {
    return (
      <div className={cn('relative overflow-hidden', className)} style={{ 
        borderRadius: '24px',
        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
          borderRadius: '24px'
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
        <div className="relative">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📋</span>
            <p className="text-gray-500 text-sm">
              No recent activity yet
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Activities will appear here as you record sessions and payments
            </p>
          </div>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ 
      borderRadius: '24px',
      boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
      transform: 'translateZ(0)'
    }}>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
        borderRadius: '24px'
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
      <div className="relative">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
          {onViewAll && activities.length > maxItems && (
            <button
              onClick={onViewAll}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all
            </button>
          )}
        </div>

        {/* Activity List */}
        <div className="space-y-3">
          {displayActivities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>

        {/* Show more indicator */}
        {activities.length > maxItems && !onViewAll && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              +{activities.length - maxItems} more activities
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const timeAgo = formatTimeAgo(activity.timestamp)
  
  const content = (
    <div className="flex items-center space-x-3 py-2">
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-sm">{activity.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {activity.title}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {activity.description}
        </p>
      </div>

      {/* Amount & Time */}
      <div className="flex-shrink-0 text-right">
        {activity.amount && (
          <MoneyDisplay 
            value={activity.amount}
            size="sm"
            className="block"
            colorScheme={getAmountColorScheme(activity.type)}
          />
        )}
        <p className="text-xs text-gray-600 mt-1">
          {timeAgo}
        </p>
      </div>
    </div>
  )

  if (activity.href) {
    return (
      <a
        href={activity.href}
        className="block hover:bg-gray-50 rounded-lg -mx-2 px-2 transition-colors"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="block">
      {content}
    </div>
  )
}

function getAmountColorScheme(activityType: ActivityItem['type']) {
  switch (activityType) {
    case 'payment':
      return 'success'
    case 'session':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMins = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMins < 1) {
    return 'Just now'
  } else if (diffInMins < 60) {
    return `${diffInMins}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else {
    return date.toLocaleDateString('en-SG', {
      month: 'short',
      day: 'numeric'
    })
  }
}

// Helper function to create activity items
export function createActivityItem(
  type: ActivityItem['type'],
  data: {
    title: string
    description: string
    amount?: MoneyInput
    playerName?: string
    timestamp?: Date
    href?: string
  }
): Omit<ActivityItem, 'id'> {
  const icons = {
    session: '🏸',
    payment: '💰', 
    player_added: '👤',
    player_updated: '✏️'
  }

  return {
    type,
    title: data.title,
    description: data.description,
    amount: data.amount,
    playerName: data.playerName,
    timestamp: data.timestamp || new Date(),
    icon: icons[type],
    href: data.href
  }
}