import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Location = Database['public']['Tables']['locations']['Row']
type LocationInsert = Database['public']['Tables']['locations']['Insert']
type LocationUpdate = Database['public']['Tables']['locations']['Update']

export class LocationService {
  private supabase = createClientSupabaseClient()

  /**
   * Get all active locations for an organizer
   */
  async getLocationsByOrganizer(organizerId: string, includeInactive = false) {
    let query = this.supabase
      .from('locations')
      .select('*')
      .eq('organizer_id', organizerId)

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
      .order('name')

    if (error) {
      console.error('Error fetching locations:', error)
      throw new Error(`Failed to fetch locations: ${error.message}`)
    }

    return data || []
  }

  /**
   * Sanitize text input to remove problematic characters
   */
  private sanitizeText(input: string | null | undefined): string | undefined {
    if (!input) return undefined
    
    return input
      // Replace non-breaking spaces with regular spaces
      .replace(/\u00A0/g, ' ')
      // Remove zero-width characters
      .replace(/[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E]/g, '')
      // Replace smart quotes with regular quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Replace em dashes and en dashes with regular hyphens
      .replace(/[—–]/g, '-')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim() || undefined
  }

  /**
   * Create a new location
   */
  async createLocation(locationData: Omit<LocationInsert, 'id' | 'created_at' | 'updated_at'>) {
    console.log('🏗️ LocationService: Creating location with data:', locationData)
    
    // Sanitize all text fields
    const sanitizedData = {
      ...locationData,
      name: this.sanitizeText(locationData.name) || '',
      address: this.sanitizeText(locationData.address),
      notes: this.sanitizeText(locationData.notes)
    }
    
    console.log('🧹 LocationService: Sanitized data:', sanitizedData)
    
    const { data, error } = await this.supabase
      .from('locations')
      .insert([sanitizedData])
      .select()
      .single()

    if (error) {
      console.error('❌ LocationService: Error creating location:', error)
      console.error('❌ LocationService: Error details:', { code: error.code, message: error.message, details: error.details })
      throw new Error(`Failed to create location: ${error.message}`)
    }

    console.log('✅ LocationService: Location created successfully:', data)
    return data
  }

  /**
   * Update a location
   */
  async updateLocation(locationId: string, updates: LocationUpdate) {
    const { data, error } = await this.supabase
      .from('locations')
      .update(updates)
      .eq('id', locationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating location:', error)
      throw new Error(`Failed to update location: ${error.message}`)
    }

    return data
  }

  /**
   * Soft delete a location (deactivate)
   */
  async deactivateLocation(locationId: string) {
    const { error } = await this.supabase
      .from('locations')
      .update({ is_active: false })
      .eq('id', locationId)

    if (error) {
      console.error('Error deactivating location:', error)
      throw new Error(`Failed to deactivate location: ${error.message}`)
    }

    return true
  }

  /**
   * Hard delete a location (only if not used in any sessions)
   */
  async deleteLocation(locationId: string) {
    // First check if location is used in any sessions
    const { data: sessions, error: sessionError } = await this.supabase
      .from('sessions')
      .select('id')
      .eq('location', locationId)
      .limit(1)

    if (sessionError) {
      console.error('Error checking location usage:', sessionError)
      throw new Error(`Failed to check location usage: ${sessionError.message}`)
    }

    if (sessions && sessions.length > 0) {
      throw new Error('Cannot delete location that is used in existing sessions. Deactivate instead.')
    }

    const { error } = await this.supabase
      .from('locations')
      .delete()
      .eq('id', locationId)

    if (error) {
      console.error('Error deleting location:', error)
      throw new Error(`Failed to delete location: ${error.message}`)
    }

    return true
  }

  /**
   * Get a specific location by ID
   */
  async getLocationById(locationId: string) {
    const { data, error } = await this.supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching location:', error)
      throw new Error(`Failed to fetch location: ${error.message}`)
    }

    return data
  }

  /**
   * Search locations by name
   */
  async searchLocations(organizerId: string, searchTerm: string) {
    const { data, error } = await this.supabase
      .from('locations')
      .select('*')
      .eq('organizer_id', organizerId)
      .eq('is_active', true)
      .ilike('name', `%${searchTerm}%`)
      .order('name')
      .limit(10)

    if (error) {
      console.error('Error searching locations:', error)
      throw new Error(`Failed to search locations: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get location usage statistics
   */
  async getLocationStats(organizerId: string) {
    const { data, error } = await this.supabase
      .from('locations')
      .select(`
        id,
        name,
        sessions:sessions(count)
      `)
      .eq('organizer_id', organizerId)

    if (error) {
      console.error('Error fetching location stats:', error)
      throw new Error(`Failed to fetch location statistics: ${error.message}`)
    }

    return data || []
  }

  /**
   * Subscribe to location changes for real-time updates
   */
  subscribeToLocationChanges(organizerId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('location-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations',
          filter: `organizer_id=eq.${organizerId}`
        },
        callback
      )
      .subscribe()
  }
}

// Export singleton instance
export const locationService = new LocationService()

// Export types for use in components
export type { Location, LocationInsert, LocationUpdate }