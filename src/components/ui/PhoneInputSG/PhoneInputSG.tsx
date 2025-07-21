'use client'

import { forwardRef, useState, useEffect } from 'react'

import { cn } from '@/lib/utils/cn'
import { formatSingaporePhone, parsePhoneInput, getLocalPhoneDisplay } from '@/lib/validation/phone'

export interface PhoneInputSGProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  onChange?: (value: string, isValid: boolean) => void
  error?: string | undefined
  label?: string
  required?: boolean
  value?: string // Controlled component support
}

const PhoneInputSG = forwardRef<HTMLInputElement, PhoneInputSGProps>(
  ({ className, onChange, error, label, required, value, ...props }, ref) => {
    const [localValue, setLocalValue] = useState('') // Only store the local part without +65
    const [internalError, setInternalError] = useState<string>()

    // Handle controlled component - sync with external value
    useEffect(() => {
      if (value !== undefined) {
        const localPart = getLocalPhoneDisplay(value).replace(/\D/g, '')
        setLocalValue(localPart)
      }
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      
      // Only allow digits and limit to 8 digits
      const cleanInput = input.replace(/\D/g, '').slice(0, 8)
      
      // Update local display value
      setLocalValue(cleanInput)
      
      // Format for parent component - add +65 prefix if we have digits
      if (cleanInput) {
        const fullPhone = `+65${cleanInput}`
        const isValid = cleanInput.length === 8 && (cleanInput.startsWith('8') || cleanInput.startsWith('9') || cleanInput.startsWith('6'))
        
        // Show error for invalid numbers
        if (cleanInput.length === 8 && !isValid) {
          setInternalError('Singapore mobile numbers must start with 6, 8, or 9')
        } else if (cleanInput.length > 0 && cleanInput.length < 8) {
          // Show error for incomplete numbers only when user stops typing
          setInternalError(undefined)
        } else if (isValid) {
          setInternalError(undefined)
        }
        
        // Call parent onChange
        if (onChange) {
          onChange(fullPhone, isValid)
        }
      } else {
        // Empty input
        setInternalError(undefined)
        if (onChange) {
          onChange('', false)
        }
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // On blur, format the local display value with spacing
      if (localValue && localValue.length === 8) {
        const formatted = `${localValue.slice(0, 4)} ${localValue.slice(4)}`
        setLocalValue(formatted)
      }
      
      // Show validation error on blur for incomplete numbers
      if (localValue && localValue.length > 0 && localValue.length < 8) {
        setInternalError('Please enter a complete 8-digit phone number')
      }
      
      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // On focus, remove spacing for easier editing
      setLocalValue(localValue.replace(/\s/g, ''))
      
      if (props.onFocus) {
        props.onFocus(e)
      }
    }

    const displayError = error || internalError
    const hasError = Boolean(displayError)

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold select-none transition-all duration-300">
            <span className="text-primary">+65</span>
          </div>
          
          <input
            className={cn(
              'flex h-12 w-full rounded-lg border border-input bg-background pl-12 pr-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg focus:shadow-primary/25 focus:border-primary/50 hover:border-primary/30 hover:-translate-y-0.5 focus:-translate-y-0.5',
              'text-base font-medium text-foreground',
              'placeholder:text-gray-400 placeholder:font-light placeholder:text-sm placeholder:opacity-60',
              hasError && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            type="tel"
            inputMode="numeric"
            placeholder="Enter 8 digits"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            ref={ref}
            {...props}
          />
        </div>
        
        {displayError && (
          <p className="text-sm text-destructive" role="alert">
            {displayError}
          </p>
        )}
        
        <p className="text-xs text-gray-400">
          Enter your Singapore mobile number (8XXXXXXX or 9XXXXXXX)
        </p>
      </div>
    )
  }
)

PhoneInputSG.displayName = 'PhoneInputSG'

export { PhoneInputSG }