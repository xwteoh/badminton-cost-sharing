import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

// Types for export data structure
export interface ExportMetadata {
  export_date: string
  app_version: string
  organizer_id: string
  total_records: number
  export_type: 'full_backup' | 'date_range' | 'selective'
}

export interface ExportStatistics {
  date_range: {
    earliest_session: string | null
    latest_session: string | null
  }
  totals: {
    total_sessions: number
    total_players: number
    total_payments: number
    total_amount_handled: number
  }
}

export interface ExportData {
  players: Database['public']['Tables']['players']['Row'][]
  sessions: Database['public']['Tables']['sessions']['Row'][]
  session_participants: Database['public']['Tables']['session_participants']['Row'][]
  payments: Database['public']['Tables']['payments']['Row'][]
  player_balances: Database['public']['Tables']['player_balances']['Row'][]
  locations: Database['public']['Tables']['locations']['Row'][]
}

export interface DataExportFile {
  metadata: ExportMetadata
  data: ExportData
  statistics: ExportStatistics
}

export interface ExportOptions {
  type: 'full_backup' | 'date_range' | 'selective'
  dateRange?: {
    startDate: string
    endDate: string
  }
  includeTypes?: Array<keyof ExportData>
}

export interface ExportResult {
  success: boolean
  message: string
  filename: string
  fileSize: number
  recordCounts: Record<keyof ExportData, number>
  errors: string[]
}

export class DataExportService {
  private supabase = createClientSupabaseClient()
  
  /**
   * Export all organizer data to downloadable JSON file
   */
  async exportOrganizerData(organizerId: string, options: ExportOptions = { type: 'full_backup' }): Promise<ExportResult> {
    const result: ExportResult = {
      success: false,
      message: '',
      filename: '',
      fileSize: 0,
      recordCounts: {
        players: 0,
        sessions: 0,
        session_participants: 0,
        payments: 0,
        player_balances: 0,
        locations: 0
      },
      errors: []
    }

    try {
      console.log('🎯 Starting data export for organizer:', organizerId)
      console.log('📋 Export options:', options)

      // Fetch all data
      const exportData = await this.fetchOrganizerData(organizerId, options)
      
      // Calculate statistics
      const statistics = this.calculateStatistics(exportData)
      
      // Create metadata
      const metadata: ExportMetadata = {
        export_date: new Date().toISOString(),
        app_version: '1.0.0', // TODO: Get from package.json
        organizer_id: organizerId,
        total_records: Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0),
        export_type: options.type
      }

      // Create final export file
      const exportFile: DataExportFile = {
        metadata,
        data: exportData,
        statistics
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `badminton-backup-${timestamp}.json`
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportFile, null, 2)
      const fileSize = new Blob([jsonString]).size

      // Trigger download
      await this.downloadFile(jsonString, filename)

      // Update result
      result.success = true
      result.message = `Export completed successfully! ${metadata.total_records} records exported.`
      result.filename = filename
      result.fileSize = fileSize
      result.recordCounts = {
        players: exportData.players.length,
        sessions: exportData.sessions.length,
        session_participants: exportData.session_participants.length,
        payments: exportData.payments.length,
        player_balances: exportData.player_balances.length,
        locations: exportData.locations.length
      }

      console.log('✅ Export completed successfully:', result)
      return result

    } catch (error) {
      console.error('❌ Export failed:', error)
      result.success = false
      result.message = `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      return result
    }
  }

  /**
   * Fetch all organizer data from database
   */
  private async fetchOrganizerData(organizerId: string, options: ExportOptions): Promise<ExportData> {
    const data: ExportData = {
      players: [],
      sessions: [],
      session_participants: [],
      payments: [],
      player_balances: [],
      locations: []
    }

    console.log('📊 Fetching organizer data...')

    // 1. Fetch players
    if (!options.includeTypes || options.includeTypes.includes('players')) {
      console.log('👥 Fetching players...')
      const { data: players, error: playersError } = await this.supabase
        .from('players')
        .select('*')
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: true })
        .limit(10000) // Increase limit to handle large datasets

      if (playersError) throw playersError
      data.players = players || []
      console.log(`✅ Fetched ${data.players.length} players`)
    }

    // 2. Fetch sessions with date filtering (excluding generated columns)
    if (!options.includeTypes || options.includeTypes.includes('sessions')) {
      console.log('🏸 Fetching sessions...')
      let sessionsQuery = this.supabase
        .from('sessions')
        .select(`
          id,
          organizer_id,
          title,
          session_date,
          start_time,
          end_time,
          location,
          court_cost,
          shuttlecock_cost,
          other_costs,
          player_count,
          status,
          notes,
          created_at,
          updated_at
        `)
        .eq('organizer_id', organizerId)

      // Apply date range filter if specified
      if (options.dateRange) {
        sessionsQuery = sessionsQuery
          .gte('session_date', options.dateRange.startDate)
          .lte('session_date', options.dateRange.endDate)
      }

      const { data: sessions, error: sessionsError } = await sessionsQuery
        .order('session_date', { ascending: true })
        .limit(10000) // Increase limit to handle large datasets

      if (sessionsError) throw sessionsError
      data.sessions = sessions || []
      console.log(`✅ Fetched ${data.sessions.length} sessions (excluding generated columns)`)
    }

    // 3. Fetch session participants (only for exported sessions)
    if (!options.includeTypes || options.includeTypes.includes('session_participants')) {
      if (data.sessions.length > 0) {
        console.log('📋 Fetching session participants...')
        const sessionIds = data.sessions.map(s => s.id)
        
        console.log(`🔍 Export: Querying participants for ${sessionIds.length} sessions (IDs: ${sessionIds.slice(0, 5).join(', ')}${sessionIds.length > 5 ? '...' : ''})`)
        
        // Try pagination approach to get ALL participants
        let allParticipants: any[] = []
        let hasMore = true
        let page = 0
        const pageSize = 1000
        
        while (hasMore) {
          const { data: pageParticipants, error: participantsError, count } = await this.supabase
            .from('session_participants')
            .select('*', { count: page === 0 ? 'exact' : undefined })
            .in('session_id', sessionIds)
            .range(page * pageSize, (page + 1) * pageSize - 1)
          
          if (participantsError) throw participantsError
          
          if (pageParticipants && pageParticipants.length > 0) {
            allParticipants.push(...pageParticipants)
            console.log(`🔍 Export: Page ${page + 1} returned ${pageParticipants.length} participants (total so far: ${allParticipants.length})`)
            hasMore = pageParticipants.length === pageSize
            page++
          } else {
            hasMore = false
          }
          
          if (page === 0 && count) {
            console.log(`🔍 Export: Total participants expected: ${count}`)
          }
        }
        
        console.log(`🔍 Export: Pagination complete - fetched ${allParticipants.length} total participants`)
        
        data.session_participants = allParticipants
        console.log(`✅ Fetched ${data.session_participants.length} session participants`)
      }
    }

    // 4. Fetch payments with date filtering
    if (!options.includeTypes || options.includeTypes.includes('payments')) {
      console.log('💰 Fetching payments...')
      let paymentsQuery = this.supabase
        .from('payments')
        .select('*')
        .eq('organizer_id', organizerId)

      // Apply date range filter if specified
      if (options.dateRange) {
        paymentsQuery = paymentsQuery
          .gte('payment_date', options.dateRange.startDate)
          .lte('payment_date', options.dateRange.endDate)
      }

      const { data: payments, error: paymentsError } = await paymentsQuery
        .order('payment_date', { ascending: true })
        .limit(10000) // Increase limit to handle large datasets

      if (paymentsError) throw paymentsError
      data.payments = payments || []
      console.log(`✅ Fetched ${data.payments.length} payments`)
    }

    // 5. Fetch player balances
    if (!options.includeTypes || options.includeTypes.includes('player_balances')) {
      console.log('⚖️ Fetching player balances...')
      const { data: balances, error: balancesError } = await this.supabase
        .from('player_balances')
        .select('*')
        .eq('organizer_id', organizerId)
        .order('updated_at', { ascending: true })
        .limit(10000) // Increase limit to handle large datasets

      if (balancesError) throw balancesError
      data.player_balances = balances || []
      console.log(`✅ Fetched ${data.player_balances.length} player balances`)
    }

    // 6. Fetch locations
    if (!options.includeTypes || options.includeTypes.includes('locations')) {
      console.log('📍 Fetching locations...')
      const { data: locations, error: locationsError } = await this.supabase
        .from('locations')
        .select('*')
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: true })
        .limit(10000) // Increase limit to handle large datasets

      if (locationsError) throw locationsError
      data.locations = locations || []
      console.log(`✅ Fetched ${data.locations.length} locations`)
    }

    return data
  }

  /**
   * Calculate export statistics
   */
  private calculateStatistics(data: ExportData): ExportStatistics {
    const sessions = data.sessions
    const payments = data.payments

    // Find date range
    const sessionDates = sessions.map(s => s.session_date).filter(Boolean).sort()
    const earliestSession = sessionDates.length > 0 ? sessionDates[0] : null
    const latestSession = sessionDates.length > 0 ? sessionDates[sessionDates.length - 1] : null

    // Calculate total amount handled
    const totalAmountHandled = payments.reduce((sum, payment) => sum + payment.amount, 0)

    return {
      date_range: {
        earliest_session: earliestSession,
        latest_session: latestSession
      },
      totals: {
        total_sessions: sessions.length,
        total_players: data.players.length,
        total_payments: payments.length,
        total_amount_handled: Math.round(totalAmountHandled * 10) / 10 // Round to 1 decimal place
      }
    }
  }

  /**
   * Download file to user's device
   */
  private async downloadFile(content: string, filename: string): Promise<void> {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
  }

  /**
   * Get export preview (record counts without full export)
   */
  async getExportPreview(organizerId: string, options: ExportOptions = { type: 'full_backup' }): Promise<{
    success: boolean
    recordCounts: Record<keyof ExportData, number>
    dateRange: { earliest: string | null, latest: string | null }
    estimatedFileSize: string
    error?: string
  }> {
    try {
      console.log('👀 Getting export preview for organizer:', organizerId)

      const counts: Record<keyof ExportData, number> = {
        players: 0,
        sessions: 0,
        session_participants: 0,
        payments: 0,
        player_balances: 0,
        locations: 0
      }

      // Count players
      const { count: playersCount } = await this.supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', organizerId)
      counts.players = playersCount || 0

      // Count sessions (with date filter if specified)
      let sessionsQuery = this.supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', organizerId)

      if (options.dateRange) {
        sessionsQuery = sessionsQuery
          .gte('session_date', options.dateRange.startDate)
          .lte('session_date', options.dateRange.endDate)
      }

      const { count: sessionsCount } = await sessionsQuery
      counts.sessions = sessionsCount || 0

      // Count payments (with date filter if specified)
      let paymentsQuery = this.supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', organizerId)

      if (options.dateRange) {
        paymentsQuery = paymentsQuery
          .gte('payment_date', options.dateRange.startDate)
          .lte('payment_date', options.dateRange.endDate)
      }

      const { count: paymentsCount } = await paymentsQuery
      counts.payments = paymentsCount || 0

      // Count session participants (only for sessions that will be exported)
      let participantsCount = 0
      if ((!options.includeTypes || options.includeTypes.includes('session_participants')) && counts.sessions > 0) {
        // Get session IDs that will be exported (exactly matching the export logic)
        let sessionIdsQuery = this.supabase
          .from('sessions')
          .select(`
            id,
            organizer_id,
            title,
            session_date,
            start_time,
            end_time,
            location,
            court_cost,
            shuttlecock_cost,
            other_costs,
            player_count,
            status,
            notes,
            created_at,
            updated_at
          `)
          .eq('organizer_id', organizerId)

        if (options.dateRange) {
          sessionIdsQuery = sessionIdsQuery
            .gte('session_date', options.dateRange.startDate)
            .lte('session_date', options.dateRange.endDate)
        }

        const { data: sessions } = await sessionIdsQuery
          .order('session_date', { ascending: true })
          .limit(10000) // Increase limit to handle large datasets
        
        if (sessions && sessions.length > 0) {
          console.log(`🔍 Preview: Found ${sessions.length} sessions to check for participants`)
          const sessionIds = sessions.map(s => s.id)
          const { count: participantsResult } = await this.supabase
            .from('session_participants')
            .select('*', { count: 'exact', head: true })
            .in('session_id', sessionIds)
          participantsCount = participantsResult || 0
          console.log(`🔍 Preview: Found ${participantsCount} session participants for these ${sessionIds.length} sessions`)
        } else {
          console.log(`🔍 Preview: No sessions found, participants count = 0`)
        }
      }

      // Count other records
      const [balancesResult, locationsResult] = await Promise.all([
        this.supabase.from('player_balances').select('*', { count: 'exact', head: true }).eq('organizer_id', organizerId),
        this.supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organizer_id', organizerId)
      ])

      counts.session_participants = participantsCount
      counts.player_balances = balancesResult.count || 0
      counts.locations = locationsResult.count || 0

      // Get date range
      const { data: sessionDates } = await this.supabase
        .from('sessions')
        .select('session_date')
        .eq('organizer_id', organizerId)
        .order('session_date', { ascending: true })

      const dates = sessionDates?.map(s => s.session_date).filter(Boolean) || []
      const dateRange = {
        earliest: dates.length > 0 ? dates[0] : null,
        latest: dates.length > 0 ? dates[dates.length - 1] : null
      }

      // Estimate file size (rough calculation)
      const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0)
      const estimatedFileSize = totalRecords < 100 ? '< 1 MB' : 
                              totalRecords < 1000 ? '1-5 MB' : 
                              totalRecords < 5000 ? '5-25 MB' : '> 25 MB'

      console.log('✅ Export preview generated:', { counts, dateRange, estimatedFileSize })

      return {
        success: true,
        recordCounts: counts,
        dateRange,
        estimatedFileSize
      }

    } catch (error) {
      console.error('❌ Error getting export preview:', error)
      return {
        success: false,
        recordCounts: {
          players: 0,
          sessions: 0,
          session_participants: 0,
          payments: 0,
          player_balances: 0,
          locations: 0
        },
        dateRange: { earliest: null, latest: null },
        estimatedFileSize: 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const dataExportService = new DataExportService()