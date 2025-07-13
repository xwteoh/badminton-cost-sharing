/**
 * Balance Calculations
 * Purpose: Calculate player balances, debts, credits, and payment requirements
 */

import { money, Money, MoneyInput, BadmintonMoney, SGD } from './money'

export interface PlayerBalance {
  playerId: string
  playerName: string
  totalOwed: Money
  totalPaid: Money
  currentBalance: Money
  isDebt: boolean
  isCredit: boolean
  isSettled: boolean
  lastSessionDate?: Date
  lastPaymentDate?: Date
}

export interface PaymentRecord {
  id: string
  playerId: string
  amount: Money
  paymentDate: Date
  method: 'cash' | 'paynow' | 'bank_transfer' | 'other'
  reference?: string
  notes?: string
}

export interface SessionRecord {
  id: string
  date: Date
  amountOwed: Money
  sessionTitle?: string
}

export interface BalanceSummary {
  totalDebt: Money
  totalCredit: Money
  netBalance: Money
  playersInDebt: number
  playersInCredit: number
  settledPlayers: number
  totalPlayers: number
}

/**
 * Calculate individual player balance
 */
export function calculatePlayerBalance(
  totalOwed: MoneyInput,
  totalPaid: MoneyInput,
  playerInfo: {
    id: string
    name: string
    lastSessionDate?: Date
    lastPaymentDate?: Date
  }
): PlayerBalance {
  const owed = money(totalOwed)
  const paid = money(totalPaid)
  const balance = BadmintonMoney.calculateBalance(paid, owed)
  
  return {
    playerId: playerInfo.id,
    playerName: playerInfo.name,
    totalOwed: owed,
    totalPaid: paid,
    currentBalance: balance,
    isDebt: SGD.isDebt(balance),
    isCredit: SGD.isCredit(balance),
    isSettled: SGD.isSettled(balance),
    lastSessionDate: playerInfo.lastSessionDate,
    lastPaymentDate: playerInfo.lastPaymentDate
  }
}

/**
 * Calculate balance from transaction history
 */
export function calculateBalanceFromHistory(
  sessions: SessionRecord[],
  payments: PaymentRecord[]
): PlayerBalance {
  // Calculate total owed from sessions
  const totalOwed = sessions.reduce(
    (sum, session) => sum.add(session.amountOwed),
    money(0)
  )
  
  // Calculate total paid from payments
  const totalPaid = payments.reduce(
    (sum, payment) => sum.add(payment.amount),
    money(0)
  )
  
  // Get latest dates
  const lastSessionDate = sessions.length > 0 
    ? new Date(Math.max(...sessions.map(s => s.date.getTime())))
    : undefined
  
  const lastPaymentDate = payments.length > 0
    ? new Date(Math.max(...payments.map(p => p.paymentDate.getTime())))
    : undefined
  
  return calculatePlayerBalance(totalOwed, totalPaid, {
    id: payments[0]?.playerId || '',
    name: '',
    lastSessionDate,
    lastPaymentDate
  })
}

/**
 * Calculate group balance summary
 */
export function calculateBalanceSummary(balances: PlayerBalance[]): BalanceSummary {
  let totalDebt = money(0)
  let totalCredit = money(0)
  let playersInDebt = 0
  let playersInCredit = 0
  let settledPlayers = 0
  
  balances.forEach(balance => {
    if (balance.isDebt) {
      totalDebt = totalDebt.add(balance.currentBalance.abs())
      playersInDebt++
    } else if (balance.isCredit) {
      totalCredit = totalCredit.add(balance.currentBalance)
      playersInCredit++
    } else {
      settledPlayers++
    }
  })
  
  const netBalance = totalCredit.sub(totalDebt)
  
  return {
    totalDebt,
    totalCredit,
    netBalance,
    playersInDebt,
    playersInCredit,
    settledPlayers,
    totalPlayers: balances.length
  }
}

/**
 * Get players grouped by balance status
 */
export function groupPlayersByBalanceStatus(balances: PlayerBalance[]): {
  debtors: PlayerBalance[]
  creditors: PlayerBalance[]
  settled: PlayerBalance[]
} {
  const debtors: PlayerBalance[] = []
  const creditors: PlayerBalance[] = []
  const settled: PlayerBalance[] = []
  
  balances.forEach(balance => {
    if (balance.isDebt) {
      debtors.push(balance)
    } else if (balance.isCredit) {
      creditors.push(balance)
    } else {
      settled.push(balance)
    }
  })
  
  // Sort by balance amount (highest debt/credit first)
  debtors.sort((a, b) => a.currentBalance.comparedTo(b.currentBalance))
  creditors.sort((a, b) => b.currentBalance.comparedTo(a.currentBalance))
  
  return { debtors, creditors, settled }
}

/**
 * Calculate required payment to settle debt
 */
export function calculateRequiredPayment(balance: PlayerBalance): Money {
  return balance.isDebt ? balance.currentBalance.abs() : money(0)
}

/**
 * Calculate payment impact on balance
 */
export function calculatePaymentImpact(
  currentBalance: PlayerBalance,
  paymentAmount: MoneyInput
): {
  newBalance: Money
  isFullySettled: boolean
  remainingDebt: Money
  overpayment: Money
} {
  const payment = money(paymentAmount)
  const newBalance = currentBalance.currentBalance.add(payment)
  
  return {
    newBalance,
    isFullySettled: newBalance.gte(0),
    remainingDebt: newBalance.isNegative() ? newBalance.abs() : money(0),
    overpayment: newBalance.isPositive() ? newBalance : money(0)
  }
}

/**
 * Suggest optimal payment amounts
 */
export function suggestPaymentAmounts(balance: PlayerBalance): {
  settleDebt: Money | null
  roundUpAmount: Money | null
  minimumPayment: Money | null
} {
  if (!balance.isDebt) {
    return {
      settleDebt: null,
      roundUpAmount: null,
      minimumPayment: null
    }
  }
  
  const debt = balance.currentBalance.abs()
  
  // Exact amount to settle
  const settleDebt = debt
  
  // Round up to nearest $5 or $10
  const roundUpAmount = debt.lessThan(10) 
    ? money(Math.ceil(debt.div(5).toNumber()) * 5)
    : money(Math.ceil(debt.div(10).toNumber()) * 10)
  
  // Minimum payment (half of debt, min $5)
  const minimumPayment = debt.div(2).lessThan(5) ? money(5) : debt.div(2)
  
  return {
    settleDebt,
    roundUpAmount: roundUpAmount.gt(settleDebt) ? roundUpAmount : null,
    minimumPayment: minimumPayment.lt(settleDebt) ? minimumPayment : null
  }
}

/**
 * Calculate balance trend over time
 */
export function calculateBalanceTrend(
  sessions: SessionRecord[],
  payments: PaymentRecord[]
): {
  date: Date
  balance: Money
  sessionAmount?: Money
  paymentAmount?: Money
}[] {
  // Combine and sort all transactions by date
  const transactions: Array<{
    date: Date
    type: 'session' | 'payment'
    amount: Money
  }> = [
    ...sessions.map(s => ({
      date: s.date,
      type: 'session' as const,
      amount: s.amountOwed.neg() // Sessions decrease balance
    })),
    ...payments.map(p => ({
      date: p.paymentDate,
      type: 'payment' as const,
      amount: p.amount // Payments increase balance
    }))
  ]
  
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime())
  
  // Calculate running balance
  let runningBalance = money(0)
  const trend = transactions.map(transaction => {
    runningBalance = runningBalance.add(transaction.amount)
    
    return {
      date: transaction.date,
      balance: runningBalance,
      sessionAmount: transaction.type === 'session' ? transaction.amount.abs() : undefined,
      paymentAmount: transaction.type === 'payment' ? transaction.amount : undefined
    }
  })
  
  return trend
}

/**
 * Export utilities for common balance operations
 */
export const BalanceUtils = {
  /**
   * Format balance for display with appropriate styling
   */
  formatBalance: (balance: PlayerBalance) => ({
    amount: SGD.format(balance.currentBalance.abs()),
    status: balance.isDebt ? 'debt' : balance.isCredit ? 'credit' : 'settled',
    displayText: balance.isDebt 
      ? `Owes ${SGD.format(balance.currentBalance.abs())}`
      : balance.isCredit 
        ? `Credit ${SGD.format(balance.currentBalance)}`
        : 'Settled'
  }),
  
  /**
   * Get balance status color
   */
  getBalanceColor: (balance: PlayerBalance) => 
    balance.isDebt ? 'red' : balance.isCredit ? 'green' : 'gray',
  
  /**
   * Check if payment amount is valid
   */
  isValidPaymentAmount: (amount: MoneyInput) => {
    try {
      const payment = money(amount)
      return payment.isPositive()
    } catch {
      return false
    }
  }
}