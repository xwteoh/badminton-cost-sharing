'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback } from 'react'

import { FinancialSummaryCard, type FinancialSummary } from '@/components/business/FinancialSummaryCard'
import { QuickActions, createQuickActions } from '@/components/business/QuickActions'
import { RecentActivity, createActivityItem, type ActivityItem } from '@/components/business/RecentActivity'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { dashboardService, type DashboardFinancialSummary, type DashboardActivity, type DashboardStats } from '@/lib/services/dashboard'

export default function OrganizerDashboard() {
  const { user, userProfile, signOut, loading } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)
  
  // Live dashboard data state
  const [financialSummary, setFinancialSummary] = useState<DashboardFinancialSummary | null>(null)
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY RETURNS
  const handleNavigation = useCallback((path: string) => {
    console.log('🔗 Dashboard: Navigation requested to:', path)
    console.log('🔗 Dashboard: Current location:', window.location.href)
    console.log('🔗 Dashboard: Router object:', router)
    
    // Simple direct navigation - no try-catch complications
    window.location.href = path
  }, [router])

  const quickActions = useMemo(() => createQuickActions(handleNavigation), [handleNavigation])

  // Load live dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ Dashboard: No user ID for loading data')
      return
    }

    try {
      console.log('📊 Dashboard: Loading live dashboard data for user:', user.id)
      setDataLoading(true)
      setDataError(null)

      // Load all dashboard data in parallel
      const [financialData, activitiesData, statsData] = await Promise.all([
        dashboardService.getFinancialSummary(user.id),
        dashboardService.getRecentActivities(user.id, 6),
        dashboardService.getDashboardStats(user.id)
      ])

      console.log('✅ Dashboard: Live data loaded successfully')
      setFinancialSummary(financialData)
      setRecentActivities(activitiesData)
      setDashboardStats(statsData)

    } catch (error: any) {
      console.error('❌ Dashboard: Error loading live data:', error)
      setDataError(error.message || 'Failed to load dashboard data')
    } finally {
      setDataLoading(false)
    }
  }, [user?.id])

  // Redirect unauthenticated users to login - Chrome-safe implementation
  useEffect(() => {
    console.log('🔒 Dashboard: Auth check', { loading, hasUser: !!user, userId: user?.id, hasRedirected })
    
    // Prevent multiple redirects
    if (hasRedirected) return
    
    if (!loading && !user) {
      console.log('🔒 Dashboard: No user found, redirecting to login')
      setHasRedirected(true)
      window.location.href = '/login'
      return
    }
    
    if (!loading && user) {
      console.log('🔒 Dashboard: User authenticated, staying on dashboard')
    }
  }, [user, loading, hasRedirected])

  // Load dashboard data when user is authenticated
  useEffect(() => {
    if (user?.id && !loading) {
      loadDashboardData()
    }
  }, [user?.id, loading, loadDashboardData])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.03), #ffffff, rgba(34, 197, 94, 0.03))'
      }}>
        {/* Premium Loading Background */}
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
            <span className="text-4xl filter drop-shadow-lg">🏸</span>
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
                Loading Dashboard
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Preparing your badminton management center...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render dashboard if user is not authenticated or redirecting
  if (!user || hasRedirected) {
    console.log('🔒 Dashboard: No user or redirecting, returning null')
    return null
  }

  // Check role from userProfile instead of using RoleGuard
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
              Only organizers can access the dashboard.
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

  // Convert dashboard data to component formats
  const convertToFinancialSummary = (data: DashboardFinancialSummary | null): FinancialSummary => {
    if (!data) {
      return {
        totalOutstanding: 0,
        totalCredit: 0,
        netBalance: 0,
        playersInDebt: 0,
        playersInCredit: 0,
        settledPlayers: 0,
        totalPlayers: 0,
        recentSessionsCount: 0,
        thisMonthRevenue: 0
      }
    }
    
    return data
  }

  const convertToActivityItems = (activities: DashboardActivity[]): ActivityItem[] => {
    return activities.map(activity => ({
      id: activity.id,
      ...createActivityItem(activity.type, {
        title: activity.title,
        description: activity.description,
        amount: activity.amount,
        playerName: activity.playerName,
        timestamp: activity.timestamp
      }),
      href: (activity as any).href // Include href if it exists
    }))
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
          background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent)'
        }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
        {/* Premium Modern Header */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          {/* Enhanced Background with Multiple Layers */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
            background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.08), transparent)'
          }}></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
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
          
          <div className="relative p-4 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Left Section - Welcome & Branding */}
              <div className="flex items-center space-x-3 lg:space-x-6">
                {/* Premium Logo - Smaller on Mobile */}
                <div className="relative">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                    background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <span className="text-2xl lg:text-3xl filter drop-shadow-lg">🏸</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 rounded-full flex items-center justify-center shadow-lg" style={{
                    background: 'linear-gradient(to bottom right, #22c55e, #16a34a)'
                  }}>
                    <span className="text-xs text-white">✓</span>
                  </div>
                </div>
                
                {/* Welcome Content - Compact on Mobile */}
                <div className="space-y-1 lg:space-y-2">
                  <h1 className="text-2xl lg:text-4xl font-bold leading-tight" style={{
                    background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Welcome back, {userProfile?.name || 'Organizer'}!
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full animate-pulse shadow-sm" style={{
                        background: 'linear-gradient(to right, #22c55e, #16a34a)'
                      }}></div>
                      <span className="text-sm lg:text-base font-medium" style={{ color: '#6b7280' }}>System Active</span>
                    </div>
                    <div className="hidden sm:block w-1 h-1 rounded-full" style={{ backgroundColor: '#9ca3af' }}></div>
                    <span className="text-sm lg:text-base" style={{ color: '#6b7280' }}>Badminton Group Management</span>
                  </div>
                </div>
              </div>
              
              {/* Right Section - Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Live Stats Pills - More Compact on Mobile */}
                <div className="flex flex-wrap gap-2">
                  <div className="backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg" style={{
                    background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))',
                    border: '1px solid rgba(124, 58, 237, 0.2)'
                  }}>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full animate-pulse" style={{
                        background: 'linear-gradient(to right, #7c3aed, #6d28d9)'
                      }}></div>
                      <span className="text-sm lg:text-sm font-bold" style={{ color: '#7c3aed' }}>{financialSummary?.totalPlayers || 0}</span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>Players</span>
                    </div>
                  </div>
                  <div className="backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg" style={{
                    background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full animate-pulse" style={{
                        background: 'linear-gradient(to right, #f59e0b, #d97706)'
                      }}></div>
                      <span className="text-sm lg:text-sm font-bold" style={{ color: '#f59e0b' }}>{dashboardStats?.upcomingSessionsCount || 0}</span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>Upcoming</span>
                    </div>
                  </div>
                  <div className="backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg" style={{
                    background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                    border: '1px solid rgba(34, 197, 94, 0.2)'
                  }}>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full animate-pulse" style={{
                        background: 'linear-gradient(to right, #22c55e, #16a34a)'
                      }}></div>
                      <span className="text-sm lg:text-sm font-bold" style={{ color: '#22c55e' }}>{dashboardStats?.thisWeekSessions || 0}</span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>This Week</span>
                    </div>
                  </div>
                </div>
                
                {/* Premium Sign Out Button - Compact on Mobile */}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    console.log('🔓 Dashboard: Sign out clicked')
                    try {
                      await signOut()
                      console.log('🔓 Dashboard: Sign out completed, redirecting to login')
                      window.location.href = '/login'
                    } catch (error) {
                      console.error('🔓 Dashboard: Sign out error:', error)
                      window.location.href = '/login'
                    }
                  }}
                  className="bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20 hover:from-destructive/20 hover:to-destructive/10 hover:border-destructive/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm lg:px-4 px-3"
                  style={{
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <span className="mr-1 lg:mr-2">👋</span>
                  <span className="text-sm">Sign out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Error Alert */}
        {dataError && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-md rounded-2xl shadow-xl" style={{
              background: 'linear-gradient(to right, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.1))',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}></div>
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl -translate-x-16 -translate-y-16" style={{
              background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), transparent)'
            }}></div>
            <div className="relative p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))'
                }}>
                  <span className="text-lg">⚠️</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-bold" style={{ color: '#ef4444' }}>Dashboard Error</span>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ef4444' }}></div>
                  </div>
                  <p className="text-sm mb-4" style={{ color: '#f87171' }}>{dataError}</p>
                  <button
                    onClick={loadDashboardData}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))'
                    }}
                  >
                    🔄 Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <FinancialSummaryCard 
          summary={convertToFinancialSummary(financialSummary)}
          loading={dataLoading}
        />

        {/* Premium Quick Actions */}
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
          
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md" style={{
                    background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold" style={{
                      background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Quick Actions
                    </h2>
                    <p className="font-medium" style={{ color: '#6b7280' }}>Most used workflows for efficient management</p>
                  </div>
                </div>
              </div>
              
              <div className="backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg" style={{
                background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(34, 197, 94, 0.1))',
                border: '1px solid rgba(124, 58, 237, 0.2)'
              }}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #7c3aed, #22c55e)'
                  }}></div>
                  <span className="text-sm font-medium" style={{ color: '#6b7280' }}>Choose your workflow</span>
                </div>
              </div>
            </div>
            
            <QuickActions 
              actions={quickActions}
              layout="grid"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity 
              activities={convertToActivityItems(recentActivities)}
              loading={dataLoading}
              maxItems={6}
              onViewAll={() => console.log('View all activities')}
            />
          </div>

          {/* Premium Analytics Panel */}
          <div className="space-y-6">
            {/* Advanced Statistics Card */}
            <div className="relative overflow-hidden" style={{ 
              borderRadius: '24px',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
              transform: 'translateZ(0)'
            }}>
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
                borderRadius: '24px'
              }}></div>
              <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl -translate-x-24 -translate-y-24" style={{
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
              
              <div className="relative p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{
                    background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))'
                  }}>
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{
                      background: 'linear-gradient(to right, #7c3aed, #22c55e)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Analytics
                    </h3>
                    <p className="text-xs" style={{ color: '#6b7280' }}>Real-time insights</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Upcoming Sessions */}
                  <div className="p-4" style={{
                    background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: '16px'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold" style={{ color: '#7c3aed' }}>
                          {dashboardStats?.upcomingSessionsCount || 0}
                        </p>
                        <p className="text-sm" style={{ color: '#6b7280' }}>Upcoming Sessions</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                        backgroundColor: 'rgba(124, 58, 237, 0.2)'
                      }}>
                        <span className="text-sm">📅</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* This Week */}
                  <div className="p-4" style={{
                    background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '16px'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                          {dashboardStats?.thisWeekSessions || 0}
                        </p>
                        <p className="text-sm" style={{ color: '#6b7280' }}>This Week</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)'
                      }}>
                        <span className="text-sm">📈</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Players */}
                  <div className="p-4" style={{
                    background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: '16px'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold" style={{ color: '#7c3aed' }}>
                          {financialSummary?.totalPlayers || 0}
                        </p>
                        <p className="text-sm" style={{ color: '#6b7280' }}>Active Players</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                        backgroundColor: 'rgba(124, 58, 237, 0.2)'
                      }}>
                        <span className="text-sm">👥</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Players in Debt */}
                  <div className="p-4" style={{
                    background: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '16px'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                          {financialSummary?.playersInDebt || 0}
                        </p>
                        <p className="text-sm" style={{ color: '#6b7280' }}>Players in Debt</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.2)'
                      }}>
                        <span className="text-sm">💳</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
  )
}