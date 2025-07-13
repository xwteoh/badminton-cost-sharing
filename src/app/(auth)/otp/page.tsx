'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { OTPInput } from '@/components/ui/OTPInput'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatPhoneDisplay } from '@/lib/validation/phone'

export default function OTPPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [hasRedirected, setHasRedirected] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Wrap useAuth in try-catch for error handling
  let authData
  try {
    authData = useAuth()
  } catch (error) {
    console.error('🔐 OTP page: Error getting auth context:', error)
    // Fallback values
    authData = { 
      verifyOtp: () => Promise.resolve({ error: null }), 
      signInWithPhone: () => Promise.resolve({ error: null }), 
      user: null, 
      role: null, 
      loading: false 
    }
  }
  
  const { verifyOtp, signInWithPhone, user, role, loading } = authData
  const phone = searchParams.get('phone') || ''

  // Redirect if already authenticated
  useEffect(() => {
    if (hasRedirected) return
    
    console.log('🔐 OTP page: Auth state check', { 
      loading, 
      hasUser: !!user, 
      role,
      userId: user?.id 
    })
    
    if (!loading && user && role) {
      console.log('🔐 OTP page: User already authenticated, redirecting to dashboard')
      setHasRedirected(true)
      // Use window.location for reliable redirect
      if (role === 'organizer') {
        window.location.href = '/dashboard'
      } else if (role === 'player') {
        window.location.href = '/player'
      }
    }
  }, [user, role, loading, hasRedirected])

  // Redirect if no phone number
  useEffect(() => {
    if (!phone && !hasRedirected) {
      console.log('🔐 OTP page: No phone number, redirecting to login')
      router.replace('/login')
    }
  }, [phone, router, hasRedirected])

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [resendCountdown])

  const handleOtpChange = (value: string, isComplete: boolean) => {
    setOtp(value)
    setError('')
    
    if (isComplete) {
      handleVerifyOtp(value)
    }
  }

  const handleVerifyOtp = async (otpValue: string) => {
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error } = await verifyOtp(phone, otpValue)
      
      if (error) {
        if (error.message?.includes('expired')) {
          setError('OTP has expired. Please request a new code.')
        } else if (error.message?.includes('invalid')) {
          setError('Invalid verification code. Please try again.')
        } else {
          setError(error.message || 'Verification failed. Please try again.')
        }
        return
      }

      // Wait a moment for auth state to update, then redirect based on role
      setTimeout(() => {
        if (role === 'organizer') {
          router.replace('/dashboard')
        } else if (role === 'player') {
          router.replace('/player')
        } else {
          // Fallback - redirect to a setup page or default dashboard
          router.replace('/dashboard')
        }
      }, 100)
      
    } catch (error) {
      console.error('OTP verification error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResending(true)
    setError('')

    try {
      const { error } = await signInWithPhone(phone)
      
      if (error) {
        if (error.message?.includes('rate limit')) {
          setError('Too many attempts. Please wait before requesting another code.')
        } else {
          setError('Failed to resend OTP. Please try again.')
        }
      } else {
        setResendCountdown(60) // 60 second countdown
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  // Show loading state while redirecting authenticated users
  if (!loading && user && role && !hasRedirected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="text-2xl">🏸</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Already logged in, redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  if (!phone) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="text-2xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Verify Your Phone
          </h1>
          <p className="text-muted-foreground">
            Enter the verification code sent to{' '}
            <span className="font-medium text-foreground">
              {formatPhoneDisplay(phone)}
            </span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-6">
          <OTPInput
            onChange={handleOtpChange}
            onComplete={handleVerifyOtp}
            error={error}
            disabled={isLoading}
            autoFocus
          />

          <Button 
            onClick={() => handleVerifyOtp(otp)}
            className="w-full" 
            size="lg"
            loading={isLoading}
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
          </Button>
        </div>

        {/* Resend Section */}
        <div className="text-center space-y-4">
          {resendCountdown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in {resendCountdown} seconds
            </p>
          ) : (
            <button
              onClick={handleResendOtp}
              disabled={isResending}
              className="text-sm text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : "Didn't receive a code? Resend"}
            </button>
          )}

          <button
            onClick={handleBackToLogin}
            className="block w-full text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to phone number
          </button>
        </div>
      </div>
    </div>
  )
}