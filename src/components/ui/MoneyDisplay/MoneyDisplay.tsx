'use client'

import { money, formatMoney, SGD, type MoneyInput } from '@/lib/calculations/money'
import { cn } from '@/lib/utils/cn'

export interface MoneyDisplayProps {
  /** Monetary value to display */
  value: MoneyInput
  /** Display variant for different contexts */
  variant?: 'default' | 'balance' | 'large' | 'compact' | 'card' | 'badge' | 'highlight'
  /** Color scheme based on value */
  colorScheme?: 'auto' | 'neutral' | 'success' | 'danger' | 'warning'
  /** Whether to show the SGD currency symbol */
  showCurrency?: boolean
  /** Whether to show + sign for positive values */
  showSign?: boolean
  /** Number of decimal places (default: 1) */
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
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function MoneyDisplay({
  value,
  variant = 'default',
  colorScheme = 'auto',
  showCurrency = true,
  showSign = false,
  decimalPlaces = 1,
  className,
  loading = false,
  prefix,
  suffix,
  size = 'md'
}: MoneyDisplayProps) {
  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
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

  // Size classes with modern scaling
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  }

  // Variant specific classes with modern styling
  const variantClasses = {
    default: '',
    balance: 'font-semibold',
    large: 'text-2xl font-bold',
    compact: 'text-sm font-medium',
    card: 'font-semibold bg-gradient-to-r from-card to-card/80 backdrop-blur-sm border border-border/20 rounded-lg px-3 py-2 shadow-sm',
    badge: 'font-medium bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 rounded-full px-3 py-1 text-sm',
    highlight: 'font-bold bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-all duration-200'
  }

  // Color classes with modern design system
  const colorClasses = {
    auto: '', // Will be overridden
    neutral: 'text-money-neutral',
    success: 'text-money-positive',
    danger: 'text-money-negative', 
    warning: 'text-warning'
  }

  // Status indicators for balance variant
  const getBalanceIndicator = () => {
    if (variant !== 'balance') return null
    
    if (isZero) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-money-neutral-light text-money-neutral ml-2 shadow-sm">
          Settled
        </span>
      )
    }
    
    if (isNegative) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-money-negative-light text-money-negative ml-2 shadow-sm">
          Owes
        </span>
      )
    }
    
    if (isPositive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-money-positive-light text-money-positive ml-2 shadow-sm">
          Credit
        </span>
      )
    }
    
    return null
  }

  return (
    <span 
      className={cn(
        'font-mono tabular-nums transition-all duration-200',
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