'use client'

import { useState, useEffect } from 'react'

import { EditPaymentModal } from '@/components/business/EditPaymentModal'
import { Button } from '@/components/ui/Button'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { formatMoney } from '@/lib/calculations/money'
import { paymentService } from '@/lib/services/payments'
import { cn } from '@/lib/utils/cn'

export interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  notes?: string
  reference_number?: string
  player_id: string
  organizer_id: string
}

export interface Player {
  id: string
  name: string
  phone: string
  currentBalance: number
}

interface PlayerPaymentHistoryModalProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
  organizerId?: string
  isOrganizer?: boolean
  onPaymentsUpdate?: () => void
}

export function PlayerPaymentHistoryModal({
  player,
  isOpen,
  onClose,
  organizerId,
  isOrganizer = false,
  onPaymentsUpdate
}: PlayerPaymentHistoryModalProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [savingPayment, setSavingPayment] = useState(false)

  // Load payment history when modal opens
  useEffect(() => {
    if (isOpen && player && organizerId) {
      loadPayments()
    }
  }, [isOpen, player, organizerId])

  const loadPayments = async () => {
    if (!player || !organizerId) return
    
    setLoading(true)
    try {
      const paymentData = await paymentService.getPaymentsByPlayer(player.id)
      setPayments(paymentData)
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment)
  }

  const handleSavePayment = async (paymentId: string, updates: Partial<Payment>) => {
    setSavingPayment(true)
    try {
      await paymentService.updatePayment(paymentId, updates)
      
      // Immediately refresh the current player's payment list
      await loadPayments()
      
      // Notify parent component to refresh all player data (this handles the paired player)
      onPaymentsUpdate?.()
      
      setEditingPayment(null)
    } catch (error) {
      console.error('Error saving payment:', error)
      alert('Failed to save payment. Please try again.')
    } finally {
      setSavingPayment(false)
    }
  }

  const handleDeletePayment = async (payment: Payment) => {
    if (!confirm(`Are you sure you want to delete this payment of ${formatMoney(payment.amount)}?`)) {
      return
    }
    
    try {
      await paymentService.deletePayment(payment.id)
      await loadPayments() // Refresh the list
      onPaymentsUpdate?.() // Notify parent component
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Failed to delete payment. Please try again.')
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      'cash': 'bg-green-100 text-green-800',
      'paynow': 'bg-blue-100 text-blue-800',
      'bank_transfer': 'bg-purple-100 text-purple-800',
      'credit_transfer': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    }
    return colors[method as keyof typeof colors] || colors.other
  }

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { label: 'Owes', color: 'text-red-600', bg: 'bg-red-50' }
    if (balance < 0) return { label: 'Credit', color: 'text-green-600', bg: 'bg-green-50' }
    return { label: 'Settled', color: 'text-gray-600', bg: 'bg-gray-50' }
  }

  if (!isOpen || !player) return null

  const balanceStatus = getBalanceStatus(player.currentBalance)

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300"
      style={{
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{player.name}</h2>
              <p className="text-sm text-gray-600">{player.phone}</p>
              <div className="flex items-center mt-2 space-x-3">
                <div className={cn('px-3 py-1 rounded-lg', balanceStatus.bg)}>
                  <MoneyDisplay 
                    value={player.currentBalance} 
                    size="sm" 
                    className={cn('font-semibold', balanceStatus.color)}
                  />
                </div>
                <span className={cn('text-xs font-medium', balanceStatus.color)}>
                  {balanceStatus.label}
                </span>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-gray-600 w-10 h-10 p-0"
            >
              <span className="text-xl">✕</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            {loading && (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-gray-400">💳</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">This player hasn't made any payments yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map(payment => (
                <div key={payment.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <MoneyDisplay 
                          value={payment.amount} 
                          size="base"
                          className="font-semibold text-gray-900"
                        />
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getPaymentMethodBadge(payment.payment_method)
                        )}>
                          {payment.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {payment.reference_number && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Reference:</span> {payment.reference_number}
                        </p>
                      )}
                      
                      {payment.notes && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {payment.notes}
                        </p>
                      )}
                    </div>
                    
                    {isOrganizer && (
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPayment(payment)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit Payment"
                        >
                          <span className="text-sm">✏️</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePayment(payment)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete Payment"
                        >
                          <span className="text-sm">🗑️</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-6 border-t border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="relative overflow-hidden font-bold transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 transform"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                color: '#374151',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                minHeight: '44px',
                paddingLeft: '24px',
                paddingRight: '24px'
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
      
      {/* Edit Payment Modal */}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          isOpen={true}
          onClose={() => setEditingPayment(null)}
          onSave={handleSavePayment}
          loading={savingPayment}
        />
      )}
    </div>
  )
}