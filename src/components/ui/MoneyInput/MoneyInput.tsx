'use client'

import { useState, useEffect, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { money, parseMoney, formatMoney, isValidMoneyInput, type MoneyInput } from '@/lib/calculations/money'

export interface MoneyInputProps {
  /** Current monetary value (Decimal, number, or string) */
  value?: MoneyInput
  /** Callback when value changes - returns the monetary value as Decimal */
  onChange?: (value: string, isValid: boolean) => void
  /** Label for the input */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether input is required */
  required?: boolean
  /** Whether input is disabled */
  disabled?: boolean
  /** Error message to display */
  error?: string
  /** Helper text */
  helperText?: string
  /** Maximum allowed value */
  max?: MoneyInput
  /** Minimum allowed value (default: 0) */
  min?: MoneyInput
  /** Auto focus */
  autoFocus?: boolean
  /** Custom className */
  className?: string
  /** Show SGD currency symbol */
  showCurrency?: boolean
  /** Decimal places to show (default: 2) */
  decimalPlaces?: number
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({
    value,
    onChange,
    label,
    placeholder = '0.00',
    required = false,
    disabled = false,
    error,
    helperText,
    max,
    min = 0,
    autoFocus = false,
    className,
    showCurrency = true,
    decimalPlaces = 2,
    ...props
  }, ref) => {
    const [inputValue, setInputValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [isValid, setIsValid] = useState(true)

    // Initialize input value from prop
    useEffect(() => {
      if (value !== undefined) {
        try {
          const amount = money(value)
          setInputValue(formatMoney(amount, { 
            showCurrency: false, 
            decimalPlaces 
          }))
        } catch {
          setInputValue('')
        }
      } else {
        setInputValue('')
      }
    }, [value, decimalPlaces])

    const validateValue = (rawValue: string): boolean => {
      if (!rawValue.trim()) return true // Empty is valid

      if (!isValidMoneyInput(rawValue)) return false

      try {
        const amount = parseMoney(rawValue)
        
        // Check minimum
        if (min !== undefined && amount.lessThan(money(min))) return false
        
        // Check maximum  
        if (max !== undefined && amount.greaterThan(money(max))) return false
        
        return true
      } catch {
        return false
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      
      // Allow only numbers, decimal point, commas, and dollar sign
      const filteredValue = rawValue.replace(/[^0-9.,]/g, '')
      
      setInputValue(filteredValue)
      
      const valid = validateValue(filteredValue)
      setIsValid(valid)
      
      // Call onChange with the raw string value
      onChange?.(filteredValue, valid)
    }

    const handleBlur = () => {
      setIsFocused(false)
      
      if (inputValue.trim() && isValid) {
        try {
          // Format the value properly on blur
          const amount = parseMoney(inputValue)
          const formatted = formatMoney(amount, { 
            showCurrency: false, 
            decimalPlaces 
          })
          setInputValue(formatted)
        } catch {
          // Keep original value if parsing fails
        }
      }
    }

    const handleFocus = () => {
      setIsFocused(true)
    }

    const hasError = !isValid || !!error
    const displayValue = isFocused ? inputValue : inputValue

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {showCurrency && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              $
            </div>
          )}
          
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              // Base styles
              'flex h-12 w-full rounded-lg border bg-background text-right',
              'px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              
              // Currency padding
              showCurrency ? 'pl-8' : 'pl-3',
              
              // States
              hasError 
                ? 'border-destructive focus:ring-destructive' 
                : 'border-border focus:ring-primary',
              
              // Touch-friendly
              'min-h-[44px] touch-manipulation'
            )}
            {...props}
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {/* Validation Error */}
        {!isValid && !error && inputValue.trim() && (
          <p className="text-sm text-destructive" role="alert">
            Please enter a valid amount
          </p>
        )}

        {/* Helper Text */}
        {helperText && !hasError && (
          <p className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}

        {/* Value Range Helper */}
        {(min !== undefined || max !== undefined) && !hasError && (
          <p className="text-xs text-muted-foreground">
            {min !== undefined && max !== undefined
              ? `Amount must be between $${formatMoney(min, { showCurrency: false })} and $${formatMoney(max, { showCurrency: false })}`
              : min !== undefined
                ? `Minimum amount: $${formatMoney(min, { showCurrency: false })}`
                : `Maximum amount: $${formatMoney(max!, { showCurrency: false })}`
            }
          </p>
        )}
      </div>
    )
  }
)

MoneyInput.displayName = 'MoneyInput'