import { createClientSupabaseClient } from '@/lib/supabase/client'

// Types for migration data
export interface MigrationPlayer {
  // Required fields
  name: string
  phone_number?: string // Optional for temporary players
  
  // Optional fields
  is_active?: boolean
  is_temporary?: boolean // Set to true for drop-in/guest players
  joined_at?: string // YYYY-MM-DD format
  notes?: string
  email?: string
  emergency_contact?: string
  membership_type?: string
  preferred_court_type?: string
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface MigrationSession {
  // Required fields
  date: string // YYYY-MM-DD format
  location_name: string
  court_rate: number // TOTAL court cost for the session (not per hour)
  shuttle_rate: number // Per shuttlecock rate
  total_hours: number
  total_shuttles: number
  total_cost: number
  player_count: number
  cost_per_player: number
  
  // Optional fields
  session_name?: string
  notes?: string
  is_recurring?: boolean
  start_time?: string // HH:MM:SS format
  end_time?: string // HH:MM:SS format
  
  // Related data
  participants: MigrationParticipant[]
  payments?: MigrationPayment[]
}

export interface MigrationParticipant {
  player_name: string
  phone_number: string
  amount_owed: number
  
  // Optional fields
  is_active?: boolean
  notes?: string
}

export interface MigrationPayment {
  player_name: string
  phone_number: string
  amount: number
  payment_date: string // YYYY-MM-DD format
  payment_method: 'paynow' | 'cash' | 'bank_transfer' | 'other' | 'credit_transfer'
  reference_number?: string
  notes?: string
}

export interface MigrationResult {
  success: boolean
  message: string
  stats: {
    sessions_created: number
    standalone_players_created: number
    standalone_players_updated: number
    session_players_created: number
    session_players_updated: number
    payments_created: number
    participant_records_created: number
  }
  errors: string[]
}

export interface MigrationData {
  players?: MigrationPlayer[]
  sessions?: MigrationSession[]
  payments?: MigrationPayment[] // Support for top-level payments array
}

export class DataMigration {
  private supabase = createClientSupabaseClient()
  private organizerId: string
  
  constructor(organizerId: string) {
    this.organizerId = organizerId
  }

  /**
   * Main migration function
   */
  async migrateBadmintonData(data: MigrationData): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      stats: {
        sessions_created: 0,
        standalone_players_created: 0,
        standalone_players_updated: 0,
        session_players_created: 0,
        session_players_updated: 0,
        payments_created: 0,
        participant_records_created: 0
      },
      errors: []
    }

    try {
      const playerCount = data.players?.length || 0
      const sessionCount = data.sessions?.length || 0
      
      console.log(`🚀 Starting migration of ${playerCount} players and ${sessionCount} sessions...`)

      // Step 1: Migrate standalone players first
      if (data.players && data.players.length > 0) {
        await this.migrateStandalonePlayers(data.players, result)
      }

      // Step 2: Process session-related players AND players from top-level payments
      if (data.sessions && data.sessions.length > 0) {
        console.log(`🔍 Extracting players from ${data.sessions.length} sessions and ${data.payments?.length || 0} top-level payments...`)
        const uniqueSessionPlayers = this.extractUniquePlayers(data.sessions, data.payments)
        await this.createOrUpdateSessionPlayers(uniqueSessionPlayers, result)

        // Step 3: Create sessions and participants
        for (const sessionData of data.sessions) {
          await this.createSession(sessionData, result)
        }

        // Step 4: Create payments - collect from all sources
        console.log('🔍 Collecting all payments from data...')
        const allPayments: MigrationPayment[] = []
        
        // Check for top-level payments array first
        if (data.payments && data.payments.length > 0) {
          console.log(`📋 Found ${data.payments.length} payments in top-level payments array`)
          allPayments.push(...data.payments)
        }
        
        // Also collect payments from sessions (in case they're in both places)
        for (const sessionData of data.sessions) {
          if (sessionData.payments && sessionData.payments.length > 0) {
            console.log(`📋 Found ${sessionData.payments.length} payments in session ${sessionData.date}`)
            allPayments.push(...sessionData.payments)
          }
        }
        
        console.log(`💰 Total payments collected: ${allPayments.length} (expecting 456)`)
        
        if (allPayments.length > 0) {
          await this.createPayments(allPayments, result)
        } else {
          console.log('⚠️ No payments found in data')
        }
      }

      result.success = true
      const totalPlayersCreated = result.stats.standalone_players_created + result.stats.session_players_created
      const totalPlayersUpdated = result.stats.standalone_players_updated + result.stats.session_players_updated
      result.message = `Migration completed successfully! Created ${result.stats.sessions_created} sessions, ${totalPlayersCreated} new players, updated ${totalPlayersUpdated} players, and ${result.stats.payments_created} payments.`
      
      console.log('✅ Migration completed:', result.stats)
      return result

    } catch (error) {
      console.error('❌ Migration failed:', error)
      result.success = false
      result.message = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      return result
    }
  }

  /**
   * Extract unique players from all sessions AND top-level payments
   */
  private extractUniquePlayers(sessions: MigrationSession[], topLevelPayments?: MigrationPayment[]): Set<{name: string, phone: string}> {
    const uniquePlayers = new Set<string>()
    const playerMap = new Map<string, {name: string, phone: string}>()

    // Extract players from sessions
    for (const session of sessions) {
      for (const participant of session.participants) {
        const key = participant.phone_number
        if (!uniquePlayers.has(key)) {
          uniquePlayers.add(key)
          playerMap.set(key, {
            name: participant.player_name,
            phone: participant.phone_number
          })
        }
      }

      if (session.payments) {
        for (const payment of session.payments) {
          const key = payment.phone_number
          if (!uniquePlayers.has(key)) {
            uniquePlayers.add(key)
            playerMap.set(key, {
              name: payment.player_name,
              phone: payment.phone_number
            })
          }
        }
      }
    }

    // CRITICAL FIX: Also extract players from top-level payments
    // This ensures players who made payments but don't appear in sessions are still created
    if (topLevelPayments && topLevelPayments.length > 0) {
      console.log(`🔍 Extracting players from ${topLevelPayments.length} top-level payments...`)
      for (const payment of topLevelPayments) {
        const key = payment.phone_number
        if (!uniquePlayers.has(key)) {
          uniquePlayers.add(key)
          playerMap.set(key, {
            name: payment.player_name,
            phone: payment.phone_number
          })
          console.log(`➕ Found new player from payments: ${payment.player_name} (${payment.phone_number})`)
        }
      }
    }

    console.log(`👥 Total unique players extracted: ${playerMap.size}`)
    return new Set(Array.from(playerMap.values()))
  }

  /**
   * Migrate standalone players
   */
  private async migrateStandalonePlayers(players: MigrationPlayer[], result: MigrationResult) {
    console.log(`👥 Processing ${players.length} standalone players...`)

    for (const playerData of players) {
      try {
        console.log(`🔍 Checking for existing player: ${playerData.name} (${playerData.phone_number || 'no phone'})`)
        
        // Check if player already exists - try by name first, then by phone
        let existingPlayer = null
        
        // First try to find by name (primary identifier)
        const { data: playerByName, error: nameError } = await this.supabase
          .from('players')
          .select('id, name, phone_number')
          .eq('name', playerData.name)
          .eq('organizer_id', this.organizerId)
          .single()

        if (!nameError && playerByName) {
          existingPlayer = playerByName
          console.log(`🎯 Found existing player by name: ${playerData.name}`)
        } else if (playerData.phone_number && playerData.phone_number.trim() !== '' && playerData.phone_number.trim() !== ' ') {
          // If not found by name and has valid phone number, try by phone
          const { data: playerByPhone, error: phoneError } = await this.supabase
            .from('players')
            .select('id, name, phone_number')
            .eq('phone_number', playerData.phone_number)
            .eq('organizer_id', this.organizerId)
            .single()

          if (!phoneError && playerByPhone) {
            existingPlayer = playerByPhone
            console.log(`📞 Found existing player by phone: ${playerData.name} (matched with ${playerByPhone.name})`)
          }
        }

        if (existingPlayer) {
          // Update existing player
          const { error } = await this.supabase
            .from('players')
            .update({
              name: playerData.name,
              is_active: playerData.is_active ?? true,
              notes: playerData.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPlayer.id)

          if (error) throw error
          result.stats.standalone_players_updated++
          console.log(`📝 Updated standalone player: ${playerData.name} (ID: ${existingPlayer.id})`)
        } else {
          // Create new player
          console.log(`➕ Creating new player: ${playerData.name}`)
          const { error } = await this.supabase
            .from('players')
            .insert({
              organizer_id: this.organizerId,
              name: playerData.name,
              phone_number: playerData.phone_number || ` ${Math.random().toString(36).substr(2, 5)}`, // Unique placeholder for empty phones
              is_active: playerData.is_active ?? true,
              is_temporary: playerData.is_temporary ?? false,
              notes: playerData.notes,
              user_id: playerData.is_temporary ? null : undefined, // Temporary players have no user account
              created_at: playerData.joined_at ? new Date(playerData.joined_at).toISOString() : new Date().toISOString()
            })

          if (error) {
            console.error(`❌ Error creating player ${playerData.name}:`, error)
            throw error
          }
          result.stats.standalone_players_created++
          console.log(`✅ Created standalone player: ${playerData.name}`)
        }
      } catch (error) {
        const errorMsg = `Failed to process standalone player ${playerData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error('🚨 Standalone player error:', errorMsg)
        result.errors.push(errorMsg)
      }
    }
  }

  /**
   * Create or update session-related players
   */
  private async createOrUpdateSessionPlayers(players: Set<{name: string, phone: string}>, result: MigrationResult) {
    console.log(`👥 Processing ${players.size} session-related players...`)

    for (const player of players) {
      try {
        // Check if player already exists
        const { data: existingPlayer } = await this.supabase
          .from('players')
          .select('id')
          .eq('phone_number', player.phone)
          .eq('organizer_id', this.organizerId)
          .single()

        if (existingPlayer) {
          // Update existing player
          const { error } = await this.supabase
            .from('players')
            .update({
              name: player.name,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPlayer.id)

          if (error) throw error
          result.stats.session_players_updated++
          console.log(`📝 Updated session player: ${player.name}`)
        } else {
          // Create new player (session-related players are typically regular players)
          const { error } = await this.supabase
            .from('players')
            .insert({
              organizer_id: this.organizerId,
              name: player.name,
              phone_number: player.phone || ' ', // Single space for NOT NULL constraint
              is_active: true,
              is_temporary: !player.phone || player.phone.trim() === '', // If no phone, assume temporary
              user_id: (player.phone && player.phone.trim() !== '') ? undefined : null // Temporary players have no user account
            })

          if (error) throw error
          result.stats.session_players_created++
          console.log(`✅ Created session player: ${player.name}`)
        }
      } catch (error) {
        const errorMsg = `Failed to process session player ${player.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }
  }

  /**
   * Create a session with participants
   */
  private async createSession(sessionData: MigrationSession, result: MigrationResult) {
    try {
      console.log(`🏸 Creating session for ${sessionData.date}...`)

      // Calculate costs - court_rate is TOTAL court cost, not per hour
      const courtCost = sessionData.court_rate // Direct total court cost from CSV
      const shuttlecockCost = sessionData.shuttle_rate * sessionData.total_shuttles
      // No other costs in migration data - set to 0
      const otherCosts = 0

      console.log(`💰 Session cost breakdown:`, {
        courtCost: courtCost,
        shuttlecockCost: shuttlecockCost,
        otherCosts: otherCosts,
        calculatedTotal: courtCost + shuttlecockCost,
        csvTotalCost: sessionData.total_cost,
        totalHours: sessionData.total_hours,
        courtRateFromCSV: sessionData.court_rate
      })

      // Validate that our calculation matches CSV total (with small tolerance for rounding)
      const calculatedTotal = courtCost + shuttlecockCost + otherCosts
      const difference = Math.abs(calculatedTotal - sessionData.total_cost)
      if (difference > 0.01) {
        console.warn(`⚠️ Cost mismatch: calculated ${calculatedTotal} vs CSV ${sessionData.total_cost} (difference: ${difference})`)
      }

      // Create the session (total_cost is auto-calculated by database)
      const sessionInsert: any = {
        organizer_id: this.organizerId,
        title: sessionData.session_name || `Badminton Session - ${sessionData.date}`,
        session_date: sessionData.date,
        location: sessionData.location_name,
        court_cost: courtCost, // Use direct court cost from CSV
        shuttlecock_cost: shuttlecockCost,
        other_costs: otherCosts, // Always 0 for migration data
        // total_cost is GENERATED ALWAYS AS (court_cost + shuttlecock_cost + other_costs) - don't insert
        player_count: sessionData.player_count,
        // cost_per_player is also auto-calculated by database - don't insert
        notes: sessionData.notes,
        status: 'completed'
      }

      // Add start and end times if provided
      if (sessionData.start_time) {
        sessionInsert.start_time = sessionData.start_time
      }
      if (sessionData.end_time) {
        sessionInsert.end_time = sessionData.end_time
      }

      const { data: session, error: sessionError } = await this.supabase
        .from('sessions')
        .insert(sessionInsert)
        .select()
        .single()

      if (sessionError) throw sessionError
      if (!session) throw new Error('Session creation returned no data')

      result.stats.sessions_created++
      console.log(`✅ Created session: ${session.title}`)

      // Create participants
      for (const participant of sessionData.participants) {
        await this.createParticipant(session.id, participant, result)
      }

    } catch (error) {
      const errorMsg = `Failed to create session for ${sessionData.date}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Session creation error details:', {
        error,
        sessionData,
        errorMessage: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined
      })
      result.errors.push(errorMsg)
    }
  }

  /**
   * Create a participant record
   */
  private async createParticipant(sessionId: string, participantData: MigrationParticipant, result: MigrationResult) {
    try {
      // Try to find player by name first (Access database mapping), then by phone
      let { data: player, error: playerError } = await this.supabase
        .from('players')
        .select('id')
        .eq('name', participantData.player_name)
        .eq('organizer_id', this.organizerId)
        .single()

      // If not found by name, try by phone number
      if (playerError || !player) {
        const { data: playerByPhone, error: phoneError } = await this.supabase
          .from('players')
          .select('id')
          .eq('phone_number', participantData.phone_number)
          .eq('organizer_id', this.organizerId)
          .single()
        
        if (!phoneError && playerByPhone) {
          player = playerByPhone
        }
      }

      // If still not found, this is an error - all players should exist by now
      if (!player) {
        // Try one more comprehensive search with fuzzy matching
        console.log(`🔍 Player not found by exact match, trying comprehensive search for: ${participantData.player_name}`)
        
        // Try to find similar player names (case insensitive, trimmed)
        const { data: allPlayers } = await this.supabase
          .from('players')
          .select('id, name, phone_number')
          .eq('organizer_id', this.organizerId)
        
        if (allPlayers) {
          console.log(`🔍 Available players:`, allPlayers.map(p => `${p.name} (${p.phone_number})`))
          
          // Try case-insensitive name matching
          const similarPlayer = allPlayers.find(p => 
            p.name.toLowerCase().trim() === participantData.player_name.toLowerCase().trim()
          )
          
          if (similarPlayer) {
            player = similarPlayer
            console.log(`✅ Found player with case-insensitive match: ${participantData.player_name} -> ${similarPlayer.name}`)
          } else {
            // Try partial name matching
            const partialMatch = allPlayers.find(p => 
              p.name.toLowerCase().includes(participantData.player_name.toLowerCase().trim()) ||
              participantData.player_name.toLowerCase().includes(p.name.toLowerCase().trim())
            )
            
            if (partialMatch) {
              player = partialMatch
              console.log(`✅ Found player with partial match: ${participantData.player_name} -> ${partialMatch.name}`)
            }
          }
        }
        
        // If still not found, this indicates a data inconsistency
        if (!player) {
          throw new Error(`Player not found: ${participantData.player_name} (${participantData.phone_number}). This player should have been created in the standalone players step. Available players: ${allPlayers?.map(p => p.name).join(', ') || 'none'}`)
        }
      }

      // Create participant record with detailed error logging
      console.log(`🔗 Creating participant: ${participantData.player_name} for session ${sessionId} with player ID ${player.id}`)
      
      // Validate the data before insertion
      if (!sessionId) {
        throw new Error(`Invalid session ID: ${sessionId}`)
      }
      if (!player.id) {
        throw new Error(`Invalid player ID: ${player.id}`)
      }
      if (typeof participantData.amount_owed !== 'number') {
        throw new Error(`Invalid amount_owed: ${participantData.amount_owed} (type: ${typeof participantData.amount_owed})`)
      }
      
      // Check if session exists
      const { data: sessionCheck, error: sessionCheckError } = await this.supabase
        .from('sessions')
        .select('id')
        .eq('id', sessionId)
        .single()
      
      if (sessionCheckError || !sessionCheck) {
        throw new Error(`Session ${sessionId} does not exist: ${sessionCheckError?.message}`)
      }
      
      // Check if player exists
      const { data: playerCheck, error: playerCheckError } = await this.supabase
        .from('players')
        .select('id')
        .eq('id', player.id)
        .single()
      
      if (playerCheckError || !playerCheck) {
        throw new Error(`Player ${player.id} does not exist: ${playerCheckError?.message}`)
      }
      
      console.log(`✅ Pre-insertion validation passed for ${participantData.player_name}`)
      
      const participantInsertData = {
        session_id: sessionId,
        player_id: player.id,
        amount_owed: participantData.amount_owed,
        notes: participantData.notes
      }
      
      console.log(`📝 Inserting participant data:`, participantInsertData)
      
      const { error: participantError } = await this.supabase
        .from('session_participants')
        .insert(participantInsertData)

      if (participantError) {
        // Log the raw error object to see everything
        console.error('🚨 RAW Participant insertion error:', participantError)
        console.error('🚨 Error object keys:', Object.keys(participantError))
        console.error('🚨 Error stringified:', JSON.stringify(participantError, null, 2))
        
        console.error('❌ Participant insertion error details:', {
          errorCode: participantError.code,
          errorMessage: participantError.message,
          errorDetails: participantError.details,
          errorHint: participantError.hint,
          playerName: participantData.player_name,
          playerId: player.id,
          sessionId: sessionId,
          amountOwed: participantData.amount_owed,
          rawError: participantError
        })
        
        // Check if it's a duplicate participant error
        if (participantError.code === '23505' && participantError.message?.includes('session_participants')) {
          console.log(`⚠️ Participant already exists for ${participantData.player_name} in this session, skipping...`)
          // Don't throw error for duplicates, just log and continue
        } else if (!participantError.code && !participantError.message) {
          // Empty error object - this suggests a network or permission issue
          console.error('🚨 EMPTY ERROR OBJECT - possible network/permission issue')
          throw new Error(`Participant creation failed: Empty error response - check network connection and database permissions`)
        } else {
          throw new Error(`Participant creation failed: ${participantError.message || 'Unknown database error'} (Code: ${participantError.code || 'No code'})`)
        }
      } else {
        result.stats.participant_records_created++
        console.log(`✅ Added participant: ${participantData.player_name}`)
      }

    } catch (error) {
      const errorMsg = `Failed to create participant ${participantData.player_name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('🚨 Participant creation error details:', {
        error,
        participantData,
        sessionId,
        errorMessage: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details
      })
      result.errors.push(errorMsg)
    }
  }

  /**
   * Create payments
   */
  private async createPayments(payments: MigrationPayment[], result: MigrationResult) {
    console.log(`💰 Processing ${payments.length} payments...`)
    let processedCount = 0
    let successCount = 0
    let failedCount = 0
    
    for (const paymentData of payments) {
      try {
        processedCount++
        console.log(`💰 [${processedCount}/${payments.length}] Finding player for payment: ${paymentData.player_name} (${paymentData.phone_number || 'no phone'}) - Amount: $${paymentData.amount}`)
        
        // Use the same robust player matching logic as participants
        let player = null
        
        // First try to find by name (primary identifier)
        const { data: playerByName, error: nameError } = await this.supabase
          .from('players')
          .select('id, name, phone_number')
          .eq('name', paymentData.player_name)
          .eq('organizer_id', this.organizerId)
          .single()

        if (!nameError && playerByName) {
          player = playerByName
          console.log(`🎯 Found player by name for payment: ${paymentData.player_name}`)
        } else if (paymentData.phone_number && paymentData.phone_number.trim() !== '' && paymentData.phone_number.trim() !== ' ') {
          // If not found by name and has valid phone number, try by phone
          const { data: playerByPhone, error: phoneError } = await this.supabase
            .from('players')
            .select('id, name, phone_number')
            .eq('phone_number', paymentData.phone_number)
            .eq('organizer_id', this.organizerId)
            .single()

          if (!phoneError && playerByPhone) {
            player = playerByPhone
            console.log(`📞 Found player by phone for payment: ${paymentData.player_name} (matched with ${playerByPhone.name})`)
          }
        }

        // If still not found, try fuzzy matching
        if (!player) {
          console.log(`🔍 Player not found by exact match, trying fuzzy search for payment: ${paymentData.player_name}`)
          
          const { data: allPlayers } = await this.supabase
            .from('players')
            .select('id, name, phone_number')
            .eq('organizer_id', this.organizerId)
          
          if (allPlayers) {
            // Try case-insensitive name matching
            const similarPlayer = allPlayers.find(p => 
              p.name.toLowerCase().trim() === paymentData.player_name.toLowerCase().trim()
            )
            
            if (similarPlayer) {
              player = similarPlayer
              console.log(`✅ Found player with case-insensitive match for payment: ${paymentData.player_name} -> ${similarPlayer.name}`)
            } else {
              // Try partial name matching
              const partialMatch = allPlayers.find(p => 
                p.name.toLowerCase().includes(paymentData.player_name.toLowerCase().trim()) ||
                paymentData.player_name.toLowerCase().includes(p.name.toLowerCase().trim())
              )
              
              if (partialMatch) {
                player = partialMatch
                console.log(`✅ Found player with partial match for payment: ${paymentData.player_name} -> ${partialMatch.name}`)
              }
            }
          }
        }

        if (!player) {
          const { data: allPlayers } = await this.supabase
            .from('players')
            .select('name')
            .eq('organizer_id', this.organizerId)
          
          console.error(`❌ [${processedCount}/${payments.length}] Player not found for payment: ${paymentData.player_name} (${paymentData.phone_number})`)
          console.error(`📝 Available players: ${allPlayers?.map(p => p.name).join(', ') || 'none'}`)
          throw new Error(`Player not found for payment: ${paymentData.player_name} (${paymentData.phone_number}). This player should have been created in the player creation steps. Check data consistency.`)
        }

        // Create payment record
        console.log(`💾 Creating payment record for ${paymentData.player_name} (Player ID: ${player.id})`)
        const { error } = await this.supabase
          .from('payments')
          .insert({
            organizer_id: this.organizerId,
            player_id: player.id,
            amount: paymentData.amount,
            payment_date: paymentData.payment_date,
            payment_method: paymentData.payment_method,
            reference_number: paymentData.reference_number,
            notes: paymentData.notes
          })

        if (error) {
          console.error(`❌ Payment insertion error for ${paymentData.player_name}:`, error)
          throw error
        }

        result.stats.payments_created++
        successCount++
        console.log(`✅ [${successCount} created] Payment: ${paymentData.player_name} - $${paymentData.amount}`)

      } catch (error) {
        failedCount++
        const errorMsg = `Failed to create payment for ${paymentData.player_name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`❌ [${failedCount} failed] ${errorMsg}`)
        result.errors.push(errorMsg)
      }
    }
    
    console.log(`💰 Payment migration summary: ${successCount} successful, ${failedCount} failed, ${processedCount} total processed`)
  }

  /**
   * Validate migration data before processing
   */
  validateMigrationData(data: MigrationData): string[] {
    const errors: string[] = []

    if ((!data.players || data.players.length === 0) && (!data.sessions || data.sessions.length === 0)) {
      errors.push('No players or sessions provided for migration')
      return errors
    }

    // Validate standalone players
    if (data.players) {
      data.players.forEach((player, index) => {
        const prefix = `Player ${index + 1}: `
        
        // Required fields validation
        if (!player.name) errors.push(`${prefix}Missing name`)
        
        // Phone number validation - optional for temporary players, required for regular players
        if (!player.phone_number && !player.is_temporary) {
          errors.push(`${prefix}Missing phone_number - phone numbers are required for regular players (set is_temporary: true for drop-in players)`)
        }
        
        // Handle empty phone numbers - convert to single space for database compatibility
        if (!player.phone_number || player.phone_number.trim() === '') {
          player.phone_number = ' ' // Single space to satisfy NOT NULL constraint
        }
        
        // Date format validation
        if (player.joined_at && !/^\d{4}-\d{2}-\d{2}$/.test(player.joined_at)) {
          errors.push(`${prefix}Invalid joined_at format (use YYYY-MM-DD)`)
        }
        
        // Skill level validation
        if (player.skill_level && !['beginner', 'intermediate', 'advanced', 'expert'].includes(player.skill_level)) {
          errors.push(`${prefix}Invalid skill_level (must be: beginner, intermediate, advanced, expert)`)
        }
      })
    }

    // Validate sessions
    if (data.sessions) {
      data.sessions.forEach((session, index) => {
        const prefix = `Session ${index + 1}: `

        // Required fields validation
        if (!session.date) errors.push(`${prefix}Missing date`)
        if (!session.location_name) errors.push(`${prefix}Missing location_name`)
        if (typeof session.court_rate !== 'number') errors.push(`${prefix}Invalid court_rate`)
        if (typeof session.shuttle_rate !== 'number') errors.push(`${prefix}Invalid shuttle_rate`)
        if (typeof session.total_hours !== 'number') errors.push(`${prefix}Invalid total_hours`)
        if (typeof session.total_shuttles !== 'number') errors.push(`${prefix}Invalid total_shuttles`)
        if (typeof session.total_cost !== 'number') errors.push(`${prefix}Invalid total_cost`)
        if (typeof session.player_count !== 'number') errors.push(`${prefix}Invalid player_count`)
        if (typeof session.cost_per_player !== 'number') errors.push(`${prefix}Invalid cost_per_player`)

        // Date format validation
        if (session.date && !/^\d{4}-\d{2}-\d{2}$/.test(session.date)) {
          errors.push(`${prefix}Invalid date format (use YYYY-MM-DD)`)
        }

        // Participants validation
        if (!session.participants || session.participants.length === 0) {
          errors.push(`${prefix}No participants provided`)
        } else {
          session.participants.forEach((participant, pIndex) => {
            const pPrefix = `${prefix}Participant ${pIndex + 1}: `
            if (!participant.player_name) errors.push(`${pPrefix}Missing player_name`)
            if (!participant.phone_number) errors.push(`${pPrefix}Missing phone_number`)
            if (typeof participant.amount_owed !== 'number') errors.push(`${pPrefix}Invalid amount_owed`)
          })
        }

        // Payments validation (if provided)
        if (session.payments) {
          session.payments.forEach((payment, pIndex) => {
            const pPrefix = `${prefix}Payment ${pIndex + 1}: `
            if (!payment.player_name) errors.push(`${pPrefix}Missing player_name`)
            if (!payment.phone_number) errors.push(`${pPrefix}Missing phone_number`)
            if (typeof payment.amount !== 'number') errors.push(`${pPrefix}Invalid amount`)
            if (!payment.payment_date) errors.push(`${pPrefix}Missing payment_date`)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(payment.payment_date)) {
              errors.push(`${pPrefix}Invalid payment_date format (use YYYY-MM-DD)`)
            }
            if (!['paynow', 'cash', 'bank_transfer', 'other', 'credit_transfer'].includes(payment.payment_method)) {
              errors.push(`${pPrefix}Invalid payment_method`)
            }
            
            // Validate amount constraints to match database rules
            if (payment.amount === 0) {
              errors.push(`${pPrefix}Payment amount cannot be zero (amount: ${payment.amount}, method: ${payment.payment_method})`)
            } else if (payment.payment_method === 'credit_transfer' && payment.amount > 0) {
              errors.push(`${pPrefix}Credit transfer should have negative amount (amount: ${payment.amount}, method: ${payment.payment_method})`)
            } else if (payment.payment_method !== 'credit_transfer' && payment.amount < 0) {
              errors.push(`${pPrefix}Negative amounts require credit_transfer method (amount: ${payment.amount}, method: ${payment.payment_method})`)
            }
          })
        }
      })
    }

    return errors
  }
}

// Export utility function for easy use
export async function migrateBadmintonData(organizerId: string, data: MigrationData): Promise<MigrationResult> {
  const migration = new DataMigration(organizerId)
  
  // Validate data first
  const validationErrors = migration.validateMigrationData(data)
  if (validationErrors.length > 0) {
    return {
      success: false,
      message: 'Validation failed',
      stats: {
        sessions_created: 0,
        standalone_players_created: 0,
        standalone_players_updated: 0,
        session_players_created: 0,
        session_players_updated: 0,
        payments_created: 0,
        participant_records_created: 0
      },
      errors: validationErrors
    }
  }

  // Run migration
  return await migration.migrateBadmintonData(data)
}