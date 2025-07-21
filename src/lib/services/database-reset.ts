import { createClientSupabaseClient } from '@/lib/supabase/client'

export class DatabaseResetService {
  private supabase = createClientSupabaseClient()

  /**
   * DANGER: Reset all database records for the organizer
   * This will delete ALL data including sessions, players, payments, etc.
   */
  async resetDatabase(organizerId: string): Promise<{
    success: boolean
    message: string
    deletedCounts: {
      sessions: number
      session_participants: number
      payments: number
      players: number
      locations: number
      organizer_settings: number
    }
    errors: string[]
  }> {
    const result = {
      success: false,
      message: '',
      deletedCounts: {
        sessions: 0,
        session_participants: 0,
        payments: 0,
        players: 0,
        locations: 0,
        organizer_settings: 0
      },
      errors: [] as string[]
    }

    try {
      console.log(`🚨 Starting database reset for organizer: ${organizerId}`)
      
      // Let's also check what's in the auth and see if there's a mismatch
      const { data: currentUser, error: userError } = await this.supabase.auth.getUser()
      console.log('🔍 Current authenticated user:', currentUser?.user?.id)
      console.log('🔍 Organizer ID passed to reset:', organizerId)
      
      if (userError) {
        result.errors.push(`Authentication error: ${userError.message}`)
        result.success = false
        result.message = 'User not authenticated'
        return result
      }

      // Use database function for safe deletion that handles all constraints
      console.log('🔧 Calling database function for safe reset...')
      let resetResults: any
      let resetError: any

      // First try the safe function
      const { data: safeResults, error: safeError } = await this.supabase
        .rpc('safe_reset_organizer_data')

      if (safeError) {
        console.error('❌ Safe database function error:', safeError)
        
        // If safe function fails, try the admin function with the user ID
        console.log('🔧 Trying admin reset function as fallback...')
        const { data: adminResults, error: adminError } = await this.supabase
          .rpc('admin_reset_organizer_data', { target_organizer_id: currentUser?.user?.id })

        if (adminError) {
          console.error('❌ Admin database function error:', adminError)
          result.errors.push(`Database function error: ${adminError.message}`)
          result.success = false
          result.message = `Database reset failed: ${adminError.message}`
          return result
        }
        
        resetResults = adminResults
        resetError = adminError
      } else {
        resetResults = safeResults
        resetError = safeError
      }

      console.log('📊 Database function results:', resetResults)

      // Process the results from the database function
      if (resetResults && Array.isArray(resetResults)) {
        let totalDeleted = 0
        let hasErrors = false

        for (const row of resetResults) {
          const { table_name, records_deleted, success, error_message } = row

          if (success) {
            console.log(`✅ ${table_name}: Deleted ${records_deleted} records`)
            
            // Map table names to our result structure
            switch (table_name) {
              case 'sessions':
                result.deletedCounts.sessions = records_deleted
                totalDeleted += records_deleted
                break
              case 'session_participants':
                result.deletedCounts.session_participants = records_deleted
                totalDeleted += records_deleted
                break
              case 'payments':
                result.deletedCounts.payments = records_deleted
                totalDeleted += records_deleted
                break
              case 'players':
                result.deletedCounts.players = records_deleted
                totalDeleted += records_deleted
                break
              case 'locations':
                result.deletedCounts.locations = records_deleted
                totalDeleted += records_deleted
                break
              case 'organizer_settings':
                result.deletedCounts.organizer_settings = records_deleted
                totalDeleted += records_deleted
                break
              case 'player_balances':
                // Note: player_balances is not in our standard count structure
                console.log(`🗑️ Also deleted ${records_deleted} player balance records`)
                totalDeleted += records_deleted
                break
            }
          } else {
            console.error(`❌ ${table_name}: ${error_message}`)
            result.errors.push(`${table_name}: ${error_message}`)
            hasErrors = true
          }
        }

        if (!hasErrors && totalDeleted > 0) {
          result.success = true
          result.message = `Database reset successful! Deleted ${totalDeleted} records total.`
          console.log(`✅ Database reset completed successfully - ${totalDeleted} records deleted`)
        } else if (totalDeleted > 0) {
          result.success = true // Partial success
          result.message = `Database reset completed with some errors. Deleted ${totalDeleted} records total.`
          console.log(`⚠️ Database reset completed with errors - ${totalDeleted} records deleted`)
        } else {
          result.success = false
          result.message = 'No records were deleted. ' + (hasErrors ? 'Errors occurred.' : 'No data found for this organizer.')
          console.log('⚠️ No records deleted')
        }
      } else {
        result.success = false
        result.message = 'Unexpected response from database function'
        result.errors.push('Database function returned unexpected format')
      }

    } catch (error) {
      console.error('❌ Database reset failed:', error)
      result.success = false
      result.message = `Database reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Get a preview of what would be deleted (for confirmation dialogs)
   */
  async getResetPreview(organizerId: string): Promise<{
    success: boolean
    counts: {
      sessions: number
      session_participants: number
      payments: number
      players: number
      locations: number
      organizer_settings: number
    }
    error?: string
  }> {
    try {
      console.log(`📊 Getting reset preview for organizer: ${organizerId}`)
      
      // Debug: Check current auth user vs passed organizer ID
      const { data: currentUser } = await this.supabase.auth.getUser()
      console.log('🔍 Preview - Current auth user:', currentUser?.user?.id)
      console.log('🔍 Preview - Organizer ID passed:', organizerId)

      // Check if we need to use the current auth user ID instead
      let actualOrganizerId = organizerId
      const { data: testSessions } = await this.supabase
        .from('sessions')
        .select('id')
        .eq('organizer_id', organizerId)
        .limit(1)
      
      if ((!testSessions || testSessions.length === 0) && currentUser?.user?.id && currentUser.user.id !== organizerId) {
        console.log('🔄 Preview - No sessions found with passed organizer ID, trying with auth user ID')
        actualOrganizerId = currentUser.user.id
      }
      
      console.log(`🎯 Preview - Using organizer ID: ${actualOrganizerId}`)

      // Count all records that would be deleted (handle table structure differences)
      const [
        sessionsResult,
        paymentsResult,
        playersResult,
        locationsResult
      ] = await Promise.all([
        this.supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('organizer_id', actualOrganizerId),
        this.supabase.from('payments').select('id', { count: 'exact', head: true }).eq('organizer_id', actualOrganizerId),
        this.supabase.from('players').select('id', { count: 'exact', head: true }).eq('organizer_id', actualOrganizerId),
        this.supabase.from('locations').select('id', { count: 'exact', head: true }).eq('organizer_id', actualOrganizerId)
      ])

      // Count session participants separately (avoid complex joins)
      let participantsCount = 0
      if (sessionsResult.count && sessionsResult.count > 0) {
        const { data: sessions } = await this.supabase
          .from('sessions')
          .select('id')
          .eq('organizer_id', actualOrganizerId)
        
        if (sessions && sessions.length > 0) {
          const sessionIds = sessions.map(s => s.id)
          const participantsResult = await this.supabase
            .from('session_participants')
            .select('id', { count: 'exact', head: true })
            .in('session_id', sessionIds)
          participantsCount = participantsResult.count || 0
        }
      }

      // Count organizer settings separately (table might have different structure)
      let settingsCount = 0
      try {
        const settingsResult = await this.supabase
          .from('organizer_settings')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', actualOrganizerId)
        settingsCount = settingsResult.count || 0
      } catch (error) {
        console.log('⚠️ Could not count organizer settings (table structure issue):', error)
        settingsCount = 0
      }

      const counts = {
        sessions: sessionsResult.count || 0,
        session_participants: participantsCount,
        payments: paymentsResult.count || 0,
        players: playersResult.count || 0,
        locations: locationsResult.count || 0,
        organizer_settings: settingsCount
      }

      console.log('📊 Reset preview counts:', counts)

      return {
        success: true,
        counts
      }

    } catch (error) {
      console.error('❌ Error getting reset preview:', error)
      return {
        success: false,
        counts: {
          sessions: 0,
          session_participants: 0,
          payments: 0,
          players: 0,
          locations: 0,
          organizer_settings: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const databaseResetService = new DatabaseResetService()