import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']
type SessionParticipantInsert = Database['public']['Tables']['session_participants']['Insert']

export class SessionService {
  private supabase = createClientSupabaseClient()

  /**
   * Create a new session (planned or completed)
   */
  async createSession(sessionData: Omit<SessionInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert([sessionData])
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return data
  }

  /**
   * Create a completed session with participants
   */
  async createCompletedSession(
    sessionData: Omit<SessionInsert, 'id' | 'created_at' | 'updated_at' | 'status'>,
    participantIds: string[]
  ) {
    // Start a transaction
    const { data: session, error: sessionError } = await this.supabase
      .from('sessions')
      .insert([{ ...sessionData, status: 'completed' }])
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }

    // Calculate cost per player from computed column and round to 1 decimal place
    const costPerPlayer = Math.round(session.cost_per_player * 10) / 10

    // Add participants
    const participantInserts: SessionParticipantInsert[] = participantIds.map(playerId => ({
      session_id: session.id,
      player_id: playerId,
      amount_owed: costPerPlayer
    }))

    const { error: participantsError } = await this.supabase
      .from('session_participants')
      .insert(participantInserts)

    if (participantsError) {
      console.error('Error adding session participants:', participantsError)
      // Rollback: delete the session
      await this.supabase.from('sessions').delete().eq('id', session.id)
      throw new Error(`Failed to add session participants: ${participantsError.message}`)
    }

    return session
  }

  /**
   * Get all sessions for an organizer
   */
  async getSessionsByOrganizer(organizerId: string, status?: string) {
    let query = this.supabase
      .from('sessions')
      .select(`
        *,
        participants:session_participants(
          id,
          amount_owed,
          player:players(id, name, phone_number)
        )
      `)
      .eq('organizer_id', organizerId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      throw new Error(`Failed to fetch sessions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get upcoming/planned sessions
   */
  async getUpcomingSessions(organizerId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        participants:session_participants(
          id,
          amount_owed,
          player:players(id, name, phone_number)
        )
      `)
      .eq('organizer_id', organizerId)
      .eq('status', 'planned')
      .gte('session_date', today)
      .order('session_date')
      .order('start_time')

    if (error) {
      console.error('Error fetching upcoming sessions:', error)
      throw new Error(`Failed to fetch upcoming sessions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get recent completed sessions
   */
  async getRecentSessions(organizerId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        participants:session_participants(
          id,
          amount_owed,
          player:players(id, name, phone_number)
        )
      `)
      .eq('organizer_id', organizerId)
      .eq('status', 'completed')
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent sessions:', error)
      throw new Error(`Failed to fetch recent sessions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get recent sessions for a specific player
   */
  async getRecentSessionsForPlayer(playerId: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('session_participants')
      .select(`
        amount_owed,
        session:sessions(
          id,
          session_date,
          start_time,
          end_time,
          location,
          court_cost,
          shuttlecock_cost,
          other_costs,
          total_cost,
          cost_per_player,
          player_count,
          status,
          notes
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching player sessions:', error)
      throw new Error(`Failed to fetch player sessions: ${error.message}`)
    }

    // Transform the data to match expected format
    return (data || []).map(participant => ({
      ...participant.session,
      amount_owed: participant.amount_owed
    }))
  }

  /**
   * Get upcoming sessions for a specific player
   */
  async getUpcomingSessionsForPlayer(playerId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    console.log('🔍 Fetching upcoming sessions for player:', playerId, 'from date:', today)
    
    // First try to get all upcoming planned sessions to debug
    const { data: allPlanned, error: allError } = await this.supabase
      .from('sessions')
      .select(`
        id,
        title,
        session_date,
        start_time,
        end_time,
        location,
        player_count,
        notes,
        status,
        created_at,
        organizer_id
      `)
      .gte('session_date', today)
      .eq('status', 'planned')
      .order('session_date', { ascending: true })

    console.log('📅 All planned sessions found:', allPlanned?.length || 0, allPlanned)
    
    if (allError) {
      console.error('Error fetching all planned sessions:', allError)
    }

    // For planned sessions, check if player is in session_participants
    // If not, show all planned sessions (since participants might not be set yet)
    const { data: withParticipants, error: participantsError } = await this.supabase
      .from('sessions')
      .select(`
        id,
        title,
        session_date,
        start_time,
        end_time,
        location,
        player_count,
        notes,
        status,
        created_at,
        participants:session_participants!inner(player_id)
      `)
      .eq('participants.player_id', playerId)
      .gte('session_date', today)
      .eq('status', 'planned')
      .order('session_date', { ascending: true })

    console.log('👥 Sessions with participants for player:', withParticipants?.length || 0, withParticipants)
    
    if (participantsError) {
      console.error('Error fetching sessions with participants:', participantsError)
    }

    // If no sessions found with participants but there are planned sessions,
    // return all planned sessions (assuming participants aren't set for planned sessions yet)
    if ((!withParticipants || withParticipants.length === 0) && allPlanned && allPlanned.length > 0) {
      console.log('📝 No participant records found, returning all planned sessions')
      return allPlanned
    }

    console.log('✅ Returning sessions with participant records:', withParticipants?.length || 0)
    return withParticipants || []
  }

  /**
   * Update a session
   */
  async updateSession(sessionId: string, updates: SessionUpdate) {
    const { data, error } = await this.supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating session:', error)
      throw new Error(`Failed to update session: ${error.message}`)
    }

    return data
  }

  /**
   * Convert planned session to completed
   */
  async convertPlannedToCompleted(
    sessionId: string,
    updates: Partial<SessionInsert>,
    participantIds: string[]
  ) {
    // Update session with completion data
    const { data: session, error: sessionError } = await this.supabase
      .from('sessions')
      .update({ ...updates, status: 'completed' })
      .eq('id', sessionId)
      .select()
      .single()

    if (sessionError) {
      console.error('Error updating session:', sessionError)
      throw new Error(`Failed to update session: ${sessionError.message}`)
    }

    // Clear existing participants (if any)
    await this.supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)

    // Add new participants
    const costPerPlayer = session.cost_per_player
    const participantInserts: SessionParticipantInsert[] = participantIds.map(playerId => ({
      session_id: sessionId,
      player_id: playerId,
      amount_owed: costPerPlayer
    }))

    const { error: participantsError } = await this.supabase
      .from('session_participants')
      .insert(participantInserts)

    if (participantsError) {
      console.error('Error updating session participants:', participantsError)
      throw new Error(`Failed to update session participants: ${participantsError.message}`)
    }

    return session
  }

  /**
   * Update a completed session with new participants and costs
   */
  async updateCompletedSession(
    sessionId: string,
    updates: Partial<SessionInsert>,
    participantIds: string[]
  ) {
    // Update session with new data
    const { data: session, error: sessionError } = await this.supabase
      .from('sessions')
      .update({ ...updates, status: 'completed' })
      .eq('id', sessionId)
      .select()
      .single()

    if (sessionError) {
      console.error('Error updating session:', sessionError)
      throw new Error(`Failed to update session: ${sessionError.message}`)
    }

    // Clear existing participants
    await this.supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)

    // Add new participants with updated costs
    const costPerPlayer = session.cost_per_player
    const participantInserts: SessionParticipantInsert[] = participantIds.map(playerId => ({
      session_id: sessionId,
      player_id: playerId,
      amount_owed: costPerPlayer
    }))

    const { error: participantsError } = await this.supabase
      .from('session_participants')
      .insert(participantInserts)

    if (participantsError) {
      console.error('Error updating session participants:', participantsError)
      throw new Error(`Failed to update session participants: ${participantsError.message}`)
    }

    return session
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string) {
    // Participants will be deleted automatically due to CASCADE
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      console.error('Error deleting session:', error)
      throw new Error(`Failed to delete session: ${error.message}`)
    }

    return true
  }

  /**
   * Get a single session by ID with participants
   */
  async getSessionById(sessionId: string) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        participants:session_participants(
          id,
          amount_owed,
          player:players(id, name, phone_number)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching session:', error)
      throw new Error(`Failed to fetch session: ${error.message}`)
    }

    return data
  }

  /**
   * Get session statistics
   */
  async getSessionStats(organizerId: string, fromDate?: string, toDate?: string) {
    let query = this.supabase
      .from('sessions')
      .select('total_cost, session_date, status, player_count')
      .eq('organizer_id', organizerId)

    if (fromDate) {
      query = query.gte('session_date', fromDate)
    }
    if (toDate) {
      query = query.lte('session_date', toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching session stats:', error)
      throw new Error(`Failed to fetch session statistics: ${error.message}`)
    }

    const sessions = data || []
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const totalRevenue = completedSessions.reduce((sum, s) => sum + s.total_cost, 0)
    const totalPlayers = completedSessions.reduce((sum, s) => sum + s.player_count, 0)

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      plannedSessions: sessions.filter(s => s.status === 'planned').length,
      totalRevenue,
      averageSessionCost: completedSessions.length > 0 ? totalRevenue / completedSessions.length : 0,
      averagePlayersPerSession: completedSessions.length > 0 ? totalPlayers / completedSessions.length : 0
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService()