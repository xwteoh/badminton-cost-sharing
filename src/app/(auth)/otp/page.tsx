'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { OTPInput } from '@/components/ui/OTPInput'
import { formatPhoneDisplay } from '@/lib/validation/phone'

export default function OTPPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Use useAuth directly - no try-catch with hooks
  const { verifyOtp, signInWithPhone, user, userProfile, role, loading } = useAuth()
  const phone = searchParams.get('phone') || ''

  // Only redirect if user is already authenticated when page loads
  useEffect(() => {
    if (!loading && user && role && userProfile) {
      if (role === 'organizer') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/player-dashboard'
      }
    }
  }, [loading, user, role, userProfile])

  // Redirect if no phone number
  useEffect(() => {
    if (!phone) {
      window.location.href = '/login'
    }
  }, [phone, router])

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
        setIsLoading(false)
        return
      }

      // Success - wait for complete user profile to be loaded before redirecting
      console.log('🔐 OTP verification successful, waiting for complete profile...')
      
      // Use a polling approach with timeout to wait for complete profile
      let attempts = 0
      const maxAttempts = 30 // Max 15 seconds (30 * 500ms)
      
      const checkProfileAndRedirect = () => {
        attempts++
        console.log(`🔐 Checking profile attempt ${attempts}:`, { 
          hasRole: !!role, 
          hasUserProfile: !!userProfile,
          roleValue: role,
          profilePhone: userProfile?.phone_number
        })
        
        // Wait for both role AND userProfile to be available
        if (role && role !== null && userProfile && userProfile.id) {
          // Complete profile is now available, redirect accordingly
          console.log('🔐 Complete profile loaded, redirecting...', { role, profileId: userProfile.id })
          if (role === 'organizer') {
            window.location.href = '/dashboard'
          } else {
            window.location.href = '/player-dashboard'
          }
          return
        }
        
        if (attempts >= maxAttempts) {
          // Timeout reached, redirect to home page which will handle role-based redirect
          console.warn('🔐 Profile loading timeout, redirecting to home page')
          window.location.href = '/'
          return
        }
        
        // Continue checking
        setTimeout(checkProfileAndRedirect, 500)
      }
      
      // Start the profile checking process
      setTimeout(checkProfileAndRedirect, 100)
      
    } catch (error) {
      console.error('OTP verification error:', error)
      setError('Something went wrong. Please try again.')
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
    window.location.href = '/login'
  }

  // Show loading state while redirecting authenticated users
  if (!loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{
            backgroundColor: 'rgba(124, 58, 237, 0.1)'
          }}>
            <span className="text-2xl">🏸</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 mx-auto" style={{
            borderBottom: '2px solid #7c3aed',
            borderTop: '2px solid transparent',
            borderLeft: '2px solid transparent',
            borderRight: '2px solid transparent'
          }}></div>
          <p className="text-sm" style={{ color: '#6b7280' }}>Already logged in, redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  if (!phone) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden" style={{
      background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), rgba(255, 255, 255, 0.95), rgba(34, 197, 94, 0.05))'
    }}>
      {/* Premium Background Layers */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.1), transparent, rgba(34, 197, 94, 0.1))'
      }}></div>
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), transparent)'
      }}></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-48 translate-y-48" style={{
        background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.2), transparent)'
      }}></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Premium Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-xl hover:scale-110 transition-all duration-300 hover:shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.2), rgba(34, 197, 94, 0.2))',
              borderRadius: '16px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-sm" style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px'
            }}></div>
            <span className="text-4xl filter drop-shadow-sm relative z-10">📱</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight hover:scale-105 transition-transform duration-300" style={{
              background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Verify Your Phone
            </h1>
            <p className="text-lg font-medium transition-colors duration-300" style={{ 
              color: '#6b7280' 
            }} onMouseEnter={(e) => {
              e.currentTarget.style.color = '#374151'
            }} onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7280'
            }}>
              Enter the verification code sent to
            </p>
          </div>
          <div className="backdrop-blur-sm rounded-2xl px-4 py-3 relative overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(34, 197, 94, 0.1))',
              borderRadius: '16px'
            }}></div>
            <div className="absolute inset-0" style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px'
            }}></div>
            <div className="flex items-center justify-center space-x-2 relative z-10">
              <span className="text-lg" style={{ color: '#7c3aed' }}>📱</span>
              <span className="font-bold text-lg" style={{ color: '#7c3aed' }}>
                {formatPhoneDisplay(phone)}
              </span>
            </div>
          </div>
        </div>

        {/* Premium OTP Input */}
        <div className="p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden" style={{ borderRadius: '24px' }}
             onMouseEnter={(e) => {
               e.currentTarget.style.border = '1px solid rgba(124, 58, 237, 0.3)'
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'
             }}>
          {/* Glassmorphism Background */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8))',
            borderRadius: '24px'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-md" style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px'
          }}></div>
          <div className="space-y-6 relative z-10">
            <OTPInput
              onChange={handleOtpChange}
              onComplete={handleVerifyOtp}
              error={error}
              disabled={isLoading}
              autoFocus
            />

            <Button 
              onClick={() => handleVerifyOtp(otp)}
              size="lg"
              className="w-full font-bold text-base text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: (otp.length !== 6 || isLoading) 
                  ? 'linear-gradient(135deg, hsl(250, 84%, 54%, 0.5) 0%, hsl(250, 84%, 48%, 0.5) 100%)' 
                  : 'linear-gradient(135deg, hsl(250, 84%, 54%) 0%, hsl(250, 84%, 48%) 100%)',
                border: 'none'
              }}
              loading={isLoading}
              disabled={otp.length !== 6 || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2">📱</span>
                  Verifying...
                </>
              ) : (
                <>
                  <span className="mr-2">✅</span>
                  Verify & Sign In
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Premium Resend Section */}
        <div className="text-center space-y-6">
          {resendCountdown > 0 ? (
            <div className="space-y-2">
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Resend code in {resendCountdown} seconds
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-md"
                style={{
                  color: '#7c3aed',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.1)'
                  e.currentTarget.style.color = '#6d28d9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#7c3aed'
                }}
              >
                {isResending ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></span>
                    <span>Sending...</span>
                  </span>
                ) : (
                  "Didn't receive a code? Resend"
                )}
              </button>
            </div>
          )}

          {/* Premium Back Link */}
          <div className="pt-4" style={{ borderTop: '1px solid rgba(107, 114, 128, 0.2)' }}>
            <button
              onClick={handleBackToLogin}
              className="text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-md"
              style={{
                color: '#6b7280',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.1)'
                e.currentTarget.style.color = '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              ← Back to phone number
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}