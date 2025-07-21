'use client'

import { MoneyDisplay, LargeCurrencyDisplay } from '@/components/ui/MoneyDisplay'
import { money, type MoneyInput } from '@/lib/calculations/money'
import { cn } from '@/lib/utils/cn'

export interface FinancialSummary {
  totalOutstanding: MoneyInput
  totalCredit: MoneyInput
  netBalance: MoneyInput
  playersInDebt: number
  playersInCredit: number
  settledPlayers: number
  totalPlayers: number
  recentSessionsCount: number
  thisMonthRevenue: MoneyInput
}

export interface FinancialSummaryCardProps {
  summary: FinancialSummary
  loading?: boolean
  className?: string
}

export function FinancialSummaryCard({ 
  summary, 
  loading = false, 
  className 
}: FinancialSummaryCardProps) {
  if (loading) {
    return (
      <div className={cn('relative overflow-hidden p-6 space-y-6', className)} style={{ 
        borderRadius: '24px',
        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
          borderRadius: '24px'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-xl" style={{
          border: '1px solid rgba(255, 255, 255, 0.18)',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
          borderRadius: '24px'
        }}></div>
        <div className="relative animate-pulse space-y-4">
          <div className="h-6 bg-muted/50 rounded w-1/3"></div>
          <div className="h-12 bg-muted/50 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-muted/50 rounded"></div>
            <div className="h-16 bg-muted/50 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const netAmount = money(summary.netBalance)
  const isProfit = netAmount.isPositive()
  const isLoss = netAmount.isNegative()

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ 
      borderRadius: '24px',
      boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
      transform: 'translateZ(0)'
    }}>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
        borderRadius: '24px'
      }}></div>
      <div className="absolute inset-0 backdrop-blur-xl" style={{
        border: '1px solid rgba(255, 255, 255, 0.18)',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
      }}></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
        borderRadius: '24px'
      }}></div>
      <div className="relative">
      {/* Header */}
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-card-foreground">
          Financial Overview
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Current balance and player status
        </p>
      </div>

      {/* Net Balance - Primary Metric */}
      <div className="px-6 pb-4">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Net Balance</p>
          <LargeCurrencyDisplay 
            value={summary.netBalance}
            colorScheme={isLoss ? 'success' : isProfit ? 'danger' : 'neutral'}
            className="text-3xl font-bold"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isLoss ? 'Total Credit' : isProfit ? 'Total Outstanding' : 'All Settled'}
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Outstanding Debt */}
          <div className="bg-money-negative-light/50 backdrop-blur-sm rounded-lg p-4 border border-money-negative/20">
            <div className="text-center">
              <MoneyDisplay 
                value={summary.totalOutstanding}
                colorScheme="danger"
                size="lg"
                className="font-semibold"
              />
              <p className="text-xs text-money-negative mt-1">Outstanding</p>
              <p className="text-xs text-money-negative/80">
                {summary.playersInDebt} player{summary.playersInDebt !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Credit Balance */}
          <div className="bg-money-positive-light/50 backdrop-blur-sm rounded-lg p-4 border border-money-positive/20">
            <div className="text-center">
              <MoneyDisplay 
                value={summary.totalCredit}
                colorScheme="success"
                size="lg"
                className="font-semibold"
              />
              <p className="text-xs text-money-positive mt-1">Credits</p>
              <p className="text-xs text-money-positive/80">
                {summary.playersInCredit} player{summary.playersInCredit !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Player Status Summary */}
      <div className="bg-muted/30 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="text-muted-foreground">
              <span className="font-medium">{summary.totalPlayers}</span> total players
            </div>
            <div className="text-muted-foreground">•</div>
            <div className="text-muted-foreground">
              <span className="font-medium">{summary.settledPlayers}</span> settled
            </div>
          </div>
          <div className="text-muted-foreground/80 text-xs">
            {summary.recentSessionsCount} sessions this month
          </div>
        </div>
      </div>

      {/* Monthly Revenue (if positive) */}
      {money(summary.thisMonthRevenue).isPositive() && (
        <div className="bg-primary/10 backdrop-blur-sm px-6 py-3 border-t border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary">This Month's Revenue</span>
            <MoneyDisplay 
              value={summary.thisMonthRevenue}
              colorScheme="neutral"
              size="sm"
              className="font-medium text-primary/90"
            />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

// Quick summary variant for smaller spaces
export function FinancialSummaryCompact({ 
  summary, 
  loading = false, 
  className 
}: FinancialSummaryCardProps) {
  if (loading) {
    return (
      <div className={cn('bg-card/50 backdrop-blur-sm rounded-lg shadow-sm border border-border/20 p-4', className)}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted/50 rounded w-1/2"></div>
          <div className="h-6 bg-muted/50 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  const netAmount = money(summary.netBalance)
  const isProfit = netAmount.isPositive()
  const isLoss = netAmount.isNegative()

  return (
    <div className={cn(
      'bg-card/50 backdrop-blur-sm rounded-lg shadow-sm border border-border/20 p-4',
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
          <MoneyDisplay 
            value={summary.netBalance}
            colorScheme={isLoss ? 'success' : isProfit ? 'danger' : 'neutral'}
            size="lg"
            className="font-semibold"
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{summary.totalPlayers} players</p>
          <p className="text-xs text-muted-foreground">
            {summary.playersInDebt} debt • {summary.playersInCredit} credit
          </p>
        </div>
      </div>
    </div>
  )
}