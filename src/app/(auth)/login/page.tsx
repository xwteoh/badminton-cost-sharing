'use client'

import { useState, useEffect } from 'react'

// Simplified form without react-hook-form for Phase 1
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { PhoneInputSG } from '@/components/ui/PhoneInputSG'
import { createClientSupabaseClient } from '@/lib/supabase/client'
// PhoneInputSG handles all validation internally

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneValid, setPhoneValid] = useState(false)
  const [formError, setFormError] = useState('')
  const [hasRedirected, setHasRedirected] = useState(false)

  // Use useAuth directly - no try-catch with hooks
  const { signInWithPhone, user, role, loading } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (hasRedirected) return
    
    console.log('🔐 Login page: Auth state check', { 
      loading, 
      hasUser: !!user, 
      role,
      userId: user?.id 
    })
    
    if (!loading && user && role) {
      console.log('🔐 Login page: User already authenticated, redirecting...', {
        role,
        willRedirectTo: role === 'organizer' ? '/dashboard' : '/player-dashboard'
      })
      setHasRedirected(true)
      // Use window.location for reliable redirect
      if (role === 'organizer') {
        console.log('🔐 Redirecting to organizer dashboard')
        window.location.href = '/dashboard'
      } else {
        // Default to player dashboard for all other users
        console.log('🔐 Redirecting to player dashboard')
        window.location.href = '/player-dashboard'
      }
    }
  }, [user, role, loading, hasRedirected])

  // Show loading state while redirecting authenticated users
  if (!loading && user && role && !hasRedirected) {
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneValid || !phone) {
      setFormError('Please enter a valid Singapore phone number')
      return
    }

    setIsLoading(true)
    setFormError('')

    try {
      console.log('📱 Checking if phone number is authorized:', phone)
      console.log('📱 Phone length:', phone.length)
      console.log('📱 Phone characters:', phone.split('').map(c => `'${c}'`).join(', '))
      
      // Normalize phone number for comparison (remove spaces and ensure +65 prefix)
      const normalizePhone = (phoneNumber: string): string => {
        // Remove all non-digits
        const digits = phoneNumber.replace(/\D/g, '')
        
        // If it's 8 digits starting with 8 or 9 (Singapore mobile), add 65 prefix
        if (digits.length === 8 && (digits.startsWith('8') || digits.startsWith('9') || digits.startsWith('6'))) {
          return `65${digits}`
        }
        
        // If it already starts with 65, keep it as is
        if (digits.startsWith('65')) {
          return digits
        }
        
        // Otherwise, add 65 prefix
        return `65${digits}`
      }
      
      const normalizedPhone = normalizePhone(phone)
      console.log('📱 Normalized phone:', normalizedPhone)
      
      // First, check if phone number exists in our system
      const supabase = createClientSupabaseClient()
      
      // Check phone number using public view (bypasses RLS)
      const { data: phoneCheckData, error: phoneCheckError } = await supabase
        .from('public_phone_check')
        .select('phone_number, type')
        .in('phone_number', [phone, normalizedPhone, `+${normalizedPhone}`])
      
      console.log('📱 Phone check via public view:', { 
        data: phoneCheckData, 
        error: phoneCheckError,
        searchingFor: [phone, normalizedPhone, `+${normalizedPhone}`]
      })
      
      const matchingUser = phoneCheckData?.some(p => p.type === 'user') || false
      const matchingPlayer = phoneCheckData?.some(p => p.type === 'player') || false
      
      console.log('📱 Authorization check results:', { 
        userExists: !!matchingUser, 
        playerExists: !!matchingPlayer,
        matchingUser,
        matchingPlayer,
        phoneVariants: {
          original: phone,
          normalized: normalizedPhone
        }
      })
      
      // Allow login if user exists OR if they're an active player
      const isAuthorized = !!matchingUser || !!matchingPlayer
      
      if (!isAuthorized) {
        setFormError('This phone number is not registered in the system. Please contact your organizer to be added as a player.')
        return
      }

      console.log('📱 Phone number authorized, attempting to sign in with phone:', phone)
      const { error } = await signInWithPhone(phone)
      console.log('📱 Sign in response:', { error })
      
      if (error) {
        console.log('📱 Sign in error:', error)
        if (error.message?.includes('rate limit')) {
          setFormError('Too many attempts. Please wait before trying again.')
        } else {
          setFormError(error.message || 'Failed to send OTP. Please try again.')
        }
        return
      }
      
      console.log('📱 Sign in successful, proceeding to navigation')

      // Navigate to OTP verification with phone number
      console.log('📱 Navigating to OTP with phone:', phone)
      const otpUrl = `/otp?phone=${encodeURIComponent(phone)}`
      console.log('📱 OTP URL:', otpUrl)
      window.location.href = otpUrl
    } catch (error) {
      console.error('Login error:', error)
      setFormError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (value: string, isValid: boolean) => {
    setPhone(value)
    setPhoneValid(isValid)
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
            <span className="text-4xl filter drop-shadow-sm relative z-10">🏸</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight hover:scale-105 transition-transform duration-300" style={{
              background: 'linear-gradient(to right, #7c3aed, #6d28d9, #22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Badminton Cost Tracker
            </h1>
            <p className="text-lg font-medium transition-colors duration-300" style={{ 
              color: '#6b7280' 
            }} onMouseEnter={(e) => {
              e.currentTarget.style.color = '#374151'
            }} onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7280'
            }}>
              Sign in with your phone number to continue
            </p>
          </div>
        </div>

        {/* Premium Login Form */}
        <div className="p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden" style={{ borderRadius: '24px' }}
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
          <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
          <PhoneInputSG
            label="Phone Number"
            placeholder="8123 4567"
            onChange={handlePhoneChange}
            required
            autoFocus
            disabled={isLoading}
          />
          
          {formError && (
            <div className="rounded-lg p-4 animate-fadeIn" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div className="flex items-center space-x-2">
                <span style={{ color: '#ef4444' }}>⚠️</span>
                <p className="text-sm font-medium" style={{ color: '#ef4444' }} role="alert">
                  {formError}
                </p>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            size="lg"
            className="w-full font-bold text-base text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              background: (!phoneValid || isLoading) 
                ? 'linear-gradient(135deg, hsl(250, 84%, 54%, 0.5) 0%, hsl(250, 84%, 48%, 0.5) 100%)' 
                : 'linear-gradient(135deg, hsl(250, 84%, 54%) 0%, hsl(250, 84%, 48%) 100%)',
              border: 'none'
            }}
            loading={isLoading}
            disabled={!phoneValid || isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">📱</span>
                Sending OTP...
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Send OTP Code
              </>
            )}
          </Button>
          </form>
        </div>

        {/* Premium Footer */}
        <div className="text-center space-y-6">
          <div className="backdrop-blur-sm rounded-xl p-4 relative overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(124, 58, 237, 0.1), rgba(34, 197, 94, 0.1))',
              borderRadius: '16px'
            }}></div>
            <div className="absolute inset-0" style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px'
            }}></div>
            <p className="text-sm font-medium relative z-10" style={{ color: '#6b7280' }}>
              We'll send a verification code to your phone
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300 px-3 py-2 rounded-full" style={{
              color: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)'
            }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }}></span>
              <span className="font-bold">Simple</span>
            </div>
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300 px-3 py-2 rounded-full" style={{
              color: '#7c3aed',
              backgroundColor: 'rgba(124, 58, 237, 0.1)'
            }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#7c3aed' }}></span>
              <span className="font-bold">Secure</span>
            </div>
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300 px-3 py-2 rounded-full" style={{
              color: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)'
            }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#f59e0b' }}></span>
              <span className="font-bold">Fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}