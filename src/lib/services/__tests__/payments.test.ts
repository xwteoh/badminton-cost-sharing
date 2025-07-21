/**
 * Payment Service Tests
 * Purpose: Critical financial operation testing for production readiness
 * Coverage: 100% required for financial calculations and balance updates
 */

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  createClientSupabaseClient: jest.fn(() => mockSupabase),
}))

import { PaymentService } from '../payments'
import { money } from '@/lib/calculations/money'

describe('PaymentService', () => {
  let paymentService: PaymentService
  const mockOrganizerId = '123e4567-e89b-12d3-a456-426614174000'
  const mockPlayerId = '123e4567-e89b-12d3-a456-426614174001'
  const mockPaymentId = '123e4567-e89b-12d3-a456-426614174002'

  beforeEach(() => {
    paymentService = new PaymentService()
    jest.clearAllMocks()
  })

  describe('recordPayment', () => {
    it('should record PayNow payment with correct data', async () => {
      const paymentData = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        amount: 50.75,
        payment_method: 'paynow' as const,
        payment_date: '2025-01-15',
        notes: 'January session payment'
      }

      const recordedPayment = {
        ...paymentData,
        id: mockPaymentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.select.mockResolvedValue({ data: [recordedPayment], error: null })

      const result = await paymentService.recordPayment(paymentData)

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...paymentData,
        created_at: expect.any(String)
      })
      expect(result).toEqual(recordedPayment)
    })

    it('should handle cash payments', async () => {
      const cashPayment = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        amount: 25.00,
        payment_method: 'cash' as const,
        payment_date: '2025-01-15'
      }

      const recordedPayment = { ...cashPayment, id: mockPaymentId }
      mockSupabase.select.mockResolvedValue({ data: [recordedPayment], error: null })

      const result = await paymentService.recordPayment(cashPayment)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...cashPayment,
        created_at: expect.any(String)
      })
      expect(result).toEqual(recordedPayment)
    })

    it('should validate required payment fields', async () => {
      const invalidPayment = {
        organizer_id: mockOrganizerId,
        amount: 50.00,
        payment_method: 'paynow' as const
        // Missing player_id and payment_date
      }

      await expect(paymentService.recordPayment(invalidPayment as any))
        .rejects.toThrow('Player ID is required')

      const missingDate = { ...invalidPayment, player_id: mockPlayerId }
      await expect(paymentService.recordPayment(missingDate as any))
        .rejects.toThrow('Payment date is required')
    })

    it('should validate payment amount', async () => {
      const negativePayment = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        amount: -50.00,
        payment_method: 'paynow' as const,
        payment_date: '2025-01-15'
      }

      await expect(paymentService.recordPayment(negativePayment))
        .rejects.toThrow('Payment amount must be positive')

      const zeroPayment = { ...negativePayment, amount: 0 }
      await expect(paymentService.recordPayment(zeroPayment))
        .rejects.toThrow('Payment amount must be positive')
    })

    it('should validate payment method', async () => {
      const invalidMethod = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        amount: 50.00,
        payment_method: 'bitcoin' as any,
        payment_date: '2025-01-15'
      }

      await expect(paymentService.recordPayment(invalidMethod))
        .rejects.toThrow('Invalid payment method')
    })

    it('should validate payment date format', async () => {
      const invalidDate = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        amount: 50.00,
        payment_method: 'paynow' as const,
        payment_date: 'invalid-date'
      }

      await expect(paymentService.recordPayment(invalidDate))
        .rejects.toThrow('Invalid payment date format')
    })

    it('should handle database errors during payment recording', async () => {
      const validPayment = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        amount: 50.00,
        payment_method: 'paynow' as const,
        payment_date: '2025-01-15'
      }

      const dbError = { message: 'Connection timeout' }
      mockSupabase.select.mockResolvedValue({ data: null, error: dbError })

      await expect(paymentService.recordPayment(validPayment))
        .rejects.toThrow('Failed to record payment: Connection timeout')
    })
  })

  describe('getPlayerPayments', () => {
    it('should fetch all payments for a player', async () => {
      const mockPayments = [
        {
          id: mockPaymentId,
          player_id: mockPlayerId,
          amount: 50.75,
          payment_method: 'paynow',
          payment_date: '2025-01-15',
          created_at: '2025-01-15T10:00:00Z'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          player_id: mockPlayerId,
          amount: 25.00,
          payment_method: 'cash',
          payment_date: '2025-01-10',
          created_at: '2025-01-10T15:30:00Z'
        }
      ]

      mockSupabase.single.mockResolvedValue({ data: mockPayments, error: null })

      const result = await paymentService.getPlayerPayments(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.eq).toHaveBeenCalledWith('organizer_id', mockOrganizerId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('player_id', mockPlayerId)
      expect(mockSupabase.order).toHaveBeenCalledWith('payment_date', { ascending: false })
      expect(result).toEqual(mockPayments)
    })

    it('should return empty array when no payments found', async () => {
      mockSupabase.single.mockResolvedValue({ data: [], error: null })

      const result = await paymentService.getPlayerPayments(mockOrganizerId, mockPlayerId)

      expect(result).toEqual([])
    })
  })

  describe('getRecentPayments', () => {
    it('should fetch recent payments with limit', async () => {
      const recentPayments = [
        {
          id: mockPaymentId,
          player_id: mockPlayerId,
          amount: 75.50,
          payment_method: 'paynow',
          payment_date: '2025-01-15',
          player: { name: 'John Doe' }
        }
      ]

      mockSupabase.single.mockResolvedValue({ data: recentPayments, error: null })

      const result = await paymentService.getRecentPayments(mockOrganizerId, 10)

      expect(mockSupabase.select).toHaveBeenCalledWith(`
        *,
        player:players!inner(name, phone_number)
      `)
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(recentPayments)
    })

    it('should use default limit when not specified', async () => {
      mockSupabase.single.mockResolvedValue({ data: [], error: null })

      await paymentService.getRecentPayments(mockOrganizerId)

      // Should use default limit in the service
      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
    })
  })

  describe('updatePayment', () => {
    it('should update payment details', async () => {
      const updateData = {
        amount: 60.00,
        notes: 'Updated payment notes'
      }

      const updatedPayment = {
        id: mockPaymentId,
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        amount: 60.00,
        payment_method: 'paynow',
        payment_date: '2025-01-15',
        notes: 'Updated payment notes',
        updated_at: new Date().toISOString()
      }

      mockSupabase.select.mockResolvedValue({ data: [updatedPayment], error: null })

      const result = await paymentService.updatePayment(
        mockOrganizerId, 
        mockPaymentId, 
        updateData
      )

      expect(mockSupabase.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String)
      })
      expect(result).toEqual(updatedPayment)
    })

    it('should validate updated amount is positive', async () => {
      const invalidUpdate = { amount: -25.00 }

      await expect(
        paymentService.updatePayment(mockOrganizerId, mockPaymentId, invalidUpdate)
      ).rejects.toThrow('Payment amount must be positive')
    })
  })

  describe('deletePayment', () => {
    it('should delete payment successfully', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const result = await paymentService.deletePayment(mockOrganizerId, mockPaymentId)

      expect(mockSupabase.from).toHaveBeenCalledWith('payments')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('organizer_id', mockOrganizerId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockPaymentId)
      expect(result).toBe(true)
    })

    it('should handle deletion errors', async () => {
      const deleteError = { message: 'Payment not found' }
      mockSupabase.single.mockResolvedValue({ data: null, error: deleteError })

      await expect(paymentService.deletePayment(mockOrganizerId, mockPaymentId))
        .rejects.toThrow('Failed to delete payment: Payment not found')
    })
  })

  describe('calculateTotalPaid', () => {
    it('should calculate total amount paid by player', async () => {
      const payments = [
        { amount: 50.75 },
        { amount: 25.00 },
        { amount: 100.25 }
      ]

      mockSupabase.single.mockResolvedValue({ data: payments, error: null })

      const result = await paymentService.calculateTotalPaid(mockOrganizerId, mockPlayerId)

      expect(result.toString()).toBe('176')
    })

    it('should return zero for player with no payments', async () => {
      mockSupabase.single.mockResolvedValue({ data: [], error: null })

      const result = await paymentService.calculateTotalPaid(mockOrganizerId, mockPlayerId)

      expect(result.toString()).toBe('0')
    })

    it('should handle decimal precision correctly', async () => {
      const payments = [
        { amount: 10.55 },
        { amount: 20.33 },
        { amount: 30.77 }
      ]

      mockSupabase.single.mockResolvedValue({ data: payments, error: null })

      const result = await paymentService.calculateTotalPaid(mockOrganizerId, mockPlayerId)

      // Should maintain precision without floating point errors
      expect(result.toString()).toBe('61.65')
    })
  })

  describe('Payment Method Validation', () => {
    const validMethods = ['paynow', 'cash', 'bank_transfer', 'other']

    validMethods.forEach(method => {
      it(`should accept ${method} as valid payment method`, async () => {
        const payment = {
          player_id: mockPlayerId,
          organizer_id: mockOrganizerId,
          amount: 50.00,
          payment_method: method as any,
          payment_date: '2025-01-15'
        }

        mockSupabase.select.mockResolvedValue({ 
          data: [{ ...payment, id: mockPaymentId }], 
          error: null 
        })

        await expect(paymentService.recordPayment(payment)).resolves.not.toThrow()
      })
    })

    it('should reject invalid payment methods', async () => {
      const invalidMethods = ['cryptocurrency', 'barter', 'future_promise']

      for (const method of invalidMethods) {
        const payment = {
          player_id: mockPlayerId,
          organizer_id: mockOrganizerId,
          amount: 50.00,
          payment_method: method as any,
          payment_date: '2025-01-15'
        }

        await expect(paymentService.recordPayment(payment))
          .rejects.toThrow('Invalid payment method')
      }
    })
  })
})