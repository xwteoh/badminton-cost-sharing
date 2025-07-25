import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Player = Database['public']['Tables']['players']['Row']
type Session = Database['public']['Tables']['sessions']['Row']
type Payment = Database['public']['Tables']['payments']['Row']
type PlayerBalance = Database['public']['Tables']['player_balances']['Row']

export interface DashboardFinancialSummary {
  totalOutstanding: number
  totalCredit: number
  netBalance: number
  playersInDebt: number
  playersInCredit: number
  settledPlayers: number
  totalPlayers: number
  recentSessionsCount: number
  thisMonthRevenue: number
}

export interface DashboardActivity {
  id: string
  type: 'session' | 'payment' | 'player_added'
  title: string
  description: string
  amount?: number
  playerName?: string
  timestamp: Date
  icon: string
  bgColor: string
  iconColor: string
  href?: string
}

export interface DashboardStats {
  upcomingSessionsCount: number
  totalActivePlayers: number
  thisWeekSessions: number
}

export class DashboardService {
  private supabase = createClientSupabaseClient()

  /**
   * Get financial summary for organizer dashboard
   */
  async getFinancialSummary(organizerId: string): Promise<DashboardFinancialSummary> {
    console.log('📊 DashboardService: Loading financial summary for organizer:', organizerId)

    try {
      // First check if current user exists and has organizer role
      const { data: { user } } = await this.supabase.auth.getUser()
      console.log('📊 DashboardService: Current authenticated user:', { 
        id: user?.id, 
        phone: user?.phone,
        idMatches: user?.id === organizerId
      })
      
      // Check user role in database
      const { data: userProfile, error: userError } = await this.supabase
        .from('users')
        .select('id, role, name, phone_number')
        .eq('id', user?.id || organizerId)
        .single()
      
      console.log('📊 DashboardService: User profile lookup:', { 
        userProfile, 
        userError,
        queriedUserId: user?.id || organizerId 
      })

      // Test basic table access first
      console.log('📊 DashboardService: Testing player_balances table access...')
      const { data: testAccess, error: testError } = await this.supabase
        .from('player_balances')
        .select('count', { count: 'exact' })
        .limit(0)
      
      console.log('📊 DashboardService: Table access test:', { 
        testAccess, 
        testError,
        canAccessTable: !testError 
      })

      // Get all player balances for this organizer
      console.log('📊 DashboardService: Querying player_balances with organizer_id:', organizerId)
      const { data: balances, error: balancesError } = await this.supabase
        .from('player_balances')
        .select(`
          *,
          players!inner(
            id,
            name,
            is_active,
            organizer_id
          )
        `)
        .eq('organizer_id', organizerId)
        .eq('players.is_active', true)
      
      console.log('📊 DashboardService: Player balances query result:', { 
        balancesCount: balances?.length, 
        balancesError,
        errorCode: balancesError?.code,
        errorMessage: balancesError?.message,
        firstBalance: balances?.[0],
        queryExecuted: `SELECT *, players!inner(...) FROM player_balances WHERE organizer_id = '${organizerId}' AND players.is_active = true`
      })

      if (balancesError) {
        console.error('❌ Error fetching player balances:', balancesError)
        throw new Error(`Failed to fetch player balances: ${balancesError.message}`)
      }

      console.log('💰 Loaded player balances:', balances?.length || 0, 'players')

      // Get recent sessions count (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      console.log('📊 DashboardService: Querying sessions with:', { 
        organizerId, 
        thirtyDaysAgo: thirtyDaysAgo.toISOString().split('T')[0] 
      })
      const { data: recentSessions, error: sessionsError } = await this.supabase
        .from('sessions')
        .select('id, total_cost, session_date')
        .eq('organizer_id', organizerId)
        .eq('status', 'completed')
        .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0])
      
      console.log('📊 DashboardService: Sessions query result:', { 
        sessionsCount: recentSessions?.length, 
        sessionsError,
        firstSession: recentSessions?.[0] 
      })

      if (sessionsError) {
        console.error('❌ Error fetching recent sessions:', sessionsError)
        throw new Error(`Failed to fetch recent sessions: ${sessionsError.message}`)
      }

      console.log('🏸 Loaded recent sessions:', recentSessions?.length || 0, 'sessions')

      // Calculate financial metrics
      const players = balances || []
      
      let totalOutstanding = 0
      let totalCredit = 0
      let playersInDebt = 0
      let playersInCredit = 0
      let settledPlayers = 0

      players.forEach(balance => {
        const currentBalance = balance.current_balance || 0
        
        if (currentBalance > 0) {
          // Player owes money (positive balance = debt)
          totalOutstanding += currentBalance
          playersInDebt++
        } else if (currentBalance < 0) {
          // Player has credit (negative balance = credit)
          totalCredit += Math.abs(currentBalance)
          playersInCredit++
        } else {
          // Player is settled
          settledPlayers++
        }
      })

      // Calculate this month's revenue
      const thisMonth = new Date()
      thisMonth.setDate(1) // First day of current month
      
      const thisMonthSessions = recentSessions?.filter(session => 
        new Date(session.session_date) >= thisMonth
      ) || []
      
      const thisMonthRevenue = thisMonthSessions.reduce((sum, session) => 
        sum + (session.total_cost || 0), 0
      )

      const summary: DashboardFinancialSummary = {
        totalOutstanding,
        totalCredit,
        netBalance: totalOutstanding - totalCredit,
        playersInDebt,
        playersInCredit,
        settledPlayers,
        totalPlayers: players.length,
        recentSessionsCount: recentSessions?.length || 0,
        thisMonthRevenue
      }

      console.log('✅ Financial summary calculated:', summary)
      return summary

    } catch (error: any) {
      console.error('❌ Error in getFinancialSummary:', error)
      // Return safe defaults on error
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
  }

  /**
   * Get recent activities for dashboard
   */
  async getRecentActivities(organizerId: string, limit: number = 6): Promise<DashboardActivity[]> {
    console.log('📋 DashboardService: Loading recent activities for organizer:', organizerId)

    try {
      const activities: DashboardActivity[] = []

      // Get recent sessions (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: sessions, error: sessionsError } = await this.supabase
        .from('sessions')
        .select('id, title, location, total_cost, player_count, session_date, created_at, status')
        .eq('organizer_id', organizerId)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      if (sessionsError) {
        console.error('❌ Error fetching recent sessions:', sessionsError)
      } else {
        sessions?.forEach(session => {
          activities.push({
            id: `session-${session.id}`,
            type: 'session',
            title: session.title || `Session at ${session.location}`,
            description: `${session.player_count} players • ${session.location}`,
            amount: session.total_cost,
            timestamp: new Date(session.created_at),
            icon: '🏸',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            href: `/session-details?id=${session.id}`
          })
        })
      }

      // Get recent payments (last 30 days)
      const { data: payments, error: paymentsError } = await this.supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_method,
          created_at,
          players!inner(
            id,
            name,
            organizer_id
          )
        `)
        .eq('organizer_id', organizerId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      if (paymentsError) {
        console.error('❌ Error fetching recent payments:', paymentsError)
      } else {
        payments?.forEach(payment => {
          activities.push({
            id: `payment-${payment.id}`,
            type: 'payment',
            title: `Payment from ${payment.players?.name || 'Unknown'}`,
            description: `${payment.payment_method} payment received`,
            amount: payment.amount,
            playerName: payment.players?.name || undefined,
            timestamp: new Date(payment.created_at),
            icon: '💰',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600'
          })
        })
      }

      // Get recently added players (last 30 days)
      const { data: newPlayers, error: playersError } = await this.supabase
        .from('players')
        .select('id, name, created_at, is_temporary')
        .eq('organizer_id', organizerId)
        .eq('is_active', true)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      if (playersError) {
        console.error('❌ Error fetching recent players:', playersError)
      } else {
        newPlayers?.forEach(player => {
          activities.push({
            id: `player-${player.id}`,
            type: 'player_added',
            title: `New ${player.is_temporary ? 'temporary' : ''} player added`,
            description: `${player.name} joined the group`,
            playerName: player.name,
            timestamp: new Date(player.created_at),
            icon: '👤',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
          })
        })
      }

      // Sort all activities by timestamp and limit
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)

      console.log('✅ Recent activities loaded:', sortedActivities.length, 'items')
      return sortedActivities

    } catch (error: any) {
      console.error('❌ Error in getRecentActivities:', error)
      return []
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(organizerId: string): Promise<DashboardStats> {
    console.log('📈 DashboardService: Loading dashboard stats for organizer:', organizerId)

    try {
      // Get upcoming sessions count
      const today = new Date().toISOString().split('T')[0]
      
      const { data: upcomingSessions, error: upcomingError } = await this.supabase
        .from('sessions')
        .select('id')
        .eq('organizer_id', organizerId)
        .eq('status', 'planned')
        .gte('session_date', today)

      if (upcomingError) {
        console.error('❌ Error fetching upcoming sessions:', upcomingError)
      }

      // Get active players count
      const { data: activePlayers, error: playersError } = await this.supabase
        .from('players')
        .select('id')
        .eq('organizer_id', organizerId)
        .eq('is_active', true)
        .eq('is_temporary', false)

      if (playersError) {
        console.error('❌ Error fetching active players:', playersError)
      }

      // Get this week's completed sessions
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const { data: weekSessions, error: weekError } = await this.supabase
        .from('sessions')
        .select('id')
        .eq('organizer_id', organizerId)
        .eq('status', 'completed')
        .gte('session_date', oneWeekAgo.toISOString().split('T')[0])

      if (weekError) {
        console.error('❌ Error fetching week sessions:', weekError)
      }

      const stats: DashboardStats = {
        upcomingSessionsCount: upcomingSessions?.length || 0,
        totalActivePlayers: activePlayers?.length || 0,
        thisWeekSessions: weekSessions?.length || 0
      }

      console.log('✅ Dashboard stats loaded:', stats)
      return stats

    } catch (error: any) {
      console.error('❌ Error in getDashboardStats:', error)
      return {
        upcomingSessionsCount: 0,
        totalActivePlayers: 0,
        thisWeekSessions: 0
      }
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()

// Export types
export type { DashboardFinancialSummary, DashboardActivity, DashboardStats }