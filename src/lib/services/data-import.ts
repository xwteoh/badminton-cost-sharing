import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import type { DataExportFile, ExportData } from './data-export'

// Types for import validation and processing
export interface ImportValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata: {
    exportDate: string
    appVersion: string
    totalRecords: number
    exportType: string
  } | null
  recordCounts: Record<keyof ExportData, number>
  conflicts: ImportConflict[]
}

export interface ImportConflict {
  type: 'duplicate_player' | 'duplicate_session' | 'duplicate_payment'
  description: string
  existingRecord: any
  newRecord: any
  resolution: 'skip' | 'replace' | 'merge'
}

export interface ImportOptions {
  conflictResolution: 'skip_duplicates' | 'replace_duplicates' | 'merge_data'
  validateOnly: boolean
  clearExistingData: boolean
}

export interface ImportResult {
  success: boolean
  message: string
  recordsProcessed: Record<keyof ExportData, number>
  recordsSkipped: Record<keyof ExportData, number>
  recordsCreated: Record<keyof ExportData, number>
  recordsUpdated: Record<keyof ExportData, number>
  conflicts: ImportConflict[]
  errors: string[]
  warnings: string[]
}

export class DataImportService {
  private supabase = createClientSupabaseClient()

  /**
   * Validate import file without processing
   */
  async validateImportFile(file: File): Promise<ImportValidationResult> {
    const result: ImportValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      metadata: null,
      recordCounts: {
        players: 0,
        sessions: 0,
        session_participants: 0,
        payments: 0,
        player_balances: 0,
        locations: 0
      },
      conflicts: []
    }

    try {
      console.log('🔍 Validating import file:', file.name)

      // Check file type
      if (!file.name.endsWith('.json')) {
        result.errors.push('File must be a JSON file (.json extension)')
        return result
      }

      // Check file size (limit to 50MB)
      if (file.size > 50 * 1024 * 1024) {
        result.errors.push('File size too large (maximum 50MB)')
        return result
      }

      // Read and parse file content
      const content = await this.readFileContent(file)
      let importData: DataExportFile

      try {
        importData = JSON.parse(content)
      } catch (parseError) {
        result.errors.push('Invalid JSON format')
        return result
      }

      // Validate file structure
      const structureValidation = this.validateFileStructure(importData)
      result.errors.push(...structureValidation.errors)
      result.warnings.push(...structureValidation.warnings)

      if (result.errors.length > 0) {
        return result
      }

      // Extract metadata
      result.metadata = {
        exportDate: importData.metadata.export_date,
        appVersion: importData.metadata.app_version,
        totalRecords: importData.metadata.total_records,
        exportType: importData.metadata.export_type
      }

      // Count records
      result.recordCounts = {
        players: importData.data.players?.length || 0,
        sessions: importData.data.sessions?.length || 0,
        session_participants: importData.data.session_participants?.length || 0,
        payments: importData.data.payments?.length || 0,
        player_balances: importData.data.player_balances?.length || 0,
        locations: importData.data.locations?.length || 0
      }

      // Validate data integrity
      const integrityValidation = this.validateDataIntegrity(importData.data)
      result.errors.push(...integrityValidation.errors)
      result.warnings.push(...integrityValidation.warnings)

      // Check for potential conflicts (basic check)
      result.warnings.push('Import will check for conflicts with existing data during processing')

      result.isValid = result.errors.length === 0
      console.log(`✅ Validation ${result.isValid ? 'passed' : 'failed'}:`, result)

      return result

    } catch (error) {
      console.error('❌ Validation error:', error)
      result.errors.push(error instanceof Error ? error.message : 'Validation failed')
      return result
    }
  }

  /**
   * Import data from validated file
   */
  async importData(file: File, organizerId: string, options: ImportOptions): Promise<ImportResult> {
    // Track ID mappings for foreign key relationships
    const idMappings = {
      players: new Map<string, string>(),
      sessions: new Map<string, string>(),
      locations: new Map<string, string>()
    }
    const result: ImportResult = {
      success: false,
      message: '',
      recordsProcessed: { players: 0, sessions: 0, session_participants: 0, payments: 0, player_balances: 0, locations: 0 },
      recordsSkipped: { players: 0, sessions: 0, session_participants: 0, payments: 0, player_balances: 0, locations: 0 },
      recordsCreated: { players: 0, sessions: 0, session_participants: 0, payments: 0, player_balances: 0, locations: 0 },
      recordsUpdated: { players: 0, sessions: 0, session_participants: 0, payments: 0, player_balances: 0, locations: 0 },
      conflicts: [],
      errors: [],
      warnings: []
    }

    try {
      console.log('🚀 Starting data import for organizer:', organizerId)
      console.log('⚙️ Import options:', options)

      // First validate the file
      const validation = await this.validateImportFile(file)
      if (!validation.isValid) {
        result.errors.push(...validation.errors)
        result.message = 'Import validation failed'
        return result
      }

      // Read and parse file
      const content = await this.readFileContent(file)
      const importData: DataExportFile = JSON.parse(content)

      // Validation only mode
      if (options.validateOnly) {
        result.success = true
        result.message = 'Validation completed successfully'
        result.warnings.push('Validation only - no data was imported')
        return result
      }

      // Clear existing data if requested
      if (options.clearExistingData) {
        console.log('🗑️ Clearing existing data...')
        await this.clearOrganizerData(organizerId)
        result.warnings.push('Existing data was cleared before import')
      }

      // Import data in correct order (respecting foreign key constraints)
      console.log('📊 Starting data import process...')

      try {
        // 1. Import locations first (no dependencies)
        if (importData.data.locations?.length > 0) {
          console.log(`📍 Importing ${importData.data.locations.length} locations...`)
          const locationResult = await this.importLocations(importData.data.locations, organizerId, options, idMappings)
          result.recordsProcessed.locations = locationResult.processed
          result.recordsCreated.locations = locationResult.created
          result.recordsSkipped.locations = locationResult.skipped
          result.conflicts.push(...locationResult.conflicts)
          console.log(`✅ Locations: ${locationResult.created} created, ${locationResult.skipped} skipped`)
        }

        // 2. Import players (no dependencies)
        if (importData.data.players?.length > 0) {
          console.log(`👥 Importing ${importData.data.players.length} players...`)
          const playerResult = await this.importPlayers(importData.data.players, organizerId, options, idMappings)
          result.recordsProcessed.players = playerResult.processed
          result.recordsCreated.players = playerResult.created
          result.recordsSkipped.players = playerResult.skipped
          result.conflicts.push(...playerResult.conflicts)
          console.log(`✅ Players: ${playerResult.created} created, ${playerResult.skipped} skipped`)
        }

        // 3. Import sessions (depends on locations)
        if (importData.data.sessions?.length > 0) {
          console.log(`🏸 Importing ${importData.data.sessions.length} sessions...`)
          const sessionResult = await this.importSessions(importData.data.sessions, organizerId, options, idMappings)
          result.recordsProcessed.sessions = sessionResult.processed
          result.recordsCreated.sessions = sessionResult.created
          result.recordsSkipped.sessions = sessionResult.skipped
          result.conflicts.push(...sessionResult.conflicts)
          console.log(`✅ Sessions: ${sessionResult.created} created, ${sessionResult.skipped} skipped`)
        }

        // 4. Import session participants (depends on sessions and players)
        if (importData.data.session_participants?.length > 0) {
          console.log(`📋 Importing ${importData.data.session_participants.length} session participants...`)
          const participantResult = await this.importSessionParticipants(importData.data.session_participants, organizerId, options, idMappings)
          result.recordsProcessed.session_participants = participantResult.processed
          result.recordsCreated.session_participants = participantResult.created
          result.recordsSkipped.session_participants = participantResult.skipped
          result.conflicts.push(...participantResult.conflicts)
          console.log(`✅ Session participants: ${participantResult.created} created, ${participantResult.skipped} skipped`)
        }

        // 5. Import payments (depends on players)
        if (importData.data.payments?.length > 0) {
          console.log(`💰 Importing ${importData.data.payments.length} payments...`)
          const paymentResult = await this.importPayments(importData.data.payments, organizerId, options, idMappings)
          result.recordsProcessed.payments = paymentResult.processed
          result.recordsCreated.payments = paymentResult.created
          result.recordsSkipped.payments = paymentResult.skipped
          result.conflicts.push(...paymentResult.conflicts)
          console.log(`✅ Payments: ${paymentResult.created} created, ${paymentResult.skipped} skipped`)
        }

        // 6. Import player balances last (depends on all other data)
        if (importData.data.player_balances?.length > 0) {
          console.log(`⚖️ Importing ${importData.data.player_balances.length} player balances...`)
          const balanceResult = await this.importPlayerBalances(importData.data.player_balances, organizerId, options, idMappings)
          result.recordsProcessed.player_balances = balanceResult.processed
          result.recordsCreated.player_balances = balanceResult.created
          result.recordsSkipped.player_balances = balanceResult.skipped
          result.conflicts.push(...balanceResult.conflicts)
          console.log(`✅ Player balances: ${balanceResult.created} created, ${balanceResult.skipped} skipped`)
        }
      } catch (importError) {
        console.error('❌ Error during import process:', importError)
        result.errors.push(`Import process failed: ${importError instanceof Error ? importError.message : 'Unknown error'}`)
        throw importError
      }

      const totalCreated = Object.values(result.recordsCreated).reduce((sum, count) => sum + count, 0)
      const totalSkipped = Object.values(result.recordsSkipped).reduce((sum, count) => sum + count, 0)

      result.success = true
      result.message = `Import completed successfully! Created ${totalCreated} records, skipped ${totalSkipped} duplicates.`
      
      console.log('✅ Import completed successfully:', result)
      return result

    } catch (error) {
      console.error('❌ Import failed:', error)
      result.success = false
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      return result
    }
  }

  /**
   * Clear all organizer data (for fresh import)
   */
  private async clearOrganizerData(organizerId: string): Promise<void> {
    console.log('🗑️ Clearing existing data for organizer:', organizerId)

    // Delete in reverse order of dependencies
    const tables = [
      'player_balances',
      'payments', 
      'session_participants',
      'sessions',
      'players',
      'locations'
    ]

    for (const table of tables) {
      const { error } = await this.supabase
        .from(table as any)
        .delete()
        .eq('organizer_id', organizerId)

      if (error) {
        console.error(`Error clearing ${table}:`, error)
        throw new Error(`Failed to clear existing ${table}: ${error.message}`)
      }
    }

    console.log('✅ Existing data cleared successfully')
  }

  /**
   * Read file content as text
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Validate file structure
   */
  private validateFileStructure(data: any): { errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required top-level properties
    if (!data.metadata) {
      errors.push('Missing metadata section')
    } else {
      if (!data.metadata.export_date) warnings.push('Missing export date in metadata')
      if (!data.metadata.organizer_id) warnings.push('Missing organizer ID in metadata')
    }

    if (!data.data) {
      errors.push('Missing data section')
    } else {
      // Validate data structure
      const requiredTables = ['players', 'sessions', 'session_participants', 'payments', 'player_balances', 'locations']
      for (const table of requiredTables) {
        if (data.data[table] && !Array.isArray(data.data[table])) {
          errors.push(`Invalid ${table} data - must be an array`)
        }
      }
    }

    if (!data.statistics) {
      warnings.push('Missing statistics section')
    }

    return { errors, warnings }
  }

  /**
   * Validate data integrity
   */
  private validateDataIntegrity(data: ExportData): { errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate players
    if (data.players) {
      data.players.forEach((player, index) => {
        if (!player.name) errors.push(`Player ${index + 1}: Missing name`)
        if (!player.organizer_id) errors.push(`Player ${index + 1}: Missing organizer_id`)
      })
    }

    // Validate sessions
    if (data.sessions) {
      data.sessions.forEach((session, index) => {
        if (!session.session_date) errors.push(`Session ${index + 1}: Missing session_date`)
        if (!session.organizer_id) errors.push(`Session ${index + 1}: Missing organizer_id`)
        // Don't validate total_cost as it's a generated column that won't be in exports
        if (session.court_cost !== undefined && typeof session.court_cost !== 'number') {
          errors.push(`Session ${index + 1}: Invalid court_cost`)
        }
        if (session.shuttlecock_cost !== undefined && typeof session.shuttlecock_cost !== 'number') {
          errors.push(`Session ${index + 1}: Invalid shuttlecock_cost`)
        }
      })
    }

    // Validate payments
    if (data.payments) {
      data.payments.forEach((payment, index) => {
        if (!payment.player_id) errors.push(`Payment ${index + 1}: Missing player_id`)
        if (!payment.organizer_id) errors.push(`Payment ${index + 1}: Missing organizer_id`)
        if (typeof payment.amount !== 'number') errors.push(`Payment ${index + 1}: Invalid amount`)
        if (!payment.payment_date) errors.push(`Payment ${index + 1}: Missing payment_date`)
      })
    }

    return { errors, warnings }
  }

  /**
   * Import locations
   */
  private async importLocations(locations: any[], organizerId: string, options: ImportOptions, idMappings: any) {
    const result = { processed: 0, created: 0, skipped: 0, conflicts: [] as ImportConflict[] }

    for (const location of locations) {
      result.processed++

      // Check for existing location
      const { data: existing } = await this.supabase
        .from('locations')
        .select('id')
        .eq('name', location.name)
        .eq('organizer_id', organizerId)
        .single()

      if (existing) {
        if (options.conflictResolution === 'skip_duplicates') {
          result.skipped++
          continue
        }
      }

      // Insert location
      const { error } = await this.supabase
        .from('locations')
        .insert({
          ...location,
          organizer_id: organizerId
        })

      if (!error) {
        result.created++
      } else {
        console.error('Error importing location:', error)
      }
    }

    return result
  }

  /**
   * Import players
   */
  private async importPlayers(players: any[], organizerId: string, options: ImportOptions, idMappings: any) {
    const result = { processed: 0, created: 0, skipped: 0, conflicts: [] as ImportConflict[] }

    for (const player of players) {
      result.processed++

      // Check for existing player by name
      const { data: existing } = await this.supabase
        .from('players')
        .select('id')
        .eq('name', player.name)
        .eq('organizer_id', organizerId)
        .single()

      if (existing) {
        if (options.conflictResolution === 'skip_duplicates') {
          result.skipped++
          continue
        }
      }

      // Insert player and get the new ID
      const { data: insertedPlayer, error } = await this.supabase
        .from('players')
        .insert({
          ...player,
          organizer_id: organizerId
        })
        .select('id')
        .single()

      if (!error && insertedPlayer) {
        result.created++
        // Map old ID to new ID for foreign key relationships
        idMappings.players.set(player.id, insertedPlayer.id)
        console.log(`✅ Successfully imported player: ${player.name} (${player.id} → ${insertedPlayer.id})`)
      } else {
        console.error('Error importing player:', error)
      }
    }

    return result
  }

  /**
   * Import sessions
   */
  private async importSessions(sessions: any[], organizerId: string, options: ImportOptions, idMappings: any) {
    const result = { processed: 0, created: 0, skipped: 0, conflicts: [] as ImportConflict[] }

    for (const session of sessions) {
      result.processed++

      // Check for existing session
      const { data: existing } = await this.supabase
        .from('sessions')
        .select('id')
        .eq('session_date', session.session_date)
        .eq('organizer_id', organizerId)
        .single()

      if (existing) {
        if (options.conflictResolution === 'skip_duplicates') {
          result.skipped++
          continue
        }
      }

      // Clean session data - remove generated columns and ensure proper structure
      const cleanSession = {
        id: session.id, // Keep original ID for foreign key relationships
        organizer_id: organizerId,
        title: session.title,
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        location: session.location,
        court_cost: session.court_cost,
        shuttlecock_cost: session.shuttlecock_cost,
        other_costs: session.other_costs || 0,
        // Don't include total_cost (generated column)
        // Don't include cost_per_player (generated column)
        player_count: session.player_count,
        status: session.status || 'completed',
        notes: session.notes,
        created_at: session.created_at,
        updated_at: session.updated_at
      }

      // Insert session and get the new ID
      const { data: insertedSession, error } = await this.supabase
        .from('sessions')
        .insert(cleanSession)
        .select('id')
        .single()

      if (!error && insertedSession) {
        result.created++
        // Map old ID to new ID for foreign key relationships
        idMappings.sessions.set(session.id, insertedSession.id)
        console.log(`✅ Successfully imported session: ${session.session_date} (${session.id} → ${insertedSession.id})`)
      } else {
        console.error('Error importing session:', error)
        console.error('Session data that failed:', cleanSession)
        
        // If it's a conflict error and we're replacing, try update
        if (error.code === '23505' && options.conflictResolution === 'replace_duplicates') {
          const { error: updateError } = await this.supabase
            .from('sessions')
            .update(cleanSession)
            .eq('session_date', session.session_date)
            .eq('organizer_id', organizerId)
            
          if (!updateError) {
            result.created++
            console.log(`✅ Updated existing session: ${session.session_date}`)
          } else {
            console.error('Error updating session:', updateError)
          }
        }
      }
    }

    return result
  }

  /**
   * Import session participants
   */
  private async importSessionParticipants(participants: any[], organizerId: string, options: ImportOptions, idMappings: any) {
    const result = { processed: 0, created: 0, skipped: 0, conflicts: [] as ImportConflict[] }

    for (const participant of participants) {
      result.processed++

      // Map old IDs to new IDs using our ID mappings
      const newSessionId = idMappings.sessions.get(participant.session_id)
      const newPlayerId = idMappings.players.get(participant.player_id)

      if (!newSessionId) {
        console.error(`❌ Session mapping not found for ${participant.session_id}, skipping participant...`)
        result.skipped++
        continue
      }

      if (!newPlayerId) {
        console.error(`❌ Player mapping not found for ${participant.player_id}, skipping participant...`)
        result.skipped++
        continue
      }

      // Check for existing participant using new IDs
      const { data: existing } = await this.supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', newSessionId)
        .eq('player_id', newPlayerId)
        .single()

      if (existing) {
        if (options.conflictResolution === 'skip_duplicates') {
          result.skipped++
          continue
        }
      }

      // Clean participant data with mapped IDs
      const cleanParticipant = {
        id: participant.id, // Keep original ID if possible
        session_id: newSessionId, // Use mapped session ID
        player_id: newPlayerId, // Use mapped player ID
        amount_owed: participant.amount_owed,
        notes: participant.notes,
        created_at: participant.created_at
      }

      // Insert participant
      const { error } = await this.supabase
        .from('session_participants')
        .insert(cleanParticipant)

      if (!error) {
        result.created++
        console.log(`✅ Successfully imported participant: session ${participant.session_id} → ${newSessionId}, player ${participant.player_id} → ${newPlayerId}`)
      } else {
        console.error('Error importing participant:', error)
        console.error('Participant data that failed:', cleanParticipant)
        
        // If it's a conflict error and we're replacing, try update
        if (error.code === '23505' && options.conflictResolution === 'replace_duplicates') {
          const { error: updateError } = await this.supabase
            .from('session_participants')
            .update(cleanParticipant)
            .eq('session_id', participant.session_id)
            .eq('player_id', participant.player_id)
            
          if (!updateError) {
            result.created++
            console.log(`✅ Updated existing participant for session ${participant.session_id}`)
          } else {
            console.error('Error updating participant:', updateError)
          }
        }
      }
    }

    return result
  }

  /**
   * Import payments
   */
  private async importPayments(payments: any[], organizerId: string, options: ImportOptions, idMappings: any) {
    const result = { processed: 0, created: 0, skipped: 0, conflicts: [] as ImportConflict[] }

    for (const payment of payments) {
      result.processed++

      // Map player ID for foreign key relationship
      const newPlayerId = idMappings.players.get(payment.player_id)
      if (!newPlayerId) {
        console.error(`❌ Player mapping not found for payment ${payment.id}, skipping...`)
        result.skipped++
        continue
      }

      // Insert payment with mapped player ID
      const { error } = await this.supabase
        .from('payments')
        .insert({
          ...payment,
          player_id: newPlayerId,
          organizer_id: organizerId
        })

      if (!error) {
        result.created++
      } else {
        console.error('Error importing payment:', error)
      }
    }

    return result
  }

  /**
   * Import player balances
   */
  private async importPlayerBalances(balances: any[], organizerId: string, options: ImportOptions, idMappings: any) {
    const result = { processed: 0, created: 0, skipped: 0, conflicts: [] as ImportConflict[] }

    for (const balance of balances) {
      result.processed++

      // Check for existing balance
      const { data: existing } = await this.supabase
        .from('player_balances')
        .select('id')
        .eq('player_id', balance.player_id)
        .eq('organizer_id', organizerId)
        .single()

      if (existing) {
        if (options.conflictResolution === 'skip_duplicates') {
          result.skipped++
          continue
        }
      }

      // Map player ID for foreign key relationship
      const newPlayerId = idMappings.players.get(balance.player_id)
      if (!newPlayerId) {
        console.error(`❌ Player mapping not found for balance ${balance.id}, skipping...`)
        result.skipped++
        continue
      }

      // Insert balance with mapped player ID
      const { error } = await this.supabase
        .from('player_balances')
        .insert({
          ...balance,
          player_id: newPlayerId,
          organizer_id: organizerId
        })

      if (!error) {
        result.created++
      } else {
        console.error('Error importing balance:', error)
      }
    }

    return result
  }
}

// Export singleton instance
export const dataImportService = new DataImportService()