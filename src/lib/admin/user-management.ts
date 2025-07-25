/**
 * Admin utilities for user management
 * IMPORTANT: These functions should only be used by system administrators
 */

import { createClientSupabaseClient } from '@/lib/supabase/client'
import { promoteToOrganizer, verifyUserRole } from '@/lib/auth/role-verification'

const supabase = createClientSupabaseClient()

/**
 * Find user by phone number for promotion
 */
export async function findUserByPhone(phoneNumber: string) {
  console.log('🔍 Finding user by phone:', phoneNumber)
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
    
    if (error) {
      console.error('❌ Error finding user by phone:', error)
      return { success: false, error: error.message, users: [] }
    }
    
    console.log('✅ Found users:', users?.length || 0)
    return { success: true, users: users || [] }
  } catch (error) {
    console.error('❌ Exception finding user by phone:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      users: [] 
    }
  }
}

/**
 * Promote user to organizer by phone number
 */
export async function promoteUserByPhone(phoneNumber: string): Promise<{ 
  success: boolean
  message: string
  error?: string 
}> {
  console.log('👑 Attempting to promote user by phone:', phoneNumber)
  
  try {
    // First find the user
    const findResult = await findUserByPhone(phoneNumber)
    if (!findResult.success) {
      return { success: false, message: 'Failed to find user', error: findResult.error }
    }
    
    if (findResult.users.length === 0) {
      return { success: false, message: 'No user found with this phone number' }
    }
    
    if (findResult.users.length > 1) {
      return { 
        success: false, 
        message: `Multiple users found with phone ${phoneNumber}. Please use user ID instead.` 
      }
    }
    
    const user = findResult.users[0]
    console.log('👤 Found user to promote:', { id: user.id, name: user.name, currentRole: user.role })
    
    // Check if already organizer
    if (user.role === 'organizer') {
      return { success: true, message: `User ${user.name || user.phone_number} is already an organizer` }
    }
    
    // Promote to organizer
    const promoteResult = await promoteToOrganizer(user.id)
    if (!promoteResult.success) {
      return { 
        success: false, 
        message: 'Failed to promote user to organizer', 
        error: promoteResult.error 
      }
    }
    
    return { 
      success: true, 
      message: `Successfully promoted ${user.name || user.phone_number} to organizer` 
    }
  } catch (error) {
    console.error('❌ Exception promoting user by phone:', error)
    return { 
      success: false, 
      message: 'Unexpected error during promotion',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * List all users (admin function)
 */
export async function listAllUsers() {
  console.log('📋 Listing all users')
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, phone_number, role, is_active, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error listing users:', error)
      return { success: false, error: error.message, users: [] }
    }
    
    console.log('✅ Listed users:', users?.length || 0)
    return { success: true, users: users || [] }
  } catch (error) {
    console.error('❌ Exception listing users:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      users: [] 
    }
  }
}

/**
 * Console helper function for admin promotion
 * Usage in browser console: await promoteByPhone('+6591234567')
 */
declare global {
  interface Window {
    promoteByPhone: (phoneNumber: string) => Promise<void>
    listUsers: () => Promise<void>
  }
}

// Only expose in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.promoteByPhone = async (phoneNumber: string) => {
    const result = await promoteUserByPhone(phoneNumber)
    console.log('🎯 Promotion result:', result)
    if (result.success) {
      console.log('✅', result.message)
    } else {
      console.error('❌', result.message, result.error)
    }
  }
  
  window.listUsers = async () => {
    const result = await listAllUsers()
    console.log('📋 Users:', result)
    if (result.success) {
      console.table(result.users)
    } else {
      console.error('❌', result.error)
    }
  }
}