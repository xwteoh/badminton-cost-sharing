'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { PaymentForm, type PaymentFormData, type Player } from '@/components/business/PaymentForm'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { paymentService } from '@/lib/services/payments'
import { playerService } from '@/lib/services/players'

export default function RecordPaymentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)

  // Fetch players data function
  const fetchPlayers = async () => {
    if (!user?.id) return
    
    try {
      setPlayersLoading(true)
      console.log('👥 Fetching players for payment form')
      
      const playersData = await playerService.getPlayersWithBalances(user.id, false) // Only active players
      
      // Check specifically for temporary players
      const tempPlayers = playersData.filter(p => p.is_temporary)
      if (tempPlayers.length > 0) {
        console.log('👤 Found temporary players:', tempPlayers.length)
      }
      
      // Transform to PaymentForm Player interface
      const transformedPlayers: Player[] = playersData.map(player => ({
        id: player.id,
        name: player.name,
        phone: player.phone_number || '',
        currentBalance: player.current_balance || 0,
        isActive: player.is_active,
        is_temporary: player.is_temporary
      }))

      setPlayers(transformedPlayers)
      console.log(`✅ Loaded ${transformedPlayers.length} players for payment form`)
      
    } catch (error: any) {
      console.error('Error fetching players:', error)
      setSubmitError(error.message || 'Failed to load players')
    } finally {
      setPlayersLoading(false)
    }
  }

  // Check if temporary players were recently created and need refresh
  useEffect(() => {
    const tempPlayersCreated = localStorage.getItem('temp_players_created')
    if (tempPlayersCreated) {
      const createdTime = parseInt(tempPlayersCreated)
      const now = Date.now()
      // If temporary players were created within the last 30 seconds, refresh data
      if (now - createdTime < 30000) {
        console.log('🔄 Refreshing player data due to recent temporary players')
        localStorage.removeItem('temp_players_created')
        // Trigger a refresh by updating a timestamp
        setTimeout(() => {
          fetchPlayers()
        }, 1000) // Small delay to ensure database triggers have completed
      } else {
        // Clean up old flag
        localStorage.removeItem('temp_players_created')
      }
    }
  }, [user?.id])

  // Fetch players data on mount
  useEffect(() => {
    if (user?.id) {
      fetchPlayers()
    }
  }, [user?.id])

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading, router])

  // Show loading while checking auth or loading players
  if (loading || playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.03), #ffffff, rgba(245, 158, 11, 0.03))'
      }}>
        {/* Premium Loading Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.05), transparent, rgba(245, 158, 11, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(245, 158, 11, 0.1), transparent)'
        }}></div>
        
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-2xl mb-6" style={{
            background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-4xl filter drop-shadow-lg">💰</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="w-12 h-12 mx-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200" style={{ borderTopColor: '#22c55e' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold" style={{
                background: 'linear-gradient(to right, #22c55e, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Loading Payment Form
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                {loading ? 'Preparing payment interface...' : 'Loading players data...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handlePaymentSubmit = async (paymentData: PaymentFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    
    try {
      console.log('💰 Recording payment:', paymentData)
      
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      
      // Transform form data to payment service format
      const paymentServiceData = {
        organizer_id: user.id,
        player_id: paymentData.playerId,
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.paymentMethod,
        payment_date: paymentData.paymentDate,
        reference_number: paymentData.reference || null,
        notes: paymentData.notes || null,
      }
      
      // Create payment using the service
      const createdPayment = await paymentService.createPayment(paymentServiceData)
      console.log('✅ Payment recorded successfully:', createdPayment)
      
      // Success
      setSubmitSuccess(`Payment of $${paymentData.amount} from ${createdPayment.player?.name} has been recorded successfully!`)
      
      // Redirect to dashboard after showing success message
      setTimeout(() => {
        window.location.href = '/dashboard?payment=recorded'
      }, 2000)
      
    } catch (error: any) {
      console.error('Error recording payment:', error)
      setSubmitError(error.message || 'Failed to record payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['organizer']}>
      <div className="min-h-screen relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.03), #ffffff, rgba(245, 158, 11, 0.03))'
      }}>
        {/* Premium Background Pattern */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.05), transparent, rgba(245, 158, 11, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.08), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(245, 158, 11, 0.08), transparent)'
        }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
          background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent)'
        }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(245, 158, 11, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
            background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(245, 158, 11, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(245, 158, 11, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-2xl lg:text-3xl filter drop-shadow-lg">💰</span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Record Payment
                </h1>
                <p className="mt-1 flex items-center space-x-2 text-sm lg:text-base" style={{ color: '#6b7280' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #22c55e, #f59e0b)'
                  }}></span>
                  <span>Log a payment received from a player</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-2 text-xs rounded-lg px-3 py-2 backdrop-blur-sm" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#6b7280'
              }}>
                <span>💳</span>
                <span>Payment Management</span>
              </div>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(34, 197, 94, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.color = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.color = '#6b7280'
                }}
              >
                <span className="mr-2">←</span>
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Success Message */}
        {submitSuccess && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>✅</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: '#15803d' }}>Payment recorded successfully!</span>
                  <p className="mt-1 text-sm" style={{ color: '#166534' }}>{submitSuccess}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Error Message */}
        {submitError && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(239, 68, 68, 0.2)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>❌</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: '#dc2626' }}>Error recording payment</span>
                  <p className="mt-1 text-sm" style={{ color: '#b91c1c' }}>{submitError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Payment Form */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full blur-3xl translate-x-28 translate-y-28" style={{
            background: 'linear-gradient(to top left, rgba(245, 158, 11, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(34, 197, 94, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-xl filter drop-shadow-lg">💳</span>
              </div>
              <h3 className="text-lg font-semibold" style={{
                background: 'linear-gradient(to right, #f59e0b, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Payment Details Form</h3>
            </div>
            
            <PaymentForm
              onSubmit={handlePaymentSubmit}
              loading={isSubmitting}
              organizerId={user.id}
              players={players}
            />
          </div>
        </div>
      </div>
      </div>
    </RoleGuard>
  )
}