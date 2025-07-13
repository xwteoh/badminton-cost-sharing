'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatSingaporePhone, parsePhoneInput } from '@/lib/validation/phone'

export interface PhoneInputSGProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string, isValid: boolean) => void
  error?: string | undefined
  label?: string
  required?: boolean
}

const PhoneInputSG = forwardRef<HTMLInputElement, PhoneInputSGProps>(
  ({ className, onChange, error, label, required, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')
    const [internalError, setInternalError] = useState<string>()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      const result = parsePhoneInput(input)
      
      // Update display value (keep user's input for better UX)
      setDisplayValue(input)
      
      // Update internal error state
      setInternalError(result.error)
      
      // Call parent onChange with formatted value and validation status
      if (onChange) {
        onChange(result.formatted, result.isValid)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // On blur, format the display value
      if (displayValue) {
        const formatted = formatSingaporePhone(displayValue)
        setDisplayValue(formatted)
      }
      
      if (props.onBlur) {
        props.onBlur(e)
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
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground select-none">
            +65
          </div>
          
          <input
            className={cn(
              'flex h-12 w-full rounded-lg border border-input bg-background pl-12 pr-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              hasError && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            type="tel"
            inputMode="numeric"
            placeholder="8123 4567"
            value={displayValue.replace('+65', '')}
            onChange={handleInputChange}
            onBlur={handleBlur}
            ref={ref}
            {...props}
          />
        </div>
        
        {displayError && (
          <p className="text-sm text-destructive" role="alert">
            {displayError}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground">
          Enter your Singapore mobile number (8XXXXXXX or 9XXXXXXX)
        </p>
      </div>
    )
  }
)

PhoneInputSG.displayName = 'PhoneInputSG'

export { PhoneInputSG }