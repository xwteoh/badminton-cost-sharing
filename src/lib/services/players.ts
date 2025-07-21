import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Player = Database['public']['Tables']['players']['Row']
type PlayerInsert = Database['public']['Tables']['players']['Insert']
type PlayerUpdate = Database['public']['Tables']['players']['Update']

export class PlayerService {
  private supabase = createClientSupabaseClient()

  /**
   * Create a new player
   */
  async createPlayer(playerData: Omit<PlayerInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('players')
      .insert([playerData])
      .select()
      .single()

    if (error) {
      console.error('Error creating player:', error)
      throw new Error(`Failed to create player: ${error.message}`)
    }

    return data
  }

  /**
   * Get all players for an organizer
   */
  async getPlayersByOrganizer(organizerId: string) {
    const { data, error } = await this.supabase
      .from('players')
      .select(`
        *,
        user:users!user_id(name, phone_number)
      `)
      .eq('organizer_id', organizerId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching players:', error)
      throw new Error(`Failed to fetch players: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get players with their current balances
   */
  async getPlayersWithBalances(organizerId: string, includeInactive = false) {
    let query = this.supabase
      .from('players')
      .select(`
        *,
        balances:player_balances(
          total_owed,
          total_paid,
          current_balance,
          last_session_date,
          last_payment_date
        )
      `)
      .eq('organizer_id', organizerId)

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching players with balances:', error)
      throw new Error(`Failed to fetch players with balances: ${error.message}`)
    }

    // Get session counts for all players
    const playerIds = (data || []).map(player => player.id)
    const sessionCounts = await this.getPlayerSessionCounts(playerIds, organizerId)

    // Transform the data to flatten balance information
    const transformedData = (data || []).map(player => {
      const balance = player.balances?.[0] || {
        total_owed: 0,
        total_paid: 0,
        current_balance: 0,
        last_session_date: null,
        last_payment_date: null
      }

      // For temporary players, use the player's name directly since they don't have user records
      // For regular players, use the player's name as well since it's stored in the players table
      const displayName = player.name
      const displayPhone = player.phone_number

      return {
        ...player,
        name: displayName,
        phone_number: displayPhone,
        current_balance: balance.current_balance,
        total_paid: balance.total_paid,
        total_owed: balance.total_owed,
        last_session_date: balance.last_session_date,
        last_payment_date: balance.last_payment_date,
        total_sessions: sessionCounts[player.id] || 0
      }
    })

    return transformedData
  }

  /**
   * Get session counts for multiple players
   */
  private async getPlayerSessionCounts(playerIds: string[], organizerId: string) {
    if (playerIds.length === 0) return {}

    console.log('🔍 Getting session counts for players:', playerIds, 'organizer:', organizerId)

    // Use pagination to get ALL session participants (handle >1000 records)
    let allParticipants: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 1000

    while (hasMore) {
      const { data: pageData, error } = await this.supabase
        .from('session_participants')
        .select(`
          player_id,
          session:sessions!inner(status, organizer_id)
        `)
        .in('player_id', playerIds)
        .eq('session.status', 'completed')
        .eq('session.organizer_id', organizerId)
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error('Error fetching session counts page:', page, error)
        return {}
      }

      console.log(`🏸 Session participants page ${page + 1}:`, { count: pageData?.length || 0 })

      if (pageData && pageData.length > 0) {
        allParticipants.push(...pageData)
        hasMore = pageData.length === pageSize
        page++
      } else {
        hasMore = false
      }
    }

    console.log('📊 Total session participants fetched:', allParticipants.length)

    // Count sessions per player
    const sessionCounts: Record<string, number> = {}
    
    for (const participant of allParticipants) {
      const playerId = participant.player_id
      sessionCounts[playerId] = (sessionCounts[playerId] || 0) + 1
    }

    console.log('📊 Final session counts:', sessionCounts)
    console.log('📊 Players with session counts:', Object.keys(sessionCounts).length, 'out of', playerIds.length, 'players')

    return sessionCounts
  }

  /**
   * Update a player
   */
  async updatePlayer(playerId: string, updates: PlayerUpdate) {
    const { data, error } = await this.supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating player:', error)
      throw new Error(`Failed to update player: ${error.message}`)
    }

    return data
  }

  /**
   * Toggle player active status
   */
  async togglePlayerStatus(playerId: string, isActive: boolean) {
    return this.updatePlayer(playerId, { is_active: isActive })
  }

  /**
   * Delete a player (soft delete by setting inactive)
   */
  async deletePlayer(playerId: string) {
    return this.togglePlayerStatus(playerId, false)
  }

  /**
   * Search players by name or phone
   */
  async searchPlayers(organizerId: string, searchTerm: string) {
    const { data, error } = await this.supabase
      .from('players')
      .select(`
        *,
        user:users!user_id(name, phone_number)
      `)
      .eq('organizer_id', organizerId)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
      .order('name')

    if (error) {
      console.error('Error searching players:', error)
      throw new Error(`Failed to search players: ${error.message}`)
    }

    return data || []
  }

  /**
   * Check if phone number already exists for this organizer
   */
  async checkPhoneExists(organizerId: string, phoneNumber: string, excludePlayerId?: string) {
    let query = this.supabase
      .from('players')
      .select('id, name, phone_number')
      .eq('organizer_id', organizerId)
      .eq('phone_number', phoneNumber)
      .eq('is_active', true)

    if (excludePlayerId) {
      query = query.neq('id', excludePlayerId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking phone exists:', error)
      throw new Error(`Failed to check phone number: ${error.message}`)
    }

    return data // null if not found, player object if found
  }

  /**
   * Get a single player by ID
   */
  async getPlayerById(playerId: string) {
    const { data, error } = await this.supabase
      .from('players')
      .select(`
        *,
        user:users!user_id(name, phone_number),
        balances:player_balances(
          total_owed,
          total_paid,
          current_balance,
          last_session_date,
          last_payment_date
        )
      `)
      .eq('id', playerId)
      .single()

    if (error) {
      console.error('Error fetching player:', error)
      throw new Error(`Failed to fetch player: ${error.message}`)
    }

    return data
  }

  /**
   * Bulk update multiple players
   */
  async bulkUpdatePlayers(playerIds: string[], updates: PlayerUpdate) {
    const { data, error } = await this.supabase
      .from('players')
      .update(updates)
      .in('id', playerIds)
      .select()

    if (error) {
      console.error('Error bulk updating players:', error)
      throw new Error(`Failed to bulk update players: ${error.message}`)
    }

    return data || []
  }
}

// Export singleton instance
export const playerService = new PlayerService()