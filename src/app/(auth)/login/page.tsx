'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Simplified form without react-hook-form for Phase 1
import { Button } from '@/components/ui/Button'
import { PhoneInputSG } from '@/components/ui/PhoneInputSG'
import { useAuth } from '@/components/providers/AuthProvider'
// PhoneInputSG handles all validation internally

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneValid, setPhoneValid] = useState(false)
  const router = useRouter()
  const [formError, setFormError] = useState('')
  const [hasRedirected, setHasRedirected] = useState(false)

  // Wrap useAuth in try-catch for error handling
  let authData
  try {
    authData = useAuth()
  } catch (error) {
    console.error('🔐 Login page: Error getting auth context:', error)
    // Fallback values
    authData = { signInWithPhone: () => Promise.resolve({ error: null }), user: null, role: null, loading: false }
  }
  
  const { signInWithPhone, user, role, loading } = authData

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
      console.log('🔐 Login page: User already authenticated, redirecting to dashboard')
      setHasRedirected(true)
      // Use window.location for reliable redirect
      if (role === 'organizer') {
        window.location.href = '/dashboard'
      } else if (role === 'player') {
        window.location.href = '/player'
      }
    }
  }, [user, role, loading, hasRedirected])

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneValid || !phone) {
      setFormError('Please enter a valid Singapore phone number')
      return
    }

    setIsLoading(true)
    setFormError('')

    try {
      console.log('📱 Attempting to sign in with phone:', phone)
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
      router.push(otpUrl)
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="text-2xl">🏸</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Badminton Cost Tracker
          </h1>
          <p className="text-muted-foreground">
            Sign in with your phone number to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <PhoneInputSG
            label="Phone Number"
            placeholder="8123 4567"
            onChange={handlePhoneChange}
            required
            autoFocus
            disabled={isLoading}
          />
          
          {formError && (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            loading={isLoading}
            disabled={!phoneValid || isLoading}
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP Code'}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We'll send a verification code to your phone
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            <span>Simple</span>
            <span>•</span>
            <span>Secure</span>
            <span>•</span>
            <span>Fast</span>
          </div>
        </div>
      </div>
    </div>
  )
}