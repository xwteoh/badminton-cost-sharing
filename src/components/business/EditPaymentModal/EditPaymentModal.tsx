'use client'

import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { money } from '@/lib/calculations/money'
import { cn } from '@/lib/utils/cn'

interface PaymentData {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  notes?: string
  reference_number?: string
}

interface EditPaymentModalProps {
  payment: PaymentData
  isOpen: boolean
  onClose: () => void
  onSave: (paymentId: string, updates: Partial<PaymentData>) => Promise<void>
  loading?: boolean
}

export function EditPaymentModal({ 
  payment, 
  isOpen, 
  onClose, 
  onSave, 
  loading = false 
}: EditPaymentModalProps) {
  const [formData, setFormData] = useState({
    amount: payment.amount,
    payment_date: payment.payment_date,
    payment_method: payment.payment_method,
    notes: payment.notes || '',
    reference: payment.reference_number || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when payment changes
  useEffect(() => {
    setFormData({
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      notes: payment.notes || '',
      reference: payment.reference_number || ''
    })
    setErrors({})
  }, [payment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    
    // Allow negative amounts for credit transfers, but not zero or empty
    if (formData.amount === 0 || formData.amount === null || formData.amount === undefined) {
      newErrors.amount = 'Payment amount cannot be zero'
    } else if (formData.payment_method !== 'credit_transfer' && formData.amount <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0'
    }
    
    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required'
    }
    
    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      await onSave(payment.id, {
        amount: formData.amount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        reference_number: formData.reference || null
      })
      onClose()
    } catch (error) {
      console.error('Error saving payment:', error)
    }
  }

  if (!isOpen) return null

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
        className="max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95"
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
            <h2 className="text-xl font-bold text-gray-900">Edit Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <MoneyInput
              id="amount"
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
              placeholder="0.00"
              className={cn(
                "w-full",
                errors.amount && "border-red-500"
              )}
            />
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              id="payment_date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                errors.payment_date && "border-red-500"
              )}
            />
            {errors.payment_date && (
              <p className="text-sm text-red-600 mt-1">{errors.payment_date}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              id="payment_method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                errors.payment_method && "border-red-500"
              )}
            >
              <option value="">Select payment method</option>
              <option value="paynow">PayNow</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_transfer">Credit Transfer</option>
              <option value="other">Other</option>
            </select>
            {errors.payment_method && (
              <p className="text-sm text-red-600 mt-1">{errors.payment_method}</p>
            )}
          </div>

          {/* Reference */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
              Reference (Optional)
            </label>
            <input
              type="text"
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="PayNow reference number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this payment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-xl hover:-translate-y-1 transform"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                color: 'white',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                minHeight: '48px',
                paddingLeft: '32px',
                paddingRight: '32px'
              }}
            >
              <span className="relative z-10 flex items-center space-x-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">💾</span>
                    <span>Save Changes</span>
                  </>
                )}
              </span>
            </Button>
            
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 transform"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                color: '#374151',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                minHeight: '48px',
                paddingLeft: '32px',
                paddingRight: '32px'
              }}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span className="text-xl">✕</span>
                <span>Cancel</span>
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}