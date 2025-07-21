import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Payment = Database['public']['Tables']['payments']['Row']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export class PaymentService {
  private supabase = createClientSupabaseClient()

  /**
   * Record a new payment
   */
  async createPayment(paymentData: Omit<PaymentInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('payments')
      .insert([paymentData])
      .select(`
        *,
        player:players(name, phone_number)
      `)
      .single()

    if (error) {
      console.error('Error creating payment:', error)
      throw new Error(`Failed to record payment: ${error.message}`)
    }

    return data
  }

  /**
   * Get all payments for an organizer
   */
  async getPaymentsByOrganizer(organizerId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        player:players(name, phone_number)
      `)
      .eq('organizer_id', organizerId)
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching payments:', error)
      throw new Error(`Failed to fetch payments: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get payments for a specific player
   */
  async getPaymentsByPlayer(playerId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        player:players(name)
      `)
      .eq('player_id', playerId)
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching player payments:', error)
      throw new Error(`Failed to fetch player payments: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get recent payments for dashboard
   */
  async getRecentPayments(organizerId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        player:players(name, phone_number)
      `)
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent payments:', error)
      throw new Error(`Failed to fetch recent payments: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a payment
   */
  async updatePayment(paymentId: string, updates: PaymentUpdate) {
    // First get the current payment to check if it's a credit transfer
    const { data: currentPayment, error: fetchError } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (fetchError) {
      console.error('Error fetching current payment:', fetchError)
      throw new Error(`Failed to fetch payment: ${fetchError.message}`)
    }

    // If this is a credit transfer, we need to update both paired records
    if (currentPayment.payment_method === 'credit_transfer' && currentPayment.reference_number) {
      console.log('Looking for paired payment:', {
        currentPaymentId: paymentId,
        paymentMethod: currentPayment.payment_method,
        referenceNumber: currentPayment.reference_number,
        amount: currentPayment.amount
      })

      // Find the paired payment
      const { data: pairedPayments, error: pairedError } = await this.supabase
        .from('payments')
        .select('*')
        .eq('reference_number', currentPayment.reference_number)
        .neq('id', paymentId)

      console.log('Paired payment search result:', {
        found: pairedPayments?.length || 0,
        payments: pairedPayments,
        error: pairedError
      })

      if (pairedError) {
        console.error('Error finding paired payment:', pairedError)
        // Continue with single update if we can't find the pair
      }

      // Update the main payment
      const { data, error } = await this.supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId)
        .select(`
          *,
          player:players(name, phone_number)
        `)
        .single()

      if (error) {
        console.error('Error updating payment:', error)
        throw new Error(`Failed to update payment: ${error.message}`)
      }

      // Update paired payment if found and certain fields changed
      if (pairedPayments && pairedPayments.length > 0) {
        const pairedPayment = pairedPayments[0]
        const pairedUpdates: Partial<PaymentUpdate> = {}

        console.log('Credit transfer pairing:', {
          currentPaymentId: paymentId,
          pairedPaymentId: pairedPayment.id,
          referenceNumber: currentPayment.reference_number,
          updates
        })

        // Sync certain fields between paired payments
        if (updates.payment_date) pairedUpdates.payment_date = updates.payment_date
        if (updates.reference_number) pairedUpdates.reference_number = updates.reference_number
        
        // For credit transfers, sync amount changes to maintain balance
        if (updates.amount !== undefined) {
          // If current payment is negative, make paired payment positive with same absolute value
          // If current payment is positive, make paired payment negative with same absolute value
          const currentIsNegative = currentPayment.amount < 0
          pairedUpdates.amount = currentIsNegative ? Math.abs(updates.amount) : -Math.abs(updates.amount)
          console.log('Syncing amount for credit transfer:', {
            currentAmount: updates.amount,
            pairedAmount: pairedUpdates.amount,
            currentIsNegative
          })
        }
        
        if (updates.notes) {
          // Update paired payment notes to reflect the change
          const isNegativeAmount = currentPayment.amount < 0
          const notePrefix = isNegativeAmount ? 'Credit transferred to another player' : 'Credit received from another player'
          pairedUpdates.notes = `${notePrefix}: ${updates.notes}`
        }

        // Always update paired payment to ensure consistency
        if (Object.keys(pairedUpdates).length > 0) {
          console.log('Updating paired payment with:', pairedUpdates)
          const { error: pairedError } = await this.supabase
            .from('payments')
            .update(pairedUpdates)
            .eq('id', pairedPayment.id)
          
          if (pairedError) {
            console.error('Error updating paired payment:', pairedError)
          } else {
            console.log('Successfully updated paired payment')
          }
        } else {
          console.log('No fields to sync for paired payment')
        }
      } else {
        console.log('No paired payment found for credit transfer')
      }

      return data
    } else {
      // Regular payment update
      const { data, error } = await this.supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId)
        .select(`
          *,
          player:players(name, phone_number)
        `)
        .single()

      if (error) {
        console.error('Error updating payment:', error)
        throw new Error(`Failed to update payment: ${error.message}`)
      }

      return data
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId: string) {
    // First get the current payment to check if it's a credit transfer
    const { data: currentPayment, error: fetchError } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (fetchError) {
      console.error('Error fetching current payment:', fetchError)
      throw new Error(`Failed to fetch payment: ${fetchError.message}`)
    }

    // If this is a credit transfer, we need to delete both paired records
    if (currentPayment.payment_method === 'credit_transfer' && currentPayment.reference_number) {
      // Delete both payments with the same reference number
      const { error } = await this.supabase
        .from('payments')
        .delete()
        .eq('reference_number', currentPayment.reference_number)

      if (error) {
        console.error('Error deleting credit transfer pair:', error)
        throw new Error(`Failed to delete credit transfer: ${error.message}`)
      }
    } else {
      // Regular payment deletion
      const { error } = await this.supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) {
        console.error('Error deleting payment:', error)
        throw new Error(`Failed to delete payment: ${error.message}`)
      }
    }

    return true
  }

  /**
   * Get paired credit transfer payments by reference number
   */
  async getCreditTransferPair(referenceNumber: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        player:players(name, phone_number)
      `)
      .eq('reference_number', referenceNumber)
      .eq('payment_method', 'credit_transfer')
      .order('amount', { ascending: false }) // Positive amount first

    if (error) {
      console.error('Error fetching credit transfer pair:', error)
      throw new Error(`Failed to fetch credit transfer pair: ${error.message}`)
    }

    return data || []
  }

  /**
   * Transfer credit from one player to another
   */
  async transferCredit(fromPlayerId: string, toPlayerId: string, amount: number, organizerId: string, notes?: string) {
    try {
      // Create two payment records: one negative (debit) and one positive (credit)
      const transferDate = new Date().toISOString().split('T')[0]
      const transferId = `transfer-${Date.now()}`
      
      // Debit payment (negative amount from the source player)
      const debitPayment = {
        player_id: fromPlayerId,
        organizer_id: organizerId,
        amount: -amount,
        payment_date: transferDate,
        payment_method: 'credit_transfer',
        notes: notes ? `Credit transferred to another player: ${notes}` : 'Credit transferred to another player',
        reference_number: transferId
      }
      
      // Credit payment (positive amount to the destination player)
      const creditPayment = {
        player_id: toPlayerId,
        organizer_id: organizerId,
        amount,
        payment_date: transferDate,
        payment_method: 'credit_transfer',
        notes: notes ? `Credit received from another player: ${notes}` : 'Credit received from another player',
        reference_number: transferId
      }
      
      // Insert both payments in a transaction
      const { data, error } = await this.supabase
        .from('payments')
        .insert([debitPayment, creditPayment])
        .select(`
          *,
          player:players(name, phone_number)
        `)
      
      if (error) {
        console.error('Error transferring credit:', error)
        throw new Error(`Failed to transfer credit: ${error.message}`)
      }
      
      return data
    } catch (error) {
      console.error('Error in credit transfer:', error)
      throw error
    }
  }

  /**
   * Get payment statistics for an organizer
   */
  async getPaymentStats(organizerId: string, fromDate?: string, toDate?: string) {
    let query = this.supabase
      .from('payments')
      .select('amount, payment_date, payment_method')
      .eq('organizer_id', organizerId)

    if (fromDate) {
      query = query.gte('payment_date', fromDate)
    }
    if (toDate) {
      query = query.lte('payment_date', toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching payment stats:', error)
      throw new Error(`Failed to fetch payment statistics: ${error.message}`)
    }

    // Calculate statistics
    const payments = data || []
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const paymentMethods = payments.reduce((acc, p) => {
      acc[p.payment_method] = (acc[p.payment_method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalPayments: payments.length,
      totalAmount,
      averagePayment: payments.length > 0 ? totalAmount / payments.length : 0,
      paymentMethods,
      recentPayments: payments.slice(0, 5)
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()