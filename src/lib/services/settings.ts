import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type OrganizerSettings = Database['public']['Tables']['organizer_settings']['Row']
type OrganizerSettingsInsert = Database['public']['Tables']['organizer_settings']['Insert']

export interface CourtRates {
  indoorPeak: number
  indoorOffPeak: number
  outdoor: number
  community: number
}

export interface ShuttlecockRates {
  peak: number
  offPeak: number
  outdoor: number
  community: number
}

export interface PeakHours {
  morningStart: string // HH:MM format
  morningEnd: string
  eveningStart: string
  eveningEnd: string
}

export interface SettingsFormData {
  courtRates: CourtRates
  shuttlecockRates: ShuttlecockRates
  peakHours: PeakHours
  defaultCourtType: 'indoor_peak' | 'indoor_offpeak' | 'outdoor' | 'community'
  autoRateSelection: boolean
  autoShuttlecockEstimation: boolean
}

export interface EffectiveRates {
  courtRate: number
  shuttlecockRate: number
  courtType: string
  isPeakTime: boolean
}

export class SettingsService {
  private supabase = createClientSupabaseClient()

  /**
   * Get organizer settings
   */
  async getSettings(organizerId: string): Promise<SettingsFormData> {
    console.log('🔧 SettingsService: Loading settings for organizer:', organizerId)

    const { data, error } = await this.supabase
      .from('organizer_settings')
      .select('*')
      .eq('organizer_id', organizerId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found - return defaults
        console.log('📋 No settings found, returning defaults')
        return this.getDefaultSettings()
      }
      console.error('❌ Error fetching settings:', error)
      throw new Error(`Failed to fetch settings: ${error.message}`)
    }

    console.log('✅ Settings loaded successfully')
    return this.transformToFormData(data)
  }

  /**
   * Create or update organizer settings
   */
  async updateSettings(organizerId: string, settings: SettingsFormData): Promise<OrganizerSettings> {
    console.log('💾 SettingsService: Updating settings for organizer:', organizerId)

    const dbData = this.transformToDbData(organizerId, settings)

    const { data, error } = await this.supabase
      .from('organizer_settings')
      .upsert(dbData, {
        onConflict: 'organizer_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating settings:', error)
      throw new Error(`Failed to update settings: ${error.message}`)
    }

    console.log('✅ Settings updated successfully')
    return data
  }

  /**
   * Get effective rates for a specific time and court type
   */
  async getEffectiveRates(
    organizerId: string, 
    sessionTime: string, 
    courtType?: string
  ): Promise<EffectiveRates> {
    console.log('🎯 SettingsService: Getting effective rates for time:', sessionTime, 'court type:', courtType)

    try {
      // Call the database function to get effective rates
      const { data: courtRateData, error: courtError } = await this.supabase
        .rpc('get_effective_court_rate', {
          organizer_id: organizerId,
          session_time: sessionTime,
          court_type: courtType
        })

      if (courtError) {
        console.error('❌ Error getting court rate:', courtError)
        throw courtError
      }

      const { data: shuttlecockRateData, error: shuttlecockError } = await this.supabase
        .rpc('get_effective_shuttlecock_rate', {
          organizer_id: organizerId,
          session_time: sessionTime,
          court_type: courtType
        })

      if (shuttlecockError) {
        console.error('❌ Error getting shuttlecock rate:', shuttlecockError)
        throw shuttlecockError
      }

      // Determine if it's peak time
      const settings = await this.getSettings(organizerId)
      const isPeakTime = this.isPeakTime(sessionTime, settings.peakHours)

      // Determine effective court type
      const effectiveCourtType = courtType || (isPeakTime ? 'indoor_peak' : 'indoor_offpeak')

      const result = {
        courtRate: courtRateData || 50.00,
        shuttlecockRate: shuttlecockRateData || 2.50,
        courtType: effectiveCourtType,
        isPeakTime
      }

      console.log('✅ Effective rates calculated:', result)
      return result

    } catch (error: any) {
      console.error('❌ Error calculating effective rates:', error)
      // Return defaults on error
      return {
        courtRate: 50.00,
        shuttlecockRate: 2.50,
        courtType: courtType || 'indoor_peak',
        isPeakTime: false
      }
    }
  }

  /**
   * Check if a time is within peak hours
   */
  isPeakTime(sessionTime: string, peakHours: PeakHours): boolean {
    const time = sessionTime.substring(0, 5) // Extract HH:MM
    
    // Morning peak
    if (time >= peakHours.morningStart && time < peakHours.morningEnd) {
      return true
    }
    
    // Evening peak
    if (time >= peakHours.eveningStart && time < peakHours.eveningEnd) {
      return true
    }
    
    return false
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): SettingsFormData {
    return {
      courtRates: {
        indoorPeak: 50.00,
        indoorOffPeak: 35.00,
        outdoor: 15.00,
        community: 25.00
      },
      shuttlecockRates: {
        peak: 2.50,
        offPeak: 2.00,
        outdoor: 1.50,
        community: 1.80
      },
      peakHours: {
        morningStart: '07:00',
        morningEnd: '10:00',
        eveningStart: '18:00',
        eveningEnd: '22:00'
      },
      defaultCourtType: 'indoor_peak',
      autoRateSelection: true,
      autoShuttlecockEstimation: true
    }
  }

  /**
   * Transform database data to form data
   */
  private transformToFormData(data: OrganizerSettings): SettingsFormData {
    return {
      courtRates: {
        indoorPeak: data.indoor_peak_rate,
        indoorOffPeak: data.indoor_offpeak_rate,
        outdoor: data.outdoor_rate,
        community: data.community_rate
      },
      shuttlecockRates: {
        peak: data.shuttlecock_peak_rate,
        offPeak: data.shuttlecock_offpeak_rate,
        outdoor: data.shuttlecock_outdoor_rate,
        community: data.shuttlecock_community_rate
      },
      peakHours: {
        morningStart: data.morning_peak_start_time.substring(0, 5),
        morningEnd: data.morning_peak_end_time.substring(0, 5),
        eveningStart: data.peak_start_time.substring(0, 5),
        eveningEnd: data.peak_end_time.substring(0, 5)
      },
      defaultCourtType: data.default_court_type as any,
      autoRateSelection: data.auto_rate_selection,
      autoShuttlecockEstimation: data.auto_shuttlecock_estimation
    }
  }

  /**
   * Transform form data to database data
   */
  private transformToDbData(organizerId: string, settings: SettingsFormData): OrganizerSettingsInsert {
    return {
      organizer_id: organizerId,
      indoor_peak_rate: settings.courtRates.indoorPeak,
      indoor_offpeak_rate: settings.courtRates.indoorOffPeak,
      outdoor_rate: settings.courtRates.outdoor,
      community_rate: settings.courtRates.community,
      shuttlecock_peak_rate: settings.shuttlecockRates.peak,
      shuttlecock_offpeak_rate: settings.shuttlecockRates.offPeak,
      shuttlecock_outdoor_rate: settings.shuttlecockRates.outdoor,
      shuttlecock_community_rate: settings.shuttlecockRates.community,
      morning_peak_start_time: `${settings.peakHours.morningStart  }:00`,
      morning_peak_end_time: `${settings.peakHours.morningEnd  }:00`,
      peak_start_time: `${settings.peakHours.eveningStart  }:00`,
      peak_end_time: `${settings.peakHours.eveningEnd  }:00`,
      default_court_type: settings.defaultCourtType,
      auto_rate_selection: settings.autoRateSelection,
      auto_shuttlecock_estimation: settings.autoShuttlecockEstimation
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService()

// Export types
export type { SettingsFormData, CourtRates, ShuttlecockRates, PeakHours, EffectiveRates }