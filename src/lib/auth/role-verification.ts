/**
 * Role verification utilities for secure access control
 */

import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/supabase/types'

const supabase = createClientSupabaseClient()

/**
 * Verify user role directly from database (bypasses client-side role state)
 * This is the most secure way to check roles as it always queries the source of truth
 */
export async function verifyUserRole(userId: string): Promise<UserRole | null> {
  console.log('🔐 Verifying user role from database for:', userId)
  
  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ Error verifying user role:', error)
      return null
    }
    
    console.log('✅ User role verified:', userProfile?.role)
    return userProfile?.role || null
  } catch (error) {
    console.error('❌ Exception verifying user role:', error)
    return null
  }
}

/**
 * Check if user has organizer access (secure database check)
 */
export async function hasOrganizerAccess(userId: string): Promise<boolean> {
  const role = await verifyUserRole(userId)
  return role === 'organizer'
}

/**
 * Check if user has player access (secure database check)
 */
export async function hasPlayerAccess(userId: string): Promise<boolean> {
  const role = await verifyUserRole(userId)
  return role === 'player' || role === 'organizer' // organizers can also access player features
}

/**
 * Promote a user to organizer role (admin function)
 */
export async function promoteToOrganizer(userId: string): Promise<{ success: boolean; error?: string }> {
  console.log('👑 Promoting user to organizer:', userId)
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'organizer', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error promoting user to organizer:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ User promoted to organizer successfully:', data)
    return { success: true }
  } catch (error) {
    console.error('❌ Exception promoting user to organizer:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get current authenticated user's role from database
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return null
    }
    
    return await verifyUserRole(user.id)
  } catch (error) {
    console.error('❌ Error getting current user role:', error)
    return null
  }
}