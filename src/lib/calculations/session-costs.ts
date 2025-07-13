/**
 * Session Cost Calculations
 * Purpose: Calculate session costs, per-player amounts, and cost breakdowns
 */

import { money, Money, MoneyInput, BadmintonMoney } from './money'

export interface SessionCostInput {
  courtCost: MoneyInput
  shuttlecockCost?: MoneyInput
  otherCosts?: MoneyInput
  playerCount: number
}

export interface SessionCostBreakdown {
  courtCost: Money
  shuttlecockCost: Money
  otherCosts: Money
  totalCost: Money
  playerCount: number
  costPerPlayer: Money
  isValid: boolean
  errors: string[]
}

/**
 * Calculate comprehensive session cost breakdown
 */
export function calculateSessionCosts(input: SessionCostInput): SessionCostBreakdown {
  const errors: string[] = []
  
  // Validate inputs
  if (input.playerCount <= 0) {
    errors.push('Player count must be greater than 0')
  }
  
  if (!Number.isInteger(input.playerCount)) {
    errors.push('Player count must be a whole number')
  }
  
  // Parse monetary inputs
  const courtCost = money(input.courtCost)
  const shuttlecockCost = money(input.shuttlecockCost || 0)
  const otherCosts = money(input.otherCosts || 0)
  
  // Validate monetary amounts
  if (courtCost.isNegative()) {
    errors.push('Court cost cannot be negative')
  }
  
  if (shuttlecockCost.isNegative()) {
    errors.push('Shuttlecock cost cannot be negative')
  }
  
  if (otherCosts.isNegative()) {
    errors.push('Other costs cannot be negative')
  }
  
  // Calculate totals
  const totalCost = BadmintonMoney.calculateSessionTotal(courtCost, shuttlecockCost, otherCosts)
  const costPerPlayer = input.playerCount > 0 
    ? BadmintonMoney.calculateCostPerPlayer(totalCost, input.playerCount)
    : money(0)
  
  return {
    courtCost,
    shuttlecockCost,
    otherCosts,
    totalCost,
    playerCount: input.playerCount,
    costPerPlayer,
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calculate cost per player for quick calculations
 */
export function quickCostPerPlayer(totalCost: MoneyInput, playerCount: number): Money {
  return BadmintonMoney.calculateCostPerPlayer(totalCost, playerCount)
}

/**
 * Calculate what each player owes for a session
 */
export function calculatePlayerAmounts(
  sessionCosts: SessionCostBreakdown,
  players: string[]
): Map<string, Money> {
  const amounts = new Map<string, Money>()
  
  if (!sessionCosts.isValid || players.length === 0) {
    return amounts
  }
  
  // For now, everyone pays equal amount
  // Future: could support different sharing ratios
  const amountPerPlayer = sessionCosts.costPerPlayer
  
  players.forEach(playerId => {
    amounts.set(playerId, amountPerPlayer)
  })
  
  return amounts
}

/**
 * Validate session cost input
 */
export function validateSessionCostInput(input: Partial<SessionCostInput>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check required fields
  if (input.courtCost === undefined || input.courtCost === null) {
    errors.push('Court cost is required')
  }
  
  if (input.playerCount === undefined || input.playerCount === null) {
    errors.push('Player count is required')
  }
  
  // Validate types and values
  if (input.playerCount !== undefined) {
    if (typeof input.playerCount !== 'number') {
      errors.push('Player count must be a number')
    } else if (input.playerCount <= 0) {
      errors.push('Player count must be greater than 0')
    } else if (!Number.isInteger(input.playerCount)) {
      errors.push('Player count must be a whole number')
    }
  }
  
  // Validate monetary inputs
  const monetaryFields = [
    { field: 'courtCost', name: 'Court cost' },
    { field: 'shuttlecockCost', name: 'Shuttlecock cost' },
    { field: 'otherCosts', name: 'Other costs' }
  ] as const
  
  monetaryFields.forEach(({ field, name }) => {
    const value = input[field]
    if (value !== undefined && value !== null) {
      try {
        const amount = money(value)
        if (amount.isNegative()) {
          errors.push(`${name} cannot be negative`)
        }
      } catch (error) {
        errors.push(`${name} must be a valid number`)
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Common session cost presets for quick setup
 */
export const SessionCostPresets = {
  // Common Singapore badminton costs
  indoorCourt1Hour: {
    courtCost: money(40),
    shuttlecockCost: money(12),
    description: 'Indoor court 1 hour + shuttlecocks'
  },
  
  indoorCourt2Hours: {
    courtCost: money(80),
    shuttlecockCost: money(18),
    description: 'Indoor court 2 hours + shuttlecocks'
  },
  
  outdoorCourt: {
    courtCost: money(20),
    shuttlecockCost: money(8),
    description: 'Outdoor court + shuttlecocks'
  },
  
  // Calculate preset for player count
  getPresetCostPerPlayer: (preset: keyof typeof SessionCostPresets, playerCount: number) => {
    const costs = SessionCostPresets[preset]
    if (typeof costs === 'object' && 'courtCost' in costs) {
      const total = BadmintonMoney.calculateSessionTotal(
        costs.courtCost,
        costs.shuttlecockCost
      )
      return BadmintonMoney.calculateCostPerPlayer(total, playerCount)
    }
    return money(0)
  }
}

/**
 * Export types for external use
 */
export type SessionCostPreset = keyof typeof SessionCostPresets