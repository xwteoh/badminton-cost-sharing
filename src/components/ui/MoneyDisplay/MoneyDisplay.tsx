'use client'

import { cn } from '@/lib/utils/cn'
import { money, formatMoney, SGD, type MoneyInput } from '@/lib/calculations/money'

export interface MoneyDisplayProps {
  /** Monetary value to display */
  value: MoneyInput
  /** Display variant for different contexts */
  variant?: 'default' | 'balance' | 'large' | 'compact'
  /** Color scheme based on value */
  colorScheme?: 'auto' | 'neutral' | 'success' | 'danger' | 'warning'
  /** Whether to show the SGD currency symbol */
  showCurrency?: boolean
  /** Whether to show + sign for positive values */
  showSign?: boolean
  /** Number of decimal places (default: 2) */
  decimalPlaces?: number
  /** Custom className */
  className?: string
  /** Loading state */
  loading?: boolean
  /** Prefix text */
  prefix?: string
  /** Suffix text */
  suffix?: string
  /** Size of the display */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function MoneyDisplay({
  value,
  variant = 'default',
  colorScheme = 'auto',
  showCurrency = true,
  showSign = false,
  decimalPlaces = 2,
  className,
  loading = false,
  prefix,
  suffix,
  size = 'md'
}: MoneyDisplayProps) {
  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-muted rounded w-20"></div>
      </div>
    )
  }

  const amount = money(value)
  const isPositive = amount.isPositive()
  const isNegative = amount.isNegative()
  const isZero = amount.isZero()

  // Determine color scheme
  const effectiveColorScheme = colorScheme === 'auto' 
    ? isNegative ? 'danger' : isPositive ? 'success' : 'neutral'
    : colorScheme

  // Format the amount
  const formatted = formatMoney(amount, {
    showCurrency,
    showSign,
    decimalPlaces
  })

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  // Variant specific classes
  const variantClasses = {
    default: '',
    balance: 'font-semibold',
    large: 'text-2xl font-bold',
    compact: 'text-sm font-medium'
  }

  // Color classes
  const colorClasses = {
    auto: '', // Will be overridden
    neutral: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400', 
    warning: 'text-yellow-600 dark:text-yellow-400'
  }

  // Status indicators for balance variant
  const getBalanceIndicator = () => {
    if (variant !== 'balance') return null
    
    if (isZero) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 ml-2">
          Settled
        </span>
      )
    }
    
    if (isNegative) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 ml-2">
          Owes
        </span>
      )
    }
    
    if (isPositive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">
          Credit
        </span>
      )
    }
    
    return null
  }

  return (
    <span 
      className={cn(
        'font-mono tabular-nums',
        sizeClasses[size],
        variantClasses[variant],
        colorClasses[effectiveColorScheme],
        className
      )}
      title={`${prefix || ''}${formatted}${suffix || ''}`}
    >
      {prefix && <span className="font-sans mr-1">{prefix}</span>}
      {formatted}
      {suffix && <span className="font-sans ml-1">{suffix}</span>}
      {getBalanceIndicator()}
    </span>
  )
}

// Convenience components for common use cases
export function BalanceDisplay({ 
  value, 
  ...props 
}: Omit<MoneyDisplayProps, 'variant'>) {
  return (
    <MoneyDisplay 
      value={value} 
      variant="balance" 
      showSign={false}
      {...props} 
    />
  )
}

export function DebtDisplay({ 
  value, 
  ...props 
}: Omit<MoneyDisplayProps, 'variant' | 'colorScheme'>) {
  const amount = money(value)
  return (
    <MoneyDisplay 
      value={amount.abs()} 
      variant="default" 
      colorScheme="danger"
      prefix="Owes "
      {...props} 
    />
  )
}

export function CreditDisplay({ 
  value, 
  ...props 
}: Omit<MoneyDisplayProps, 'variant' | 'colorScheme'>) {
  return (
    <MoneyDisplay 
      value={value} 
      variant="default" 
      colorScheme="success"
      prefix="Credit "
      {...props} 
    />
  )
}

export function CostDisplay({ 
  value, 
  ...props 
}: Omit<MoneyDisplayProps, 'variant'>) {
  return (
    <MoneyDisplay 
      value={value} 
      variant="default" 
      colorScheme="neutral"
      {...props} 
    />
  )
}

export function LargeCurrencyDisplay({ 
  value, 
  ...props 
}: Omit<MoneyDisplayProps, 'variant' | 'size'>) {
  return (
    <MoneyDisplay 
      value={value} 
      variant="large" 
      size="xl"
      {...props} 
    />
  )
}