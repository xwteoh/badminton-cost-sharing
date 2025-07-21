'use client'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  variant: 'primary' | 'secondary' | 'outline'
  onClick: () => void
  disabled?: boolean
  badge?: string | number
}

export interface QuickActionsProps {
  actions: QuickAction[]
  layout?: 'grid' | 'list'
  className?: string
}

export function QuickActions({ 
  actions, 
  layout = 'grid', 
  className 
}: QuickActionsProps) {
  if (layout === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {actions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
      className
    )}>
      {actions.map((action) => (
        <QuickActionCard key={action.id} action={action} />
      ))}
    </div>
  )
}

function QuickActionCard({ action }: { action: QuickAction }) {
  // Dynamic styling based on action type
  const getActionStyling = (id: string) => {
    switch (id) {
      case 'create-session':
        return 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/30 hover:shadow-primary/10'
      case 'record-session':
        return 'bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:border-warning/30 hover:shadow-warning/10'
      case 'record-payment':
        return 'bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:border-success/30 hover:shadow-success/10'
      case 'view-players':
        return 'bg-gradient-to-br from-primary/5 to-primary/15 border-primary/20 hover:border-primary/30 hover:shadow-primary/10'
      case 'upcoming-sessions':
        return 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/30 hover:shadow-primary/10'
      case 'add-player':
        return 'bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:border-success/30 hover:shadow-success/10'
      case 'manage-locations':
        return 'bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:border-warning/30 hover:shadow-warning/10'
      case 'settings':
        return 'bg-gradient-to-br from-muted/30 to-muted/50 border-border hover:border-border/80 hover:shadow-muted/10'
      default:
        return 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/30 hover:shadow-primary/10'
    }
  }

  const getIconStyling = (id: string) => {
    switch (id) {
      case 'create-session':
        return 'bg-gradient-primary'
      case 'record-session':
        return 'bg-gradient-warning'
      case 'record-payment':
        return 'bg-gradient-success'
      case 'view-players':
        return 'bg-gradient-primary'
      case 'upcoming-sessions':
        return 'bg-gradient-primary'
      case 'add-player':
        return 'bg-gradient-success'
      case 'manage-locations':
        return 'bg-gradient-warning'
      case 'settings':
        return 'bg-gradient-to-br from-muted-foreground to-muted-foreground/80'
      default:
        return 'bg-gradient-primary'
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        action.onClick()
      }}
      disabled={action.disabled}
      className={cn(
        'relative rounded-2xl border-2 p-6 text-left group',
        'hover:shadow-xl hover:-translate-y-1 active:scale-95',
        'focus:outline-none focus:ring-4 focus:ring-ring/30 focus:ring-offset-2',
        'transition-all duration-300 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0',
        'min-h-[140px] touch-manipulation overflow-hidden cursor-pointer',
        'hover:border-primary/40 hover:bg-opacity-80', // Debug: visual feedback on hover
        getActionStyling(action.id)
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white to-transparent rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Badge */}
      {action.badge && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-border">
          {action.badge}
        </div>
      )}

      {/* Enhanced Icon */}
      <div className="mb-4 relative">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300',
          getIconStyling(action.id)
        )}>
          <span className="text-2xl" role="img" aria-label={action.title}>
            {action.icon}
          </span>
        </div>
        {/* Glow effect */}
        <div className={cn(
          'absolute inset-0 w-12 h-12 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300',
          getIconStyling(action.id)
        )}></div>
      </div>

      {/* Enhanced Content */}
      <div className="relative z-10">
        <h3 className="font-bold text-foreground mb-2 group-hover:text-foreground/90 transition-colors">
          {action.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-muted-foreground/90 transition-colors">
          {action.description}
        </p>
      </div>

      {/* Hover Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <span className="text-muted-foreground text-lg">→</span>
      </div>
    </button>
  )
}

function QuickActionButton({ action }: { action: QuickAction }) {
  return (
    <Button
      onClick={action.onClick}
      variant={action.variant}
      disabled={action.disabled}
      className="w-full justify-start h-auto p-4"
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl" role="img" aria-label={action.title}>
          {action.icon}
        </span>
        <div className="text-left">
          <div className="font-medium">{action.title}</div>
          <div className="text-sm opacity-75">{action.description}</div>
        </div>
        {action.badge && (
          <div className="ml-auto bg-muted/30 text-xs font-medium px-2 py-1 rounded-full">
            {action.badge}
          </div>
        )}
      </div>
    </Button>
  )
}

// Predefined quick actions for organizers
export const OrganizerQuickActions = {
  createSession: {
    id: 'create-session',
    title: 'Plan Session',
    description: 'Schedule an upcoming badminton session for your group',
    icon: '📅',
    variant: 'primary' as const
  },

  recordSession: {
    id: 'record-session',
    title: 'Record Session',
    description: 'Log a completed badminton session with costs and participants',
    icon: '🏸',
    variant: 'primary' as const
  },
  
  recordPayment: {
    id: 'record-payment', 
    title: 'Record Payment',
    description: 'Log a payment received from a player',
    icon: '💰',
    variant: 'secondary' as const
  },
  
  viewPlayers: {
    id: 'view-players',
    title: 'View Players',
    description: 'See all players and their current balances',
    icon: '👥',
    variant: 'outline' as const
  },

  upcomingSessions: {
    id: 'upcoming-sessions',
    title: 'Upcoming Sessions',
    description: 'Manage planned sessions and convert to completed',
    icon: '📋',
    variant: 'outline' as const
  },
  
  addPlayer: {
    id: 'add-player',
    title: 'Add Player',
    description: 'Add a new permanent player to your group',
    icon: '➕',
    variant: 'outline' as const
  },
  
  addTempPlayer: {
    id: 'add-temp-player',
    title: 'Add Temp Player',
    description: 'Quickly add a temporary player for one session',
    icon: '⚡',
    variant: 'outline' as const
  },
  
  manageLocations: {
    id: 'manage-locations',
    title: 'Manage Locations',
    description: 'Add and manage badminton court locations for sessions',
    icon: '📍',
    variant: 'outline' as const
  },
  
  viewSessions: {
    id: 'view-sessions',
    title: 'Session History',
    description: 'Review past sessions and upcoming planned sessions',
    icon: '📅',
    variant: 'outline' as const
  },
  
  settings: {
    id: 'settings',
    title: 'Settings',
    description: 'Configure default rates, peak hours, and preferences',
    icon: '⚙️',
    variant: 'outline' as const
  },

  financialReports: {
    id: 'financial-reports',
    title: 'Financial Reports',
    description: 'Complete history of all charges and payments',
    icon: '📊',
    variant: 'secondary' as const
  }
}

// Helper to create actions with navigation
export function createQuickActions(navigate: (path: string) => void): QuickAction[] {
  return [
    {
      ...OrganizerQuickActions.createSession,
      onClick: () => navigate('/create-session')
    },
    {
      ...OrganizerQuickActions.recordSession,
      onClick: () => navigate('/record-session')
    },
    {
      ...OrganizerQuickActions.recordPayment,
      onClick: () => navigate('/record-payment')
    },
    {
      ...OrganizerQuickActions.viewPlayers,
      onClick: () => navigate('/players')
    },
    {
      ...OrganizerQuickActions.upcomingSessions,
      onClick: () => navigate('/upcoming-sessions')
    },
    {
      ...OrganizerQuickActions.addPlayer,
      onClick: () => navigate('/add-player')
    },
    {
      ...OrganizerQuickActions.manageLocations,
      onClick: () => navigate('/locations')
    },
    {
      ...OrganizerQuickActions.settings,
      onClick: () => navigate('/settings')
    },
    {
      ...OrganizerQuickActions.financialReports,
      onClick: () => navigate('/financial-reports')
    }
  ]
}