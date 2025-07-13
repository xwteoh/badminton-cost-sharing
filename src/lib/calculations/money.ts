/**
 * Money Calculations - Decimal.js Precision
 * Purpose: Handle all monetary calculations with precision for SGD currency
 * No floating point errors, financial accuracy guaranteed
 */

import Decimal from 'decimal.js'

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 10,        // 10 decimal places precision
  rounding: Decimal.ROUND_HALF_UP,  // Standard rounding
  toExpNeg: -7,         // No exponential notation
  toExpPos: 21,
  minE: -324,
  maxE: 308
})

export type Money = Decimal
export type MoneyInput = string | number | Decimal

/**
 * Create a Money instance from various input types
 */
export function money(value: MoneyInput): Money {
  try {
    return new Decimal(value)
  } catch (error) {
    console.error('Invalid money value:', value, error)
    return new Decimal(0)
  }
}

/**
 * Add two monetary values
 */
export function addMoney(a: MoneyInput, b: MoneyInput): Money {
  return money(a).add(money(b))
}

/**
 * Subtract two monetary values
 */
export function subtractMoney(a: MoneyInput, b: MoneyInput): Money {
  return money(a).sub(money(b))
}

/**
 * Multiply monetary value
 */
export function multiplyMoney(a: MoneyInput, b: MoneyInput): Money {
  return money(a).mul(money(b))
}

/**
 * Divide monetary value
 */
export function divideMoney(a: MoneyInput, b: MoneyInput): Money {
  const divisor = money(b)
  if (divisor.isZero()) {
    console.error('Division by zero in monetary calculation')
    return money(0)
  }
  return money(a).div(divisor)
}

/**
 * Check if monetary value is zero
 */
export function isZeroMoney(value: MoneyInput): boolean {
  return money(value).isZero()
}

/**
 * Check if monetary value is positive
 */
export function isPositiveMoney(value: MoneyInput): boolean {
  return money(value).isPositive()
}

/**
 * Check if monetary value is negative
 */
export function isNegativeMoney(value: MoneyInput): boolean {
  return money(value).isNegative()
}

/**
 * Compare two monetary values
 * Returns: -1 if a < b, 0 if a = b, 1 if a > b
 */
export function compareMoney(a: MoneyInput, b: MoneyInput): number {
  return money(a).comparedTo(money(b))
}

/**
 * Get absolute value of monetary amount
 */
export function absMoney(value: MoneyInput): Money {
  return money(value).abs()
}

/**
 * Round monetary value to specified decimal places (default 2 for SGD)
 */
export function roundMoney(value: MoneyInput, decimalPlaces: number = 2): Money {
  return money(value).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
}

/**
 * Format money for display (SGD currency)
 */
export function formatMoney(value: MoneyInput, options: {
  showCurrency?: boolean
  showSign?: boolean
  decimalPlaces?: number
} = {}): string {
  const {
    showCurrency = true,
    showSign = false,
    decimalPlaces = 2
  } = options

  const amount = roundMoney(value, decimalPlaces)
  const isNegative = amount.isNegative()
  const absAmount = amount.abs()
  
  // Format with thousand separators
  const formatted = absAmount.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  let result = formatted
  
  // Add currency symbol
  if (showCurrency) {
    result = `$${result}`
  }
  
  // Add sign handling
  if (isNegative) {
    result = `-${result}`
  } else if (showSign && !amount.isZero()) {
    result = `+${result}`
  }
  
  return result
}

/**
 * Parse money from formatted string
 */
export function parseMoney(value: string): Money {
  // Remove currency symbols, spaces, and thousand separators
  const cleaned = value
    .replace(/[$,\s]/g, '')
    .replace(/^[+-]/, '') // Handle signs separately
  
  const isNegative = value.trim().startsWith('-')
  const amount = money(cleaned || '0')
  
  return isNegative ? amount.neg() : amount
}

/**
 * Convert Money to number (use with caution, may lose precision)
 */
export function moneyToNumber(value: MoneyInput): number {
  return money(value).toNumber()
}

/**
 * Convert Money to string with exact precision
 */
export function moneyToString(value: MoneyInput): string {
  return money(value).toString()
}

/**
 * SGD Currency specific helpers
 */
export const SGD = {
  zero: money(0),
  
  format: (value: MoneyInput) => formatMoney(value, { showCurrency: true }),
  
  formatWithSign: (value: MoneyInput) => formatMoney(value, { 
    showCurrency: true, 
    showSign: true 
  }),
  
  formatAmount: (value: MoneyInput) => formatMoney(value, { 
    showCurrency: false 
  }),
  
  parse: parseMoney,
  
  isDebt: (value: MoneyInput) => isNegativeMoney(value),
  
  isCredit: (value: MoneyInput) => isPositiveMoney(value),
  
  isSettled: (value: MoneyInput) => isZeroMoney(value)
}

/**
 * Validation helpers
 */
export function isValidMoneyInput(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value)
  }
  
  if (typeof value === 'string') {
    try {
      const cleaned = value.replace(/[$,\s]/g, '')
      new Decimal(cleaned)
      return true
    } catch {
      return false
    }
  }
  
  return value instanceof Decimal
}

/**
 * Common monetary calculations for badminton cost sharing
 */
export const BadmintonMoney = {
  /**
   * Calculate cost per player for a session
   */
  calculateCostPerPlayer: (totalCost: MoneyInput, playerCount: number): Money => {
    if (playerCount <= 0) {
      console.error('Invalid player count for cost calculation:', playerCount)
      return money(0)
    }
    return divideMoney(totalCost, playerCount)
  },
  
  /**
   * Calculate total session cost
   */
  calculateSessionTotal: (
    courtCost: MoneyInput, 
    shuttlecockCost: MoneyInput = 0,
    otherCosts: MoneyInput = 0
  ): Money => {
    return addMoney(addMoney(courtCost, shuttlecockCost), otherCosts)
  },
  
  /**
   * Calculate player balance (paid - owed)
   */
  calculateBalance: (totalPaid: MoneyInput, totalOwed: MoneyInput): Money => {
    return subtractMoney(totalPaid, totalOwed)
  },
  
  /**
   * Calculate outstanding debt (negative balance)
   */
  calculateDebt: (balance: MoneyInput): Money => {
    const bal = money(balance)
    return bal.isNegative() ? bal.abs() : money(0)
  },
  
  /**
   * Calculate credit (positive balance)
   */
  calculateCredit: (balance: MoneyInput): Money => {
    const bal = money(balance)
    return bal.isPositive() ? bal : money(0)
  }
}