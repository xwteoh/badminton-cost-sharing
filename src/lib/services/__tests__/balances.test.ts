/**
 * Balance Service Tests
 * Purpose: Critical financial balance calculation testing
 * Coverage: 100% required - handles player debt/credit calculations
 */

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  rpc: jest.fn(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  createClientSupabaseClient: jest.fn(() => mockSupabase),
}))

import { BalanceService } from '../balances'
import { money } from '@/lib/calculations/money'

describe('BalanceService', () => {
  let balanceService: BalanceService
  const mockOrganizerId = '123e4567-e89b-12d3-a456-426614174000'
  const mockPlayerId = '123e4567-e89b-12d3-a456-426614174001'

  beforeEach(() => {
    balanceService = new BalanceService()
    jest.clearAllMocks()
  })

  describe('getPlayerBalance', () => {
    it('should calculate player balance correctly', async () => {
      const mockBalance = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        balance: 25.75,
        total_sessions_cost: 150.00,
        total_payments: 125.25,
        debt_amount: 0,
        credit_amount: 25.75
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: mockBalance, error: null })

      const result = await balanceService.getPlayerBalance(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.from).toHaveBeenCalledWith('player_balances')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('organizer_id', mockOrganizerId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('player_id', mockPlayerId)
      expect(result).toEqual(mockBalance)
    })

    it('should return zero balance for new player', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await balanceService.getPlayerBalance(mockOrganizerId, mockPlayerId)

      expect(result).toEqual({
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        balance: 0,
        total_sessions_cost: 0,
        total_payments: 0,
        debt_amount: 0,
        credit_amount: 0
      })
    })

    it('should handle debt balance correctly', async () => {
      const mockBalance = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        balance: -35.50, // Player owes money
        total_sessions_cost: 100.00,
        total_payments: 64.50,
        debt_amount: 35.50,
        credit_amount: 0
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: mockBalance, error: null })

      const result = await balanceService.getPlayerBalance(mockOrganizerId, mockPlayerId)

      expect(result.balance).toBe(-35.50)
      expect(result.debt_amount).toBe(35.50)
      expect(result.credit_amount).toBe(0)
    })
  })

  describe('getAllPlayerBalances', () => {
    it('should fetch balances for all active players', async () => {
      const mockBalances = [
        {
          player_id: mockPlayerId,
          player_name: 'John Doe',
          balance: 25.75,
          total_sessions_cost: 150.00,
          total_payments: 125.25,
          is_active: true
        },
        {
          player_id: '123e4567-e89b-12d3-a456-426614174002',
          player_name: 'Jane Smith',
          balance: -15.50,
          total_sessions_cost: 80.00,
          total_payments: 64.50,
          is_active: true
        }
      ]

      mockSupabase.single.mockResolvedValue({ data: mockBalances, error: null })

      const result = await balanceService.getAllPlayerBalances(mockOrganizerId)

      expect(mockSupabase.from).toHaveBeenCalledWith('player_balances')
      expect(mockSupabase.select).toHaveBeenCalledWith(`
        *,
        player:players!inner(name, phone_number, is_active)
      `)
      expect(mockSupabase.eq).toHaveBeenCalledWith('organizer_id', mockOrganizerId)
      expect(result).toEqual(mockBalances)
    })

    it('should include inactive players when requested', async () => {
      const mockBalances = [
        {
          player_id: mockPlayerId,
          player_name: 'John Doe',
          balance: 10.00,
          is_active: true
        },
        {
          player_id: '123e4567-e89b-12d3-a456-426614174002',
          player_name: 'Inactive Player',
          balance: 5.00,
          is_active: false
        }
      ]

      mockSupabase.single.mockResolvedValue({ data: mockBalances, error: null })

      const result = await balanceService.getAllPlayerBalances(mockOrganizerId, true)

      expect(result).toHaveLength(2)
      expect(result[1].is_active).toBe(false)
    })
  })

  describe('getFinancialSummary', () => {
    it('should calculate correct financial summary', async () => {
      const mockSummary = {
        total_outstanding: 150.75, // Total owed by all players
        total_credit: 45.25,       // Total credit held by players
        net_balance: 105.50,       // Net amount organizer is owed
        total_players: 12,
        active_players: 10,
        players_with_debt: 7,
        players_with_credit: 3
      }

      mockSupabase.single.mockResolvedValue({ data: [mockSummary], error: null })

      const result = await balanceService.getFinancialSummary(mockOrganizerId)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_financial_summary', {
        p_organizer_id: mockOrganizerId
      })
      expect(result).toEqual(mockSummary)
    })

    it('should handle empty financial summary', async () => {
      mockSupabase.single.mockResolvedValue({ data: [null], error: null })

      const result = await balanceService.getFinancialSummary(mockOrganizerId)

      expect(result).toEqual({
        total_outstanding: 0,
        total_credit: 0,
        net_balance: 0,
        total_players: 0,
        active_players: 0,
        players_with_debt: 0,
        players_with_credit: 0
      })
    })
  })

  describe('recalculatePlayerBalance', () => {
    it('should trigger balance recalculation', async () => {
      const recalculatedBalance = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        balance: 32.25,
        total_sessions_cost: 200.00,
        total_payments: 167.75
      }

      mockSupabase.single.mockResolvedValue({ data: [recalculatedBalance], error: null })

      const result = await balanceService.recalculatePlayerBalance(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('recalculate_player_balance', {
        p_organizer_id: mockOrganizerId,
        p_player_id: mockPlayerId
      })
      expect(result).toEqual(recalculatedBalance)
    })

    it('should handle recalculation errors', async () => {
      const dbError = { message: 'Player not found' }
      mockSupabase.single.mockResolvedValue({ data: null, error: dbError })

      await expect(
        balanceService.recalculatePlayerBalance(mockOrganizerId, mockPlayerId)
      ).rejects.toThrow('Failed to recalculate balance: Player not found')
    })
  })

  describe('getPlayersWithDebt', () => {
    it('should fetch players who owe money', async () => {
      const playersWithDebt = [
        {
          player_id: mockPlayerId,
          player_name: 'John Doe',
          balance: -25.50,
          debt_amount: 25.50,
          last_payment_date: '2025-01-10'
        },
        {
          player_id: '123e4567-e89b-12d3-a456-426614174002',
          player_name: 'Jane Smith',
          balance: -10.00,
          debt_amount: 10.00,
          last_payment_date: null
        }
      ]

      mockSupabase.single.mockResolvedValue({ data: playersWithDebt, error: null })

      const result = await balanceService.getPlayersWithDebt(mockOrganizerId)

      expect(mockSupabase.select).toHaveBeenCalledWith(`
        *,
        player:players!inner(name, phone_number),
        last_payment:payments(payment_date)
      `)
      expect(result).toEqual(playersWithDebt)
    })

    it('should return empty array when no players have debt', async () => {
      mockSupabase.single.mockResolvedValue({ data: [], error: null })

      const result = await balanceService.getPlayersWithDebt(mockOrganizerId)

      expect(result).toEqual([])
    })
  })

  describe('getPlayersWithCredit', () => {
    it('should fetch players with credit balances', async () => {
      const playersWithCredit = [
        {
          player_id: mockPlayerId,
          player_name: 'John Doe',
          balance: 15.75,
          credit_amount: 15.75,
          overpayment_date: '2025-01-12'
        }
      ]

      mockSupabase.single.mockResolvedValue({ data: playersWithCredit, error: null })

      const result = await balanceService.getPlayersWithCredit(mockOrganizerId)

      expect(result).toEqual(playersWithCredit)
    })
  })

  describe('Balance Calculation Edge Cases', () => {
    it('should handle very small balance amounts', async () => {
      const smallBalance = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        balance: 0.01, // 1 cent credit
        total_sessions_cost: 50.00,
        total_payments: 50.01
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: smallBalance, error: null })

      const result = await balanceService.getPlayerBalance(mockOrganizerId, mockPlayerId)

      expect(result.balance).toBe(0.01)
      expect(result.credit_amount).toBeGreaterThan(0)
      expect(result.debt_amount).toBe(0)
    })

    it('should handle large balance amounts', async () => {
      const largeBalance = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        balance: -999.99,
        total_sessions_cost: 1500.00,
        total_payments: 500.01,
        debt_amount: 999.99,
        credit_amount: 0
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: largeBalance, error: null })

      const result = await balanceService.getPlayerBalance(mockOrganizerId, mockPlayerId)

      expect(result.balance).toBe(-999.99)
      expect(result.debt_amount).toBe(999.99)
    })

    it('should handle exact zero balance', async () => {
      const zeroBalance = {
        player_id: mockPlayerId,
        organizer_id: mockOrganizerId,
        balance: 0.00,
        total_sessions_cost: 100.00,
        total_payments: 100.00,
        debt_amount: 0,
        credit_amount: 0
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: zeroBalance, error: null })

      const result = await balanceService.getPlayerBalance(mockOrganizerId, mockPlayerId)

      expect(result.balance).toBe(0.00)
      expect(result.debt_amount).toBe(0)
      expect(result.credit_amount).toBe(0)
    })
  })

  describe('Balance History and Auditing', () => {
    it('should track balance history for auditing', async () => {
      const balanceHistory = [
        {
          date: '2025-01-15',
          balance: 25.75,
          change: 10.50,
          description: 'Session payment recorded'
        },
        {
          date: '2025-01-10',
          balance: 15.25,
          change: 15.25,
          description: 'Initial session cost'
        }
      ]

      mockSupabase.single.mockResolvedValue({ data: balanceHistory, error: null })

      const result = await balanceService.getBalanceHistory(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.from).toHaveBeenCalledWith('balance_history')
      expect(result).toEqual(balanceHistory)
    })
  })
})