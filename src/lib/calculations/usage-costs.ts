/**
 * Usage-Based Cost Calculations
 * Purpose: Calculate costs based on actual usage (hours + shuttlecock quantities)
 */

import { money, Money, MoneyInput, BadmintonMoney } from './money'

export interface UsageCostInput {
  hoursPlayed: number
  courtRatePerHour: MoneyInput
  shuttlecocksUsed: number
  shuttlecockRateEach: MoneyInput
  otherCosts?: MoneyInput
  playerIds: string[]
}

export interface UsageCostBreakdown {
  hoursPlayed: number
  courtRatePerHour: Money
  courtTotalCost: Money
  shuttlecocksUsed: number
  shuttlecockRateEach: Money
  shuttlecockTotalCost: Money
  otherCosts: Money
  totalCost: Money
  playerCount: number
  costPerPlayer: Money
  isValid: boolean
  errors: string[]
}

/**
 * Calculate costs based on actual usage
 */
export function calculateUsageCosts(input: UsageCostInput): UsageCostBreakdown {
  const errors: string[] = []
  
  // Validate hours
  if (input.hoursPlayed <= 0) {
    errors.push('Hours played must be greater than 0')
  }
  if (input.hoursPlayed > 8) {
    errors.push('Hours played cannot exceed 8 hours per session')
  }
  
  // Validate shuttlecocks
  if (input.shuttlecocksUsed < 0) {
    errors.push('Shuttlecocks used cannot be negative')
  }
  if (!Number.isInteger(input.shuttlecocksUsed)) {
    errors.push('Shuttlecocks used must be a whole number')
  }
  
  // Validate players
  if (input.playerIds.length === 0) {
    errors.push('At least one player must be selected')
  }
  if (input.playerIds.length > 20) {
    errors.push('Maximum 20 players allowed per session')
  }
  
  // Parse monetary inputs
  const courtRatePerHour = money(input.courtRatePerHour)
  const shuttlecockRateEach = money(input.shuttlecockRateEach)
  const otherCosts = money(input.otherCosts || 0)
  
  // Validate rates
  if (courtRatePerHour.isNegative()) {
    errors.push('Court rate per hour cannot be negative')
  }
  if (shuttlecockRateEach.isNegative()) {
    errors.push('Shuttlecock rate cannot be negative')
  }
  if (otherCosts.isNegative()) {
    errors.push('Other costs cannot be negative')
  }
  
  // Calculate costs
  const courtTotalCost = courtRatePerHour.mul(input.hoursPlayed)
  const shuttlecockTotalCost = shuttlecockRateEach.mul(input.shuttlecocksUsed)
  const totalCost = BadmintonMoney.calculateSessionTotal(courtTotalCost, shuttlecockTotalCost, otherCosts)
  
  const costPerPlayer = input.playerIds.length > 0 
    ? BadmintonMoney.calculateCostPerPlayer(totalCost, input.playerIds.length)
    : money(0)
  
  return {
    hoursPlayed: input.hoursPlayed,
    courtRatePerHour,
    courtTotalCost,
    shuttlecocksUsed: input.shuttlecocksUsed,
    shuttlecockRateEach,
    shuttlecockTotalCost,
    otherCosts,
    totalCost,
    playerCount: input.playerIds.length,
    costPerPlayer,
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Common Singapore badminton rates
 */
export const UsageRatePresets = {
  // Indoor court rates (per hour)
  indoorPeakHour: {
    courtRate: money(50),
    shuttlecockRate: money(2.50),
    description: 'Indoor court peak hours'
  },
  
  indoorOffPeak: {
    courtRate: money(35),
    shuttlecockRate: money(2.00),
    description: 'Indoor court off-peak hours'
  },
  
  // Outdoor court rates (per hour)
  outdoorCourt: {
    courtRate: money(15),
    shuttlecockRate: money(1.50),
    description: 'Outdoor court'
  },
  
  // Community center rates
  communityCourt: {
    courtRate: money(25),
    shuttlecockRate: money(1.80),
    description: 'Community center court'
  }
}

/**
 * Calculate what each player owes for a usage-based session
 */
export function calculateUsagePlayerAmounts(
  usageCosts: UsageCostBreakdown,
  playerIds: string[]
): Map<string, Money> {
  const amounts = new Map<string, Money>()
  
  if (!usageCosts.isValid || playerIds.length === 0) {
    return amounts
  }
  
  // Equal split among all players
  const amountPerPlayer = usageCosts.costPerPlayer
  
  playerIds.forEach(playerId => {
    amounts.set(playerId, amountPerPlayer)
  })
  
  return amounts
}

/**
 * Validate usage cost input
 */
export function validateUsageCostInput(input: Partial<UsageCostInput>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check required fields
  if (input.hoursPlayed === undefined || input.hoursPlayed === null) {
    errors.push('Hours played is required')
  }
  
  if (input.courtRatePerHour === undefined || input.courtRatePerHour === null) {
    errors.push('Court rate per hour is required')
  }
  
  if (input.shuttlecocksUsed === undefined || input.shuttlecocksUsed === null) {
    errors.push('Number of shuttlecocks used is required')
  }
  
  if (input.shuttlecockRateEach === undefined || input.shuttlecockRateEach === null) {
    errors.push('Shuttlecock rate is required')
  }
  
  if (!input.playerIds || input.playerIds.length === 0) {
    errors.push('At least one player must be selected')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Export types for external use
 */
export type UsageRatePreset = keyof typeof UsageRatePresets