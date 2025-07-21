'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  // Modern base styles with enhanced touch targets and transitions
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm border border-border',
        destructive: 'bg-gradient-to-r from-destructive to-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
        success: 'bg-gradient-to-r from-success to-success-hover text-success-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
        warning: 'bg-gradient-to-r from-warning to-warning-hover text-warning-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 shadow-sm hover:shadow-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        link: 'text-primary underline-offset-4 hover:underline',
        glass: 'bg-glass-background backdrop-blur-md border border-glass-border hover:bg-glass-background/80 shadow-sm hover:shadow-md',
      },
      size: {
        // Enhanced touch targets with modern spacing
        default: 'h-12 px-6 py-3 text-base rounded-lg', // 48px height (preferred)
        sm: 'h-11 rounded-md px-4 text-sm', // 44px height (minimum)
        lg: 'h-14 rounded-xl px-8 text-lg', // 56px height (comfortable)
        xl: 'h-16 rounded-xl px-10 text-xl', // 64px height (large)
        icon: 'h-12 w-12 rounded-lg', // 48px square
        'icon-sm': 'h-11 w-11 rounded-md', // 44px square (minimum)
        'icon-lg': 'h-14 w-14 rounded-xl', // 56px square (comfortable)
      },
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, asChild, ...props }, ref) => {
    if (asChild) {
      // For asChild functionality, we'd need a library like Radix's Slot component
      // For now, we'll just render the children directly
      return <>{children}</>
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Modern loading spinner */}
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Left icon with proper spacing */}
        {!loading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        
        {/* Button content */}
        <span className="flex items-center justify-center">
          {children}
        </span>
        
        {/* Right icon with proper spacing */}
        {!loading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
        
        {/* Modern ripple effect overlay */}
        <span className="absolute inset-0 rounded-inherit bg-white opacity-0 transition-opacity duration-200 hover:opacity-10 active:opacity-20 pointer-events-none" />
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }