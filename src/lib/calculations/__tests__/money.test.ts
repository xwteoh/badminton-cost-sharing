/**
 * Money Calculation Tests
 * Purpose: Ensure financial precision and accuracy
 */

import { 
  money, 
  addMoney, 
  subtractMoney, 
  multiplyMoney, 
  divideMoney,
  formatMoney,
  parseMoney,
  isValidMoneyInput,
  SGD,
  BadmintonMoney
} from '../money'

describe('Money Operations', () => {
  describe('Basic Operations', () => {
    test('should handle addition correctly', () => {
      expect(addMoney(10.50, 5.25).toString()).toBe('15.75')
      expect(addMoney('10.50', '5.25').toString()).toBe('15.75')
      expect(addMoney(0.1, 0.2).toString()).toBe('0.3') // No floating point errors
    })

    test('should handle subtraction correctly', () => {
      expect(subtractMoney(10.50, 5.25).toString()).toBe('5.25')
      expect(subtractMoney('10.00', '5.25').toString()).toBe('4.75')
    })

    test('should handle multiplication correctly', () => {
      expect(multiplyMoney(10.50, 2).toString()).toBe('21')
      expect(multiplyMoney('10.50', '1.5').toString()).toBe('15.75')
    })

    test('should handle division correctly', () => {
      expect(divideMoney(10, 4).toString()).toBe('2.5')
      expect(divideMoney('15.75', '3').toString()).toBe('5.25')
    })

    test('should handle division by zero', () => {
      expect(divideMoney(10, 0).toString()).toBe('0')
    })
  })

  describe('Money Formatting', () => {
    test('should format SGD currency correctly', () => {
      expect(formatMoney(10.5)).toBe('$10.50')
      expect(formatMoney(1000)).toBe('$1,000.00')
      expect(formatMoney(1234.56)).toBe('$1,234.56')
    })

    test('should format negative amounts', () => {
      expect(formatMoney(-10.5)).toBe('-$10.50')
      expect(formatMoney(-1000)).toBe('-$1,000.00')
    })

    test('should format with options', () => {
      expect(formatMoney(10.5, { showCurrency: false })).toBe('10.50')
      expect(formatMoney(10.5, { showSign: true })).toBe('+$10.50')
      expect(formatMoney(10.567, { decimalPlaces: 3 })).toBe('$10.567')
    })
  })

  describe('Money Parsing', () => {
    test('should parse formatted money strings', () => {
      expect(parseMoney('$10.50').toString()).toBe('10.5')
      expect(parseMoney('$1,000.00').toString()).toBe('1000')
      expect(parseMoney('-$10.50').toString()).toBe('-10.5')
      expect(parseMoney('10.50').toString()).toBe('10.5')
    })

    test('should handle empty or invalid strings', () => {
      expect(parseMoney('').toString()).toBe('0')
      expect(parseMoney('invalid').toString()).toBe('0')
    })
  })

  describe('SGD Utilities', () => {
    test('should format SGD correctly', () => {
      expect(SGD.format(10.5)).toBe('$10.50')
      expect(SGD.formatWithSign(10.5)).toBe('+$10.50')
      expect(SGD.formatAmount(10.5)).toBe('10.50')
    })

    test('should identify debt, credit, settled', () => {
      expect(SGD.isDebt(-10)).toBe(true)
      expect(SGD.isCredit(10)).toBe(true)
      expect(SGD.isSettled(0)).toBe(true)
    })
  })

  describe('Input Validation', () => {
    test('should validate money inputs', () => {
      expect(isValidMoneyInput(10)).toBe(true)
      expect(isValidMoneyInput('10.50')).toBe(true)
      expect(isValidMoneyInput('$10.50')).toBe(true)
      expect(isValidMoneyInput(money(10))).toBe(true)
      expect(isValidMoneyInput('invalid')).toBe(false)
      expect(isValidMoneyInput(NaN)).toBe(false)
      expect(isValidMoneyInput(Infinity)).toBe(false)
    })
  })
})

describe('Badminton Money Calculations', () => {
  test('should calculate cost per player', () => {
    expect(BadmintonMoney.calculateCostPerPlayer(100, 4).toString()).toBe('25')
    expect(BadmintonMoney.calculateCostPerPlayer(75, 3).toString()).toBe('25')
    expect(BadmintonMoney.calculateCostPerPlayer(0, 4).toString()).toBe('0')
  })

  test('should handle invalid player count', () => {
    expect(BadmintonMoney.calculateCostPerPlayer(100, 0).toString()).toBe('0')
    expect(BadmintonMoney.calculateCostPerPlayer(100, -1).toString()).toBe('0')
  })

  test('should calculate session total', () => {
    expect(BadmintonMoney.calculateSessionTotal(40, 12, 8).toString()).toBe('60')
    expect(BadmintonMoney.calculateSessionTotal(40).toString()).toBe('40')
  })

  test('should calculate balance', () => {
    expect(BadmintonMoney.calculateBalance(100, 75).toString()).toBe('25') // Credit
    expect(BadmintonMoney.calculateBalance(50, 75).toString()).toBe('-25') // Debt
    expect(BadmintonMoney.calculateBalance(75, 75).toString()).toBe('0') // Settled
  })

  test('should calculate debt and credit amounts', () => {
    expect(BadmintonMoney.calculateDebt(-25).toString()).toBe('25')
    expect(BadmintonMoney.calculateDebt(25).toString()).toBe('0')
    
    expect(BadmintonMoney.calculateCredit(25).toString()).toBe('25')
    expect(BadmintonMoney.calculateCredit(-25).toString()).toBe('0')
  })
})

describe('Precision Tests', () => {
  test('should maintain precision with repeated operations', () => {
    let result = money(0)
    
    // Add 0.1 ten times
    for (let i = 0; i < 10; i++) {
      result = addMoney(result, 0.1)
    }
    
    expect(result.toString()).toBe('1') // Should be exactly 1, not 0.9999999999
  })

  test('should handle complex calculations without precision loss', () => {
    // Complex scenario: session cost split among players
    const courtCost = money('42.75')
    const shuttlecockCost = money('18.50') 
    const playerCount = 7
    
    const totalCost = addMoney(courtCost, shuttlecockCost)
    const costPerPlayer = divideMoney(totalCost, playerCount)
    const totalCollected = multiplyMoney(costPerPlayer, playerCount)
    
    // Should match exactly (within rounding)
    expect(totalCollected.toDecimalPlaces(2).toString()).toBe(totalCost.toDecimalPlaces(2).toString())
  })

  test('should round correctly for currency', () => {
    // SGD typically uses 2 decimal places
    expect(formatMoney(10.555)).toBe('$10.56') // Rounds up
    expect(formatMoney(10.554)).toBe('$10.55') // Rounds down
    expect(formatMoney(10.565)).toBe('$10.57') // Banker's rounding
  })
})