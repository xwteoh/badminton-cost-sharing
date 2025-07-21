import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type PlayerBalance = Database['public']['Tables']['player_balances']['Row']

export class BalanceService {
  private supabase = createClientSupabaseClient()

  /**
   * Get financial summary for a specific player
   */
  async getPlayerFinancialSummary(playerId: string) {
    console.log('📊 Getting financial summary for player:', playerId)
    
    // First try the player_balances table
    const { data, error } = await this.supabase
      .from('player_balances')
      .select('current_balance, total_owed, total_paid, player_id')
      .eq('player_id', playerId)
      .single()

    console.log('📊 Player balances query result:', { data, error, playerId })

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📊 No player_balances record found for player:', playerId)
      } else {
        console.error('📊 Error fetching player financial summary:', error)
        throw new Error(`Failed to fetch player financial summary: ${error.message}`)
      }
    }

    // If player_balances has data, use it
    if (data && !error) {
      console.log('📊 Found player_balances data:', data)
      return {
        netBalance: data.current_balance,
        totalOutstanding: data.total_owed,
        totalCredit: data.total_paid,
        currentBalance: data.current_balance
      }
    }

    // If no balance record exists, calculate manually from sessions and payments
    console.log('📊 No player_balances data found, calculating manually...')
    return await this.calculatePlayerFinancialSummary(playerId)
  }

  /**
   * Calculate financial summary manually from session participation and payments
   */
  async calculatePlayerFinancialSummary(playerId: string) {
    console.log('🧮 Calculating financial summary for player:', playerId)
    
    // Get all session participations for this player
    const { data: sessionParticipations, error: sessionError } = await this.supabase
      .from('session_participants')
      .select(`
        amount_owed,
        session:sessions(
          status,
          session_date,
          cost_per_player
        )
      `)
      .eq('player_id', playerId)

    if (sessionError) {
      console.error('Error fetching session participations:', sessionError)
    }

    // Get all payments for this player
    const { data: payments, error: paymentError } = await this.supabase
      .from('payments')
      .select('amount')
      .eq('player_id', playerId)

    if (paymentError) {
      console.error('Error fetching payments:', paymentError)
    }

    console.log('🧮 Session participations:', sessionParticipations)
    console.log('🧮 Payments:', payments)

    // Calculate totals
    const totalOwed = (sessionParticipations || [])
      .filter(sp => sp.amount_owed !== null)
      .reduce((sum, sp) => sum + (sp.amount_owed || 0), 0)

    const totalPaid = (payments || [])
      .reduce((sum, payment) => sum + payment.amount, 0)

    const currentBalance = totalOwed - totalPaid

    const result = {
      netBalance: currentBalance,
      totalOutstanding: totalOwed,
      totalCredit: totalPaid,
      currentBalance
    }

    console.log('🧮 Calculated financial summary:', result)
    return result
  }

  /**
   * Get balance for a specific player
   */
  async getPlayerBalance(organizerId: string, playerId: string) {
    const { data, error } = await this.supabase
      .from('player_balances')
      .select(`
        *,
        player:players(name, phone_number)
      `)
      .eq('organizer_id', organizerId)
      .eq('player_id', playerId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching player balance:', error)
      throw new Error(`Failed to fetch player balance: ${error.message}`)
    }

    // If no balance record exists, return zero balance
    if (!data) {
      return {
        organizer_id: organizerId,
        player_id: playerId,
        total_owed: 0,
        total_paid: 0,
        current_balance: 0,
        last_session_date: null,
        last_payment_date: null,
        updated_at: new Date().toISOString()
      }
    }

    return data
  }

  /**
   * Get all player balances for an organizer
   */
  async getAllPlayerBalances(organizerId: string) {
    const { data, error } = await this.supabase
      .from('player_balances')
      .select(`
        *,
        player:players(id, name, phone_number, is_active)
      `)
      .eq('organizer_id', organizerId)
      .order('current_balance') // Show biggest debts first

    if (error) {
      console.error('Error fetching all player balances:', error)
      throw new Error(`Failed to fetch player balances: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get financial summary for organizer dashboard
   */
  async getFinancialSummary(organizerId: string) {
    const { data, error } = await this.supabase
      .from('player_balances')
      .select('current_balance, total_owed, total_paid')
      .eq('organizer_id', organizerId)

    if (error) {
      console.error('Error fetching financial summary:', error)
      throw new Error(`Failed to fetch financial summary: ${error.message}`)
    }

    const balances = data || []
    
    // Calculate aggregates
    const totalOutstanding = balances.reduce((sum, b) => sum + (b.current_balance < 0 ? Math.abs(b.current_balance) : 0), 0)
    const totalCredit = balances.reduce((sum, b) => sum + (b.current_balance > 0 ? b.current_balance : 0), 0)
    const netBalance = totalCredit - totalOutstanding

    const playersInDebt = balances.filter(b => b.current_balance < 0).length
    const playersInCredit = balances.filter(b => b.current_balance > 0).length
    const settledPlayers = balances.filter(b => b.current_balance === 0).length
    const totalPlayers = balances.length

    const thisMonthRevenue = balances.reduce((sum, b) => sum + b.total_owed, 0)

    return {
      totalOutstanding,
      totalCredit,
      netBalance,
      playersInDebt,
      playersInCredit, 
      settledPlayers,
      totalPlayers,
      thisMonthRevenue,
      recentSessionsCount: 0 // Will be populated by session service
    }
  }

  /**
   * Manually trigger balance update for a player
   * (Usually handled automatically by database triggers)
   */
  async updatePlayerBalance(organizerId: string, playerId: string) {
    const { error } = await this.supabase
      .rpc('update_player_balance', {
        p_organizer_id: organizerId,
        p_player_id: playerId
      })

    if (error) {
      console.error('Error updating player balance:', error)
      throw new Error(`Failed to update player balance: ${error.message}`)
    }

    return true
  }

  /**
   * Get players who owe money (for payment reminders)
   */
  async getPlayersInDebt(organizerId: string, minAmount = 0) {
    const { data, error } = await this.supabase
      .from('player_balances')
      .select(`
        *,
        player:players(id, name, phone_number)
      `)
      .eq('organizer_id', organizerId)
      .lt('current_balance', -minAmount)
      .order('current_balance') // Biggest debts first

    if (error) {
      console.error('Error fetching players in debt:', error)
      throw new Error(`Failed to fetch players in debt: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get players with credit balances
   */
  async getPlayersInCredit(organizerId: string, minAmount = 0) {
    const { data, error } = await this.supabase
      .from('player_balances')
      .select(`
        *,
        player:players(id, name, phone_number)
      `)
      .eq('organizer_id', organizerId)
      .gt('current_balance', minAmount)
      .order('current_balance', { ascending: false }) // Biggest credits first

    if (error) {
      console.error('Error fetching players in credit:', error)
      throw new Error(`Failed to fetch players in credit: ${error.message}`)
    }

    return data || []
  }

  /**
   * Subscribe to balance changes for real-time updates
   */
  subscribeToBalanceChanges(organizerId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_balances',
          filter: `organizer_id=eq.${organizerId}`
        },
        callback
      )
      .subscribe()
  }
}

// Export singleton instance
export const balanceService = new BalanceService()