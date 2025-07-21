'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { EditPaymentModal } from '@/components/business/EditPaymentModal'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { balanceService } from '@/lib/services/balances'
import { paymentService } from '@/lib/services/payments'
import { sessionService } from '@/lib/services/sessions'
import { cn } from '@/lib/utils/cn'

interface FinancialTransaction {
  id: string
  type: 'charge' | 'payment'
  date: string
  playerName: string
  description: string
  amount: number
  balance?: number
  paymentId?: string
  paymentMethod?: string
  notes?: string
  reference?: string
}

export default function FinancialReportsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'charges' | 'payments'>('all')
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d')
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading, router])

  // Load financial transactions
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        setError(null)
        
        // Calculate date filter
        let fromDate: string | undefined
        if (dateRange !== 'all') {
          const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
          const date = new Date()
          date.setDate(date.getDate() - days)
          fromDate = date.toISOString().split('T')[0]
        }

        // Load sessions and payments in parallel
        const [sessions, payments] = await Promise.all([
          sessionService.getSessionsByOrganizer(user.id, 'completed'),
          paymentService.getPaymentsByOrganizer(user.id, 200) // Get more records
        ])

        console.log('📊 Loaded sessions:', sessions.length)
        console.log('💰 Loaded payments:', payments.length)

        // Transform sessions to charges
        const charges: FinancialTransaction[] = []
        sessions.forEach(session => {
          if (session.participants) {
            session.participants.forEach(participant => {
              if (participant.player && participant.amount_owed) {
                charges.push({
                  id: `charge-${session.id}-${participant.player.id}`,
                  type: 'charge',
                  date: session.session_date,
                  playerName: participant.player.name,
                  description: `Session at ${session.location || 'Unknown Location'}`,
                  amount: participant.amount_owed
                })
              }
            })
          }
        })

        // Transform payments
        const paymentTransactions: FinancialTransaction[] = payments.map(payment => ({
          id: `payment-${payment.id}`,
          type: 'payment',
          date: payment.payment_date,
          playerName: payment.player?.name || 'Unknown Player',
          description: `Payment via ${payment.payment_method}${payment.reference_number ? ` (${payment.reference_number})` : ''}`,
          amount: payment.amount,
          paymentId: payment.id,
          paymentMethod: payment.payment_method,
          notes: payment.notes,
          reference: payment.reference_number
        }))

        // Combine and sort by date
        let allTransactions = [...charges, ...paymentTransactions]
        
        // Apply date filter
        if (fromDate) {
          allTransactions = allTransactions.filter(t => t.date >= fromDate!)
        }

        // Sort by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setTransactions(allTransactions)
        console.log('📈 Total transactions:', allTransactions.length)

      } catch (err: any) {
        console.error('Error loading financial transactions:', err)
        setError(err.message || 'Failed to load financial data')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [user?.id, dateRange])

  // Handle payment edit
  const handleEditPayment = (transaction: FinancialTransaction) => {
    if (transaction.type === 'payment' && transaction.paymentId) {
      setEditingPayment({
        id: transaction.paymentId,
        amount: transaction.amount,
        payment_date: transaction.date,
        payment_method: transaction.paymentMethod || 'PayNow',
        notes: transaction.notes || '',
        reference: transaction.reference || ''
      })
      setShowEditModal(true)
    }
  }

  // Handle payment update
  const handleUpdatePayment = async (paymentId: string, updates: any) => {
    try {
      setActionLoading(true)
      await paymentService.updatePayment(paymentId, updates)
      
      // Refresh transactions
      const loadTransactions = async () => {
        if (!user?.id) return
        
        try {
          const [sessions, payments] = await Promise.all([
            sessionService.getSessionsByOrganizer(user.id, 'completed'),
            paymentService.getPaymentsByOrganizer(user.id, 200)
          ])
          
          // Transform and combine transactions (same logic as before)
          const charges: FinancialTransaction[] = []
          sessions.forEach(session => {
            if (session.participants) {
              session.participants.forEach(participant => {
                if (participant.player && participant.amount_owed) {
                  charges.push({
                    id: `charge-${session.id}-${participant.player.id}`,
                    type: 'charge',
                    date: session.session_date,
                    playerName: participant.player.name,
                    description: `Session at ${session.location || 'Unknown Location'}`,
                    amount: participant.amount_owed
                  })
                }
              })
            }
          })
          
          const paymentTransactions: FinancialTransaction[] = payments.map(payment => ({
            id: `payment-${payment.id}`,
            type: 'payment',
            date: payment.payment_date,
            playerName: payment.player?.name || 'Unknown Player',
            description: `Payment via ${payment.payment_method}${payment.reference_number ? ` (${payment.reference_number})` : ''}`,
            amount: payment.amount,
            paymentId: payment.id,
            paymentMethod: payment.payment_method,
            notes: payment.notes,
            reference: payment.reference_number
          }))
          
          let allTransactions = [...charges, ...paymentTransactions]
          
          // Apply date filter
          if (dateRange !== 'all') {
            const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
            const date = new Date()
            date.setDate(date.getDate() - days)
            const fromDate = date.toISOString().split('T')[0]
            allTransactions = allTransactions.filter(t => t.date >= fromDate)
          }
          
          allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          setTransactions(allTransactions)
        } catch (err: any) {
          console.error('Error refreshing transactions:', err)
          setError(err.message || 'Failed to refresh data')
        }
      }
      
      await loadTransactions()
    } catch (err: any) {
      console.error('Error updating payment:', err)
      setError(err.message || 'Failed to update payment')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle payment deletion
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return
    }
    
    try {
      setActionLoading(true)
      await paymentService.deletePayment(paymentId)
      
      // Remove payment from transactions
      setTransactions(prev => prev.filter(t => t.paymentId !== paymentId))
    } catch (err: any) {
      console.error('Error deleting payment:', err)
      setError(err.message || 'Failed to delete payment')
    } finally {
      setActionLoading(false)
    }
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.03), #ffffff, rgba(59, 130, 246, 0.03))'
      }}>
        {/* Premium Loading Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.05), transparent, rgba(59, 130, 246, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(59, 130, 246, 0.1), transparent)'
        }}></div>
        
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-2xl mb-6" style={{
            background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-4xl filter drop-shadow-lg">📊</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'rgba(34, 197, 94, 0.2)' }}></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: '#22c55e' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold" style={{
                background: 'linear-gradient(to right, #22c55e, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Loading Financial Reports
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Preparing financial analytics...
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

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'charges') return t.type === 'charge'
    if (filter === 'payments') return t.type === 'payment'
    return true
  })

  // Calculate totals
  const totalCharges = transactions.filter(t => t.type === 'charge').reduce((sum, t) => sum + t.amount, 0)
  const totalPayments = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0)
  const netAmount = totalPayments - totalCharges

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.03), #ffffff, rgba(59, 130, 246, 0.03))'
    }}>
      {/* Premium Background Pattern */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.05), transparent, rgba(59, 130, 246, 0.05))'
      }}></div>
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
        background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.08), transparent)'
      }}></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
        background: 'linear-gradient(to top left, rgba(59, 130, 246, 0.08), transparent)'
      }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
        background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), transparent)'
      }}></div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-4 space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(59, 130, 246, 0.12) 100%)',
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
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(59, 130, 246, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-3xl filter drop-shadow-lg">📊</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #22c55e, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Financial Reports
                </h1>
                <p className="mt-1 flex items-center space-x-2 text-base" style={{ color: '#6b7280' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #22c55e, #3b82f6)'
                  }}></span>
                  <span>Complete history of charges and payments</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(59, 130, 246, 0.2)',
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
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(220, 38, 38, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(239, 68, 68, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="relative p-6 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-xl filter drop-shadow-lg">💸</span>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#6b7280' }}>Total Charges</p>
              <MoneyDisplay value={totalCharges} size="xl" className="font-bold text-red-600" />
            </div>
          </div>

          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(16, 185, 129, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(34, 197, 94, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="relative p-6 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-xl filter drop-shadow-lg">💰</span>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#6b7280' }}>Total Payments</p>
              <MoneyDisplay value={totalPayments} size="xl" className="font-bold text-green-600" />
            </div>
          </div>

          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(59, 130, 246, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="relative p-6 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-xl filter drop-shadow-lg">⚖️</span>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#6b7280' }}>Net Amount</p>
              <MoneyDisplay 
                value={netAmount} 
                size="xl" 
                className={cn(
                  'font-bold',
                  netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                )} 
              />
            </div>
          </div>
        </div>

        {/* Premium Filters */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(245, 158, 11, 0.12) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(124, 58, 237, 0.15)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="relative p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium" style={{ color: '#6b7280' }}>Filter:</label>
                <div className="flex space-x-2">
                  {[
                    { key: 'all', label: 'All', icon: '📋' },
                    { key: 'charges', label: 'Charges', icon: '💸' },
                    { key: 'payments', label: 'Payments', icon: '💰' }
                  ].map(filterOption => (
                    <button
                      key={filterOption.key}
                      onClick={() => setFilter(filterOption.key as any)}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm',
                        filter === filterOption.key
                          ? 'text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-200'
                      )}
                      style={{
                        ...(filter === filterOption.key 
                          ? { 
                              background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                              border: '1px solid rgba(59, 130, 246, 0.2)'
                            }
                          : {
                              background: 'rgba(255, 255, 255, 0.5)',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            })
                      }}
                    >
                      <span>{filterOption.icon}</span>
                      <span>{filterOption.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium" style={{ color: '#6b7280' }}>Period:</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-3 py-2 border rounded-lg text-sm transition-all duration-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#374151'
                  }}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Transactions Table */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 translate-y-32" style={{
            background: 'linear-gradient(to top right, rgba(245, 158, 11, 0.08), transparent)'
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
          
          <div className="relative">
            <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                    background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(34, 197, 94, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <span className="text-xl filter drop-shadow-lg">💼</span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{
                    background: 'linear-gradient(to right, #f59e0b, #22c55e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Transaction History
                  </h3>
                </div>
                <span className="px-3 py-1 text-sm font-medium rounded-full backdrop-blur-sm" style={{
                  background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(34, 197, 94, 0.1))',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#1d4ed8'
                }}>
                  {filteredTransactions.length} transactions
                </span>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 rounded-lg backdrop-blur-sm" style={{
                      background: 'rgba(255, 255, 255, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8 relative overflow-hidden rounded-2xl" style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p style={{ color: '#6b7280' }}>{error}</p>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 relative overflow-hidden rounded-2xl" style={{
                  background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%)',
                  border: '1px solid rgba(156, 163, 175, 0.2)'
                }}>
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">📊</div>
                    <p style={{ color: '#6b7280' }}>No transactions found for the selected period</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center space-x-4 p-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm" style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg backdrop-blur-sm',
                        transaction.type === 'charge' 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-green-100 text-green-600'
                      )}>
                        {transaction.type === 'charge' ? '💸' : '💰'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 truncate">{transaction.playerName}</p>
                          <span className={cn(
                            'px-2 py-1 text-xs rounded-full backdrop-blur-sm',
                            transaction.type === 'charge'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          )}>
                            {transaction.type === 'charge' ? 'Charge' : 'Payment'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{transaction.description}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        <MoneyDisplay 
                          value={transaction.amount} 
                          className={cn(
                            'font-semibold',
                            transaction.type === 'charge' ? 'text-red-600' : 'text-green-600'
                          )}
                        />
                        {transaction.type === 'payment' && transaction.paymentId && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditPayment(transaction)}
                              disabled={actionLoading}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Edit payment"
                            >
                              <span className="text-sm">✏️</span>
                            </button>
                            <button
                              onClick={() => handleDeletePayment(transaction.paymentId!)}
                              disabled={actionLoading}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Delete payment"
                            >
                              <span className="text-sm">🗑️</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Payment Modal */}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingPayment(null)
          }}
          onSave={handleUpdatePayment}
          loading={actionLoading}
        />
      )}
    </div>
  )
}