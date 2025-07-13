'use client'

import { forwardRef, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

export interface OTPInputProps {
  length?: number
  onChange?: (value: string, isComplete: boolean) => void
  onComplete?: (value: string) => void
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

const OTPInput = forwardRef<HTMLDivElement, OTPInputProps>(
  ({ 
    length = 6, 
    onChange, 
    onComplete, 
    error, 
    disabled = false, 
    autoFocus = false, 
    className 
  }, ref) => {
    const [values, setValues] = useState<string[]>(Array(length).fill(''))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    }, [autoFocus])

    const handleChange = (index: number, value: string) => {
      // Only allow numeric input
      if (value && !/^\d$/.test(value)) return

      const newValues = [...values]
      newValues[index] = value
      setValues(newValues)

      const fullValue = newValues.join('')
      const isComplete = fullValue.length === length

      if (onChange) {
        onChange(fullValue, isComplete)
      }

      if (isComplete && onComplete) {
        onComplete(fullValue)
      }

      // Auto-advance to next input
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle backspace
      if (e.key === 'Backspace') {
        if (!values[index] && index > 0) {
          // If current input is empty, go to previous and clear it
          const newValues = [...values]
          newValues[index - 1] = ''
          setValues(newValues)
          inputRefs.current[index - 1]?.focus()
          
          const fullValue = newValues.join('')
          if (onChange) {
            onChange(fullValue, false)
          }
        } else if (values[index]) {
          // Clear current input
          const newValues = [...values]
          newValues[index] = ''
          setValues(newValues)
          
          const fullValue = newValues.join('')
          if (onChange) {
            onChange(fullValue, false)
          }
        }
      }
      // Handle arrow keys
      else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
      // Handle paste
      else if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData('text/plain')
      const digits = pastedData.replace(/\D/g, '').slice(0, length)
      
      if (digits) {
        const newValues = Array(length).fill('')
        for (let i = 0; i < digits.length; i++) {
          newValues[i] = digits[i]
        }
        setValues(newValues)
        
        const fullValue = newValues.join('')
        const isComplete = fullValue.length === length
        
        if (onChange) {
          onChange(fullValue, isComplete)
        }
        
        if (isComplete && onComplete) {
          onComplete(fullValue)
        }
        
        // Focus the next empty input or the last input if all filled
        const nextEmptyIndex = newValues.findIndex(val => val === '')
        const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1
        inputRefs.current[focusIndex]?.focus()
      }
    }

    const handleFocus = (index: number) => {
      // Select all text when focusing
      inputRefs.current[index]?.select()
    }

    return (
      <div className={cn('space-y-4', className)} ref={ref}>
        <div className="flex justify-center gap-3">
          {Array.from({ length }).map((_, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={values[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              disabled={disabled}
              className={cn(
                'h-14 w-12 rounded-lg border border-input bg-background text-center text-lg font-mono font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-destructive focus-visible:ring-destructive',
                values[index] && 'border-primary'
              )}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>
        
        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground text-center">
          Enter the 6-digit code sent to your phone
        </p>
      </div>
    )
  }
)

OTPInput.displayName = 'OTPInput'

export { OTPInput }